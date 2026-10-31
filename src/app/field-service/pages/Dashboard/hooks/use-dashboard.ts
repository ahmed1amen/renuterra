"use client";

import { useMemo } from "react";
import {
  useAppointments,
  useCustomers,
  useRouteInstances,
  useRoutes,
  useServiceItems,
  useServicePoints,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type {
  Appointment,
  FailedReason,
  RouteInstance,
  RouteInstanceStatus,
  WasteStreamId,
} from "@/mocks";
import {
  dayKeyFromToday,
  formatShortDay,
  INSTANCE_STATUS,
  licenceState,
  SHIFT_LABEL,
  slotLabel,
  TODAY_KEY,
} from "../../../components";
import {
  addDays,
  formatDate,
  startOfWeek,
  TODAY,
  toDayKey,
  toDubaiDayKey,
} from "../../../utils";

export const TOMORROW_KEY = dayKeyFromToday(1);

/** Statuses in the order the KPI hint and tomorrow's summary read them. */
const STATUS_ORDER = Object.keys(INSTANCE_STATUS) as RouteInstanceStatus[];

const OPEN_STATUSES: Appointment["status"][] = [
  "scheduled",
  "confirmed",
  "en-route",
  "in-progress",
];

/** A stop counts as done once it was attempted: completed or failed. */
const isDone = (a: Appointment) =>
  a.status === "completed" || a.status === "failed";

export type StatusCount = { status: RouteInstanceStatus; count: number };

export type RunRow = {
  instance: RouteInstance;
  code: string;
  name: string;
  shift: string;
  window: string;
  driver: string | null;
  truck: string | null;
  stopsDone: number;
  stopsTotal: number;
};

export type AttentionKind =
  | "unstaffed"
  | "skill"
  | "vehicle"
  | "contract"
  | "backlog";

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  title: string;
  detail: string;
  /** Short state shown as a pill, e.g. "Expires in 12 d". */
  state: string;
  tone: "destructive" | "warning";
  href: string;
};

export type DayCount = { day: string; count: number; isToday: boolean };
export type StreamTotal = { stream: WasteStreamId; kg: number };

function countByStatus(instances: RouteInstance[]): StatusCount[] {
  return STATUS_ORDER.map((status) => ({
    status,
    count: instances.filter((i) => i.status === status).length,
  })).filter((s) => s.count > 0);
}

const CONTRACT_LABEL: Record<string, string> = {
  expired: "Expired",
  suspended: "Suspended",
  "credit-hold": "Credit hold",
};

/**
 * Every rollup the Field Service dashboard shows, derived from the same
 * session-merged hooks Dispatch reads, so a change there shows up here.
 */
export function useDashboard() {
  const instances = useRouteInstances();
  const routes = useRoutes();
  const stops = useAppointments();
  const pros = useTechnicians();
  const vehicles = useVehicles();
  const servicePoints = useServicePoints();
  const customers = useCustomers();
  const items = useServiceItems();

  const queries = [
    instances,
    routes,
    stops,
    pros,
    vehicles,
    servicePoints,
    customers,
    items,
  ];
  const isPending = queries.some((q) => q.isPending);
  const error = queries.find((q) => q.error)?.error ?? null;
  const refetch = () => {
    for (const q of queries) if (q.error) q.refetch();
  };

  const model = useMemo(() => {
    if (
      !instances.data ||
      !routes.data ||
      !stops.data ||
      !pros.data ||
      !vehicles.data ||
      !servicePoints.data ||
      !customers.data ||
      !items.data
    )
      return null;

    const routeById = new Map(routes.data.map((r) => [r.id, r]));
    const proById = new Map(pros.data.map((p) => [p.id, p]));
    const vehicleById = new Map(vehicles.data.map((v) => [v.id, v]));
    const stopById = new Map(stops.data.map((a) => [a.id, a]));
    const customerById = new Map(customers.data.map((c) => [c.id, c]));
    const itemById = new Map(items.data.map((i) => [i.id, i]));
    const dayOf = (a: Appointment) => toDubaiDayKey(a.windowStart);
    /** An instance's stops, minus cancelled ones. */
    const stopsOf = (instance: RouteInstance) =>
      instance.appointmentIds.flatMap((id) => {
        const a = stopById.get(id);
        return a && a.status !== "cancelled" ? [a] : [];
      });
    const allInstances = instances.data;

    // Today's runs -----------------------------------------------------------
    const todayInstances = instances.data
      .filter((i) => i.date === TODAY_KEY)
      .sort(
        (a, b) =>
          a.shiftId.localeCompare(b.shiftId) ||
          a.startTime.localeCompare(b.startTime) ||
          a.id.localeCompare(b.id),
      );

    const runs: RunRow[] = todayInstances.map((instance) => {
      const route = instance.routeId
        ? routeById.get(instance.routeId)
        : undefined;
      const runStops = stopsOf(instance);
      return {
        instance,
        code: route?.code ?? instance.id,
        name: route?.name ?? instance.name,
        shift: SHIFT_LABEL[instance.shiftId],
        window: `${instance.startTime}–${instance.endTime}`,
        driver: proById.get(instance.primaryServiceProId ?? "")?.name ?? null,
        truck: vehicleById.get(instance.vehicleId ?? "")?.plate ?? null,
        stopsDone: runStops.filter(isDone).length,
        stopsTotal: runStops.length,
      };
    });

    // KPIs -------------------------------------------------------------------
    const todayStops = runs.flatMap((r) => stopsOf(r.instance));
    const todayCompletedWorkOrders = stops.data
      .filter((a) => dayOf(a) === TODAY_KEY)
      .flatMap((a) => a.workOrders)
      .filter((wo) => wo.status === "completed");

    const weekAhead = dayKeyFromToday(7);
    const unstaffedAhead = instances.data
      .filter(
        (i) =>
          i.status === "unstaffed" && i.date >= TODAY_KEY && i.date < weekAhead,
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const backlog = stops.data.filter(
      (a) => a.routeInstanceId === null && OPEN_STATUSES.includes(a.status),
    );
    const staleBacklog = backlog.filter(
      (a) => toDubaiDayKey(a.createdAt) < TODAY_KEY,
    );

    const weekAgo = dayKeyFromToday(-6);
    const failedRecent = stops.data.filter(
      (a) =>
        a.status === "failed" && dayOf(a) >= weekAgo && dayOf(a) <= TODAY_KEY,
    );
    const reasonCounts = new Map<FailedReason, number>();
    for (const a of failedRecent)
      if (a.failedReason)
        reasonCounts.set(
          a.failedReason,
          (reasonCounts.get(a.failedReason) ?? 0) + 1,
        );
    const topFailedReason =
      [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const kpis = {
      runsToday: todayInstances.length,
      runsByStatus: countByStatus(todayInstances),
      unstaffedAhead: unstaffedAhead.length,
      unstaffedToday: unstaffedAhead.filter((i) => i.date === TODAY_KEY).length,
      stopsDone: todayStops.filter(isDone).length,
      stopsPlanned: todayStops.length,
      stopsFailed: todayStops.filter((a) => a.status === "failed").length,
      kgToday: todayCompletedWorkOrders.reduce(
        (sum, wo) => sum + (wo.weightKg ?? 0),
        0,
      ),
      workOrdersToday: todayCompletedWorkOrders.length,
      backlog: backlog.length,
      staleBacklog: staleBacklog.length,
      failedWeek: failedRecent.length,
      topFailedReason,
    };

    // Needs attention --------------------------------------------------------
    const attention: AttentionItem[] = [];

    for (const i of unstaffedAhead) {
      const slots = i.flags
        .flatMap((f) => (f.kind === "unstaffed" ? [slotLabel(f.slot)] : []))
        .join(", ");
      const route = i.routeId ? routeById.get(i.routeId) : undefined;
      attention.push({
        id: `unstaffed-${i.id}`,
        kind: "unstaffed",
        title: route?.code ?? i.name,
        detail: `${formatShortDay(i.date)} · ${SHIFT_LABEL[i.shiftId]}${slots ? ` · no ${slots}` : ""}`,
        state: "Unstaffed",
        tone: "destructive",
        href: i.routeId
          ? `/field-service/routes/${i.routeId}`
          : `/field-service/dispatch?date=${i.date}`,
      });
    }

    for (const pro of pros.data) {
      for (const skill of pro.skillCodes ?? []) {
        if (!skill.expiresOn) continue;
        const s = licenceState(skill.expiresOn);
        if (s.days > 30) continue;
        attention.push({
          id: `skill-${pro.id}-${skill.code}`,
          kind: "skill",
          title: pro.name,
          detail: `${skill.code} · ${formatShortDay(skill.expiresOn)}`,
          state: s.label,
          tone: s.days < 0 ? "destructive" : "warning",
          href: `/field-service/service-pros/${pro.id}`,
        });
      }
    }

    for (const v of vehicles.data) {
      for (const [doc, date] of [
        ["Registration", v.registrationExpiry],
        ["Insurance", v.insuranceExpiry],
      ] as const) {
        const s = licenceState(date);
        if (s.days > 30) continue;
        attention.push({
          id: `vehicle-${v.id}-${doc}`,
          kind: "vehicle",
          title: v.plate,
          detail: `${doc} · ${formatShortDay(date)}`,
          state: s.label,
          tone: s.days < 0 ? "destructive" : "warning",
          href: "/field-service/fleet",
        });
      }
    }

    for (const sp of servicePoints.data) {
      for (const line of sp.serviceLines) {
        if (line.contractStatus === "active") continue;
        attention.push({
          id: `contract-${line.id}`,
          kind: "contract",
          title: customerById.get(sp.customerId)?.name ?? sp.name,
          detail: `${sp.location} · ${itemById.get(line.serviceItemId)?.name ?? "Service line"}`,
          state: CONTRACT_LABEL[line.contractStatus] ?? line.contractStatus,
          tone: line.contractStatus === "expired" ? "destructive" : "warning",
          href: `/field-service/customers/${sp.customerId}`,
        });
      }
    }

    for (const a of staleBacklog.sort((x, y) =>
      x.createdAt.localeCompare(y.createdAt),
    )) {
      attention.push({
        id: `backlog-${a.id}`,
        kind: "backlog",
        title: `${a.ref} · ${customerById.get(a.customerId)?.name ?? "Customer"}`,
        detail: `Booked ${formatDate(a.createdAt)} · due ${formatDate(a.windowStart)}`,
        state: dayOf(a) < TODAY_KEY ? "Overdue" : "Not on a run",
        tone: dayOf(a) <= TODAY_KEY ? "destructive" : "warning",
        href: `/field-service/appointments/${a.id}`,
      });
    }

    // Tomorrow ---------------------------------------------------------------
    const tomorrowInstances = instances.data.filter(
      (i) => i.date === TOMORROW_KEY,
    );
    const tomorrow = {
      runs: tomorrowInstances.length,
      byStatus: countByStatus(tomorrowInstances),
      stops: tomorrowInstances.reduce(
        (sum, i) => sum + i.appointmentIds.length,
        0,
      ),
      unstaffed: tomorrowInstances.filter((i) => i.status === "unstaffed")
        .length,
      backlogDue: backlog.filter((a) => dayOf(a) === TOMORROW_KEY).length,
    };

    // This week (Sun–Sat) ----------------------------------------------------
    const weekStart = startOfWeek(TODAY);
    const weekDays = Array.from({ length: 7 }, (_, n) =>
      toDayKey(addDays(weekStart, n)),
    );
    const runsByDay: DayCount[] = weekDays.map((day) => ({
      day,
      count: allInstances.filter((i) => i.date === day).length,
      isToday: day === TODAY_KEY,
    }));

    const kgByStream = new Map<WasteStreamId, number>();
    for (const a of stops.data) {
      const day = dayOf(a);
      if (day < weekDays[0] || day > TODAY_KEY) continue;
      for (const wo of a.workOrders)
        if (wo.status === "completed" && wo.weightKg)
          kgByStream.set(
            wo.stream,
            (kgByStream.get(wo.stream) ?? 0) + wo.weightKg,
          );
    }
    const streams: StreamTotal[] = [...kgByStream.entries()]
      .map(([stream, kg]) => ({ stream, kg }))
      .sort((a, b) => b.kg - a.kg);

    return { runs, kpis, attention, tomorrow, runsByDay, streams };
  }, [
    instances.data,
    routes.data,
    stops.data,
    pros.data,
    vehicles.data,
    servicePoints.data,
    customers.data,
    items.data,
  ]);

  return { model, isPending, error, refetch };
}
