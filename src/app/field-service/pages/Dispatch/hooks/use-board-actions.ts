"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import {
  addLoads,
  captureSnapshot,
  stopLoad,
  useAppointmentStore,
  useContainerTypes,
  useDirectory,
  useDispatchActions,
  useOptimizer,
  useRouteInstanceStore,
  useServiceItems,
  useServicePoints,
  utilisation,
} from "@/features/field-service";
import {
  type Appointment,
  type InstanceClosure,
  MOCK_NOW,
  type Route,
  type RouteInstance,
} from "@/mocks";
import { dubaiDateTime } from "../../../utils";

/** The calendar day after `dayKey`. */
const nextDayKey = (dayKey: string) =>
  new Date(Date.parse(`${dayKey}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);

import {
  type BoardActions,
  CANCELLABLE_STATUSES,
  canOptimize,
  type DefaultRoute,
  fitsVehicle,
  isMovable,
  RESOLVED_STATUSES,
  type RoutePlan,
  RUN_CANCEL_REASON,
  slotKind,
  slotLabel,
  VEHICLE_CLASS,
  WINDOW_HOURS,
  withoutSlotFlags,
} from "../../../components";

/** Where a stop slots into a route's drive order: by its planned arrival. */
function insertIndex(plan: RoutePlan, appointment: Appointment) {
  const index = plan.stops.findIndex(
    (stop) => stop.plannedStart > appointment.plannedStart,
  );
  return index === -1 ? plan.stops.length : index;
}

/** "RWC-DXB-REL-001": the Route code reads better in a toast than the name. */
const codeOf = (plan: RoutePlan) => plan.template?.code ?? plan.route.name;

/** The instance as the store holds it right now, so chained patches stack. */
function latest(plan: RoutePlan): RouteInstance {
  const patch = useRouteInstanceStore.getState().patches[plan.route.id];
  return patch ? { ...plan.route, ...patch } : plan.route;
}

/**
 * The board's fake dispatch actions. Each one patches session state through
 * `useDispatchActions` and confirms with a toast: nothing is persisted.
 */
export function useBoardActions(
  plans: RoutePlan[],
  backlog: Appointment[],
  defaultRoutes: Map<string, DefaultRoute>,
) {
  const dispatch = useDispatchActions();
  const updateAppointment = useAppointmentStore((s) => s.update);
  const directory = useDirectory();
  const { optimize: runOptimizer } = useOptimizer();
  const servicePoints = useServicePoints().data;
  const items = useServiceItems().data;
  const containerTypes = useContainerTypes().data;

  return useMemo(() => {
    const planOf = (routeId: string) =>
      plans.find((p) => p.route.id === routeId);
    const appointmentOf = (id: string) =>
      plans.flatMap((p) => p.stops).find((a) => a.id === id) ??
      backlog.find((a) => a.id === id);

    /**
     * Confirm = the old lock, plus the instance status (spec section 6.1),
     * plus the forecast frozen for forecast-vs-actual later (section 8.5).
     */
    const confirm = (plan: RoutePlan) => {
      dispatch.setLocked(plan.route.id, true);
      dispatch.patch(plan.route.id, {
        status: "confirmed",
        forecastSnapshot:
          plan.load && plan.template && servicePoints
            ? captureSnapshot(
                plan.load,
                plan.template,
                plan.load.truckTypeId,
                plan.stops,
                { servicePoints },
                MOCK_NOW,
              )
            : null,
      });
    };

    const actions: BoardActions = {
      closeRun: (routeId, input) => {
        const plan = planOf(routeId);
        if (!plan || plan.closed) return;
        const resolved: InstanceClosure["resolved"] = [];
        for (const [id, resolution] of Object.entries(input.resolutions)) {
          const apt = plan.stops.find((a) => a.id === id);
          if (!apt || RESOLVED_STATUSES.includes(apt.status)) continue;
          if (resolution.outcome === "missed") {
            // Missed with a reason: a failed visit, its open work orders not done.
            updateAppointment(id, {
              status: "failed",
              failedReason: resolution.reason,
              startedAt: apt.startedAt ?? MOCK_NOW,
              completedAt: MOCK_NOW,
              workOrders: apt.workOrders.map((wo) =>
                ["completed", "partial", "not-done", "cancelled"].includes(
                  wo.status,
                )
                  ? wo
                  : {
                      ...wo,
                      status: "not-done",
                      countDone: 0,
                      reason: resolution.reason,
                      completedAt: MOCK_NOW,
                    },
              ),
            });
            resolved.push({ appointmentId: id, outcome: "missed" });
          } else {
            // Rescheduled: back to the backlog on the next day, same window.
            const next = nextDayKey(plan.route.date);
            const [from, to] = WINDOW_HOURS[apt.window];
            dispatch.move(id, null);
            updateAppointment(id, {
              status: "scheduled",
              rescheduled: {
                reason: "ran_out_of_shift",
                requestedBy: "operations",
                fromDay: plan.route.date,
                at: MOCK_NOW,
              },
              windowStart: dubaiDateTime(next, from),
              windowEnd: dubaiDateTime(next, to),
              plannedStart: dubaiDateTime(next, from),
            });
            resolved.push({ appointmentId: id, outcome: "rescheduled" });
          }
        }
        // Actuals after the decisions: a stop marked missed may already have
        // recorded part of its work, and that load was carried.
        const missed = new Set(
          resolved
            .filter((r) => r.outcome === "missed")
            .map((r) => r.appointmentId),
        );
        const carried = plan.stops.filter(
          (a) =>
            missed.has(a.id) ||
            a.status === "completed" ||
            a.status === "failed",
        );
        const actual =
          plan.load && plan.template && servicePoints && items && containerTypes
            ? utilisation(
                plan.load.capacity,
                addLoads(
                  carried.map((a) =>
                    stopLoad(plan.template as Route, a, "actual", {
                      servicePoints,
                      items,
                      containerTypes,
                    }),
                  ),
                ),
              ).limits.map((l) => ({
                kind: l.kind,
                unit: l.unit,
                value: l.consumed,
              }))
            : [];
        dispatch.patch(routeId, {
          closure: {
            at: MOCK_NOW,
            by: "usr_1",
            odometerOut: input.odometerOut,
            odometerIn: input.odometerIn,
            tipTickets: input.tipTickets,
            actual,
            resolved,
            note: input.note,
            adjustments: [],
          },
        });
        toast.success(`${plan.route.name} closed`, {
          description: resolved.length
            ? `${resolved.length} open ${resolved.length === 1 ? "stop" : "stops"} resolved. Actuals are locked; corrections go in as adjustments.`
            : "Actuals are locked; corrections go in as adjustments.",
        });
      },

      addAdjustment: (routeId, note) => {
        const plan = planOf(routeId);
        const closure = plan && latest(plan).closure;
        if (!plan || !closure) return;
        dispatch.patch(routeId, {
          closure: {
            ...closure,
            adjustments: [
              ...closure.adjustments,
              { at: MOCK_NOW, by: "usr_1", note },
            ],
          },
        });
        toast.success("Adjustment added", { description: note });
      },

      moveStops: (appointmentIds, toRouteId) => {
        const to = planOf(toRouteId);
        if (!to || to.locked || !appointmentIds.length) return;
        const from = plans.find((p) =>
          p.stops.some((a) => a.id === appointmentIds[0]),
        );
        for (const id of appointmentIds) dispatch.move(id, toRouteId);
        // The stale generation flag goes with the split that resolves it.
        if (from)
          dispatch.patch(from.route.id, {
            flags: latest(from).flags.filter((f) => f.kind !== "over-capacity"),
          });
        toast.success(
          `${appointmentIds.length} ${appointmentIds.length === 1 ? "stop" : "stops"} moved to ${to.route.name}`,
          { description: "Over capacity resolved by splitting the run." },
        );
      },

      cancelRuns: (routeIds, reason, note) => {
        const targets = routeIds
          .map(planOf)
          .filter(
            (p): p is RoutePlan =>
              p !== undefined &&
              !p.closed &&
              CANCELLABLE_STATUSES.includes(p.route.status),
          );
        let returned = 0;
        for (const plan of targets) {
          // The run's record stays (rule 8); its open stops wait in the backlog.
          for (const apt of plan.stops) {
            if (RESOLVED_STATUSES.includes(apt.status)) continue;
            dispatch.move(apt.id, null);
            returned++;
          }
          dispatch.patch(plan.route.id, {
            status: "cancelled",
            cancellation: { reason, note, at: MOCK_NOW, by: "usr_1" },
          });
        }
        if (!targets.length) return;
        toast.success(
          targets.length === 1
            ? `${targets[0].route.name} cancelled`
            : `${targets.length} runs cancelled`,
          {
            description: `${RUN_CANCEL_REASON[reason]}. ${returned} open ${returned === 1 ? "stop" : "stops"} back in the backlog.`,
          },
        );
      },

      acceptExtraTrips: (routeId, count) => {
        const plan = planOf(routeId);
        if (!plan || plan.locked) return;
        const current = latest(plan);
        dispatch.patch(routeId, {
          extraTrips: {
            count: (current.extraTrips?.count ?? 0) + count,
            acceptedBy: "usr_1",
            at: MOCK_NOW,
          },
          flags: current.flags.filter((f) => f.kind !== "over-capacity"),
        });
        toast.success(
          `${count} extra ${count === 1 ? "trip" : "trips"} accepted on ${plan.route.name}`,
          {
            description:
              "Recorded with your name; the capacity bar now counts it.",
          },
        );
      },

      assign: (appointmentId, routeId) => {
        const apt = appointmentOf(appointmentId);
        const ref = apt?.ref ?? "Appointment";
        if (routeId === null) {
          dispatch.move(appointmentId, null);
          toast.success(`${ref} sent to the backlog`);
          return;
        }
        const plan = planOf(routeId);
        if (!plan || plan.locked) return;
        const index = apt ? insertIndex(plan, apt) : plan.stops.length;
        dispatch.move(appointmentId, routeId, index);
        toast.success(`${ref} moved to ${plan.route.name}`, {
          description:
            apt && !fitsVehicle(apt, plan.vehicle?.vehicleClass)
              ? `Stop ${index + 1}: check the vehicle, this work needs a different truck.`
              : `Stop ${index + 1} of ${plan.stops.length + 1}.`,
        });
      },

      setConfirmed: (routeId, confirmed, force = false) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const name = plan.route.name;
        if (!confirmed) {
          dispatch.setLocked(routeId, false);
          const unstaffed = plan.openSlots.length > 0;
          dispatch.patch(routeId, {
            status: unstaffed ? "unstaffed" : "planned",
          });
          toast.success(`${name} reopened`, {
            description: "Stops and staffing can change again.",
          });
          return;
        }
        if (plan.blockers.length && !force) return;
        confirm(plan);
        toast.success(`${name} confirmed`, {
          description: force
            ? `Confirmed with an override: ${plan.blockers.join(", ")}.`
            : "Its stops are locked for the shift.",
        });
      },

      setVehicle: (routeId, vehicleId) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const route = latest(plan);
        dispatch.patch(routeId, {
          vehicleId,
          staffing: { ...route.staffing, truck: "manual" },
          flags: withoutSlotFlags(route.flags, "truck"),
        });
        const vehicle = directory.vehicle(vehicleId);
        toast.success(`Vehicle changed to ${vehicle?.plate}`, {
          description: vehicle
            ? `${VEHICLE_CLASS[vehicle.vehicleClass]} on ${plan.route.name}.`
            : undefined,
        });
      },

      setPrimary: (routeId, serviceProId) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const route = latest(plan);
        dispatch.patch(routeId, {
          primaryServiceProId: serviceProId,
          staffing: { ...route.staffing, driver: "manual" },
          flags: withoutSlotFlags(route.flags, "driver"),
        });
        toast.success(
          `${directory.servicePro(serviceProId)?.name} now drives ${plan.route.name}`,
        );
      },

      staff: (routeId, slot, assetId) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const route = latest(plan);
        const kind = slotKind(slot);
        const flags = withoutSlotFlags(route.flags, slot);
        const stillOpen = plan.openSlots.filter((s) => s.slot !== slot);
        dispatch.patch(routeId, {
          ...(kind === "truck"
            ? { vehicleId: assetId }
            : kind === "driver"
              ? { primaryServiceProId: assetId }
              : {
                  crew: [
                    ...route.crew,
                    { serviceProId: assetId, role: "secondary" as const },
                  ],
                }),
          staffing: { ...route.staffing, [slot]: "manual" },
          flags,
          status:
            route.status === "unstaffed" && stillOpen.length === 0
              ? "planned"
              : route.status,
        });
        const name =
          kind === "truck"
            ? directory.vehicle(assetId)?.plate
            : directory.servicePro(assetId)?.name;
        toast.success(`${name} staffed as ${slotLabel(slot)}`, {
          description:
            stillOpen.length === 0
              ? `${plan.route.name} is fully staffed and ready to confirm.`
              : `${plan.route.name} still needs: ${stillOpen.map((s) => slotLabel(s.slot)).join(", ")}.`,
        });
      },

      // Done in one patch: `move` reads the route from its last render, so
      // calling it per stop would keep only the last removal.
      clearRoute: (routeId) => {
        const plan = planOf(routeId);
        if (!plan) return;
        const moving = plan.stops.filter(isMovable).map((a) => a.id);
        const kept = plan.route.appointmentIds.filter(
          (id) => !moving.includes(id),
        );
        dispatch.patch(routeId, {
          appointmentIds: kept,
          tippingTrips: plan.route.tippingTrips.filter((t) =>
            kept.includes(t.afterAppointmentId),
          ),
        });
        for (const id of moving)
          updateAppointment(id, { routeInstanceId: null });
        toast.success(
          `${moving.length} ${moving.length === 1 ? "stop" : "stops"} sent to the backlog`,
          { description: `From ${plan.route.name}.` },
        );
      },

      optimize: (routeId) => {
        const plan = planOf(routeId);
        if (!plan || !canOptimize(plan)) return;
        const result = runOptimizer(routeId);
        if (!result) return;
        const code = codeOf(plan);
        if (result.unchanged || !("undo" in result)) {
          toast(`${code}: already in the best order`, {
            description: "Fewer than two open stops to re-sequence.",
          });
          return;
        }
        const before = result.before?.total ?? "-";
        const after = result.after?.total ?? "-";
        // Re-timed but no better: say so rather than claim a gain.
        const same = before === after;
        toast.success(
          same
            ? `${code}: already in the best order`
            : `${code} optimised: ${before} → ${after}`,
          {
            description: same
              ? `Score stays at ${after}. Planned times recalculated.`
              : "Open stops re-sequenced by window, then nearest stop. Planned times updated.",
            action: {
              label: "Undo",
              onClick: () => {
                result.undo();
                toast(`${code}: original order restored`);
              },
            },
          },
        );
      },
    };

    /** Header: confirm every instance with nothing blocking it. */
    const confirmAllReady = () => {
      const open = plans.filter((p) => p.plannable && !p.locked);
      const ready = open.filter((p) => p.blockers.length === 0);
      const blocked = open.filter((p) => p.blockers.length > 0);
      for (const plan of ready) confirm(plan);
      if (ready.length === 0) {
        toast.warning("Nothing ready to confirm", {
          description: blocked.length
            ? `${blocked.length} ${blocked.length === 1 ? "instance needs" : "instances need"} staffing or a capacity fix first.`
            : "Every instance on this day is already confirmed or under way.",
        });
        return;
      }
      toast.success(
        `Confirmed ${ready.length} ${ready.length === 1 ? "instance" : "instances"}`,
        {
          description: blocked.length
            ? `Still to resolve: ${blocked.map((p) => `${p.template?.code ?? p.route.name} (${p.blockers.join(", ")})`).join("; ")}.`
            : "The whole day is confirmed.",
        },
      );
    };

    /**
     * Place backlog: each open job goes to its default route's instance (R24)
     * when that's open, else the first unconfirmed instance whose truck can
     * carry its first work order. Batched per instance like `clearRoute`.
     */
    const placeBacklog = () => {
      const added = new Map<string, Appointment[]>();
      const unplaced: Appointment[] = [];
      let onDefault = 0;
      const open = (p: RoutePlan | undefined): p is RoutePlan =>
        p !== undefined &&
        !p.locked &&
        p.route.status !== "cancelled" &&
        p.route.status !== "completed";
      for (const apt of backlog) {
        const preferred = defaultRoutes.get(apt.id)?.plan;
        const plan = open(preferred)
          ? preferred
          : plans.find(
              (p) => open(p) && fitsVehicle(apt, p.vehicle?.vehicleClass),
            );
        if (!plan) {
          unplaced.push(apt);
          continue;
        }
        if (plan === preferred) onDefault++;
        added.set(plan.route.id, [...(added.get(plan.route.id) ?? []), apt]);
      }

      for (const [routeId, apts] of added) {
        const plan = planOf(routeId);
        if (!plan) continue;
        const stops = [...plan.stops, ...apts].sort((a, b) =>
          a.plannedStart.localeCompare(b.plannedStart),
        );
        // Keep the existing drive order and slot the new stops in by time.
        const ids = [...plan.route.appointmentIds];
        for (const apt of apts) {
          const next = stops
            .slice(stops.indexOf(apt) + 1)
            .find((s) => ids.includes(s.id));
          ids.splice(next ? ids.indexOf(next.id) : ids.length, 0, apt.id);
        }
        dispatch.patch(routeId, { appointmentIds: ids });
        for (const apt of apts)
          updateAppointment(apt.id, { routeInstanceId: routeId });
      }

      const placed = backlog.length - unplaced.length;
      if (backlog.length === 0) {
        toast("Nothing to place", {
          description: "The backlog for this day is empty.",
        });
      } else if (placed === 0) {
        toast.warning("Couldn't place any backlog", {
          description:
            "No unconfirmed instance has a truck that suits the backlog's work.",
        });
      } else {
        toast.success(
          `Placed ${placed} of ${backlog.length} backlog ${backlog.length === 1 ? "job" : "jobs"}`,
          {
            description: unplaced.length
              ? `${unplaced.map((a) => a.ref).join(", ")} still need${unplaced.length === 1 ? "s" : ""} an unconfirmed instance with a suitable truck.`
              : `${onDefault} on ${onDefault === 1 ? "its" : "their"} default route, across ${added.size} ${added.size === 1 ? "instance" : "instances"}.`,
          },
        );
      }
    };

    /**
     * Header: optimise every unconfirmed, open instance on the day. One Undo
     * reverts the whole batch; confirmed / closed ones are skipped and named.
     */
    const optimizeAll = () => {
      const eligible = plans.filter(canOptimize);
      const skipped = plans.filter((p) => !canOptimize(p));
      const undos: (() => void)[] = [];
      const gains: { before: number; after: number }[] = [];
      let unchanged = 0;
      let improved = 0;
      for (const plan of eligible) {
        const result = runOptimizer(plan.route.id);
        if (!result) continue;
        if (result.unchanged || !("undo" in result)) {
          unchanged++;
          continue;
        }
        undos.push(result.undo);
        if ((result.after?.total ?? 0) > (result.before?.total ?? 0))
          improved++;
        else unchanged++;
        if (result.before && result.after)
          gains.push({
            before: result.before.total,
            after: result.after.total,
          });
      }
      const skippedNote = skipped.length
        ? `Skipped ${skipped.length} confirmed or closed: ${skipped.map(codeOf).join(", ")}.`
        : undefined;
      if (undos.length === 0) {
        toast(
          eligible.length
            ? "Every route is already in the best order"
            : "Nothing to optimise",
          {
            description:
              skippedNote ??
              (eligible.length
                ? "No instance has two or more open stops to re-sequence."
                : "No route instances on this day."),
          },
        );
        return;
      }
      const avg = (key: "before" | "after") =>
        gains.length
          ? Math.round(gains.reduce((n, g) => n + g[key], 0) / gains.length)
          : "-";
      toast.success(
        `${improved} optimised, avg ${avg("before")} → ${avg("after")}${unchanged ? `, ${unchanged} unchanged` : ""}`,
        {
          description:
            skippedNote ?? "Every unconfirmed instance re-sequenced.",
          action: {
            label: "Undo",
            onClick: () => {
              for (const undo of undos.reverse()) undo();
              toast(
                `${undos.length} ${undos.length === 1 ? "instance" : "instances"} restored to their original order`,
              );
            },
          },
        },
      );
    };

    return { ...actions, confirmAllReady, placeBacklog, optimizeAll };
  }, [
    plans,
    backlog,
    defaultRoutes,
    dispatch,
    updateAppointment,
    directory,
    runOptimizer,
    servicePoints,
    items,
    containerTypes,
  ]);
}
