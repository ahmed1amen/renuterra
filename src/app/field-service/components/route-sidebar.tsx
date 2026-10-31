"use client";

import {
  AlertTriangle,
  Ban,
  CalendarX2,
  CheckCircle2,
  CornerDownRight,
  FilePen,
  Gauge,
  Inbox,
  Lock,
  LockOpen,
  MoreVertical,
  Route as RouteIcon,
  ShieldAlert,
  Sparkles,
  Truck,
  Undo2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { EmptyState, StreamTag } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CapacityLimit,
  type CapacityLimitKind,
  formatAmount,
  type InstanceLoad,
  isWorkingShift,
  LIMIT_NAME,
  useDirectory,
  useShifts,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type {
  Appointment,
  CapacitySnapshot,
  InstanceClosure,
  StaffingSource,
} from "@/mocks";
import {
  formatDate,
  formatDuration,
  formatKg,
  formatTime,
  formatWindowRange,
} from "../utils";
import { WINDOW_LABEL } from "./appointment-meta";
import {
  type BoardActions,
  CANCELLABLE_STATUSES,
  CREW_ROLE_LABEL,
  canOptimize,
  type DefaultRoute,
  fitsVehicle,
  isMovable,
  type OpenSlot,
  type RoutePlan,
  RUN_CANCEL_REASON,
  SHIFT_LABEL,
  slotLabel,
} from "./dispatch-meta";
import { InstanceFlagChips } from "./instance-flags";
import { InstanceStatusPill, STAFFING_SOURCE } from "./route-meta";
import { RouteScoreBadge, SCORE_SCOPE } from "./route-score-badge";
import { StaffSlotMenu } from "./staff-slot-menu";
import { VEHICLE_CLASS } from "./work-order-meta";

/**
 * One fixed colour per route, so a route reads the same in the panel, on the
 * timeline and on the map: `bar` for the rail, `tint` behind a lane, `fill`
 * for its pins, `stroke` for its line. Fixed rather than theme tokens, like
 * the waste streams: a route has to hold its colour against the basemap.
 */

const ROUTE_COLORS = [
  {
    bar: "bg-emerald-500",
    tint: "bg-emerald-500/5",
    fill: "fill-emerald-500",
    stroke: "stroke-emerald-500",
  },
  {
    bar: "bg-sky-500",
    tint: "bg-sky-500/5",
    fill: "fill-sky-500",
    stroke: "stroke-sky-500",
  },
  {
    bar: "bg-amber-500",
    tint: "bg-amber-500/5",
    fill: "fill-amber-500",
    stroke: "stroke-amber-500",
  },
  {
    bar: "bg-rose-500",
    tint: "bg-rose-500/5",
    fill: "fill-rose-500",
    stroke: "stroke-rose-500",
  },
  {
    bar: "bg-violet-500",
    tint: "bg-violet-500/5",
    fill: "fill-violet-500",
    stroke: "stroke-violet-500",
  },
  {
    bar: "bg-teal-500",
    tint: "bg-teal-500/5",
    fill: "fill-teal-500",
    stroke: "stroke-teal-500",
  },
];

export type RouteColors = (typeof ROUTE_COLORS)[number];

export function routeColors(index: number): RouteColors {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export function routeColor(index: number) {
  return routeColors(index).bar;
}

/**
 * The dispatch board's right panel: the day's routes with their capacity, and
 * the backlog waiting for one. `top` holds the selected appointment's card.
 */
export function RouteSidebar({
  plans,
  backlog,
  overdue,
  selectedRouteId,
  tab,
  onTabChange,
  onSelectRoute,
  onSelectAppointment,
  actions,
  defaultRoutes,
  routesEmpty,
  top,
  onCloseRun,
  onAdjust,
  onCancelRun,
}: {
  plans: RoutePlan[];
  backlog: Appointment[];
  /** Earlier days' unrouted, still-open appointments. */
  overdue: Appointment[];
  selectedRouteId: string | null;
  tab: "routes" | "backlog";
  onTabChange: (tab: "routes" | "backlog") => void;
  onSelectRoute: (routeId: string | null) => void;
  onSelectAppointment: (appointmentId: string) => void;
  actions: BoardActions;
  /** Each backlog job's default route (R24), by appointment id. */
  defaultRoutes: Map<string, DefaultRoute>;
  /** Shown when the day has no instances (e.g. "Not generated yet"). */
  routesEmpty?: ReactNode;
  top?: ReactNode;
  /** Open the closing sheet for a run (R17). */
  onCloseRun: (routeId: string) => void;
  /** Open the adjustment dialog for a closed run (R18). */
  onAdjust: (routeId: string) => void;
  /** Open the cancel dialog for a run (spec section 6.2 rule 8). */
  onCancelRun: (routeId: string) => void;
}) {
  return (
    <aside className="border-border bg-background flex w-96 shrink-0 flex-col border-l">
      {top}
      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as "routes" | "backlog")}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="border-border border-b px-3 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="routes">
              Routes
              <Badge variant="neutral" className="h-4 px-1.5 tabular-nums">
                {plans.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="backlog">
              Backlog
              <Badge
                variant={backlog.length > 0 ? "warning" : "neutral"}
                className="h-4 px-1.5 tabular-nums"
              >
                {backlog.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="routes" className="min-h-0 overflow-y-auto">
          {plans.length === 0 ? (
            (routesEmpty ?? (
              <EmptyState
                icon={CalendarX2}
                title="No routes on this day"
                description="Route instances are generated from each Route's schedule. Pick another day to plan."
                className="px-6"
              />
            ))
          ) : (
            <ul className="flex flex-col gap-2 p-3">
              {plans.map((plan) => (
                <li key={plan.route.id}>
                  <RouteCard
                    plan={plan}
                    plans={plans}
                    selected={selectedRouteId === plan.route.id}
                    onSelect={() =>
                      onSelectRoute(
                        selectedRouteId === plan.route.id
                          ? null
                          : plan.route.id,
                      )
                    }
                    actions={actions}
                    onCloseRun={() => onCloseRun(plan.route.id)}
                    onAdjust={() => onAdjust(plan.route.id)}
                    onCancel={() => onCancelRun(plan.route.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="backlog" className="min-h-0 overflow-y-auto">
          {backlog.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Backlog is clear"
              description="Every job on this day is on a route instance."
              className="px-6 py-10"
            />
          ) : (
            <ul className="divide-border/60 divide-y">
              {backlog.map((apt) => (
                <li key={apt.id}>
                  <BacklogRow
                    appointment={apt}
                    plans={plans}
                    defaultRoute={defaultRoutes.get(apt.id)}
                    onSelect={() => onSelectAppointment(apt.id)}
                    onAssign={(routeId) => actions.assign(apt.id, routeId)}
                  />
                </li>
              ))}
            </ul>
          )}

          {overdue.length > 0 ? (
            <section className="border-border mt-2 border-t">
              <h3 className="bg-muted/50 text-muted-foreground flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase">
                <AlertTriangle className="size-3.5" aria-hidden />
                Overdue
                <span className="ml-auto font-mono tabular-nums">
                  {overdue.length}
                </span>
              </h3>
              <ul className="divide-border/60 divide-y opacity-75">
                {overdue.map((apt) => (
                  <li key={apt.id}>
                    <BacklogRow
                      appointment={apt}
                      plans={plans}
                      defaultRoute={defaultRoutes.get(apt.id)}
                      showDate
                      onSelect={() => onSelectAppointment(apt.id)}
                      onAssign={(routeId) => actions.assign(apt.id, routeId)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function RouteCard({
  plan,
  plans,
  selected,
  onSelect,
  actions,
  onCloseRun,
  onAdjust,
  onCancel,
}: {
  plan: RoutePlan;
  plans: RoutePlan[];
  selected: boolean;
  onSelect: () => void;
  actions: BoardActions;
  onCloseRun: () => void;
  onAdjust: () => void;
  onCancel: () => void;
}) {
  const { route, template, pro, crew, vehicle, colors, locked } = plan;
  const vehicles = useVehicles();
  const technicians = useTechnicians();
  const { shiftOf } = useShifts();
  // Everyone on the route needs a working shift that day (Shift board).
  const offShift = [
    ...(route.primaryServiceProId
      ? [{ id: route.primaryServiceProId, name: pro?.name }]
      : []),
    ...crew.map((c) => ({ id: c.pro.id, name: c.pro.name })),
  ].filter((p) => !isWorkingShift(shiftOf(p.id, route.date)));

  // Same class only, so a swap never strands the stops already on the route.
  const swapVehicles = (vehicles.data ?? []).filter(
    (v) =>
      v.status === "in-service" &&
      v.id !== route.vehicleId &&
      (!vehicle || v.vehicleClass === vehicle.vehicleClass),
  );
  const drivers = (technicians.data ?? []).filter(
    (t) => t.role === "driver" && t.id !== route.primaryServiceProId,
  );
  const busyWith = (check: (p: RoutePlan) => boolean) =>
    plans.find(
      (p) =>
        p.route.id !== route.id &&
        p.route.shiftId === route.shiftId &&
        check(p),
    )?.route.name;
  const openStops = plan.stops.filter(isMovable).length;
  const confirmed = route.status === "confirmed";
  const canConfirm = plan.plannable && !locked;
  const blocked = plan.blockers.length > 0;
  const slotOf = (slot: string) => plan.openSlots.find((s) => s.slot === slot);
  const truckSlot = slotOf("truck");
  const driverSlot = slotOf("driver");
  const helperSlots = plan.openSlots.filter((s) => s.kind === "helper");

  return (
    <div
      className={cn(
        "border-border bg-card relative overflow-hidden rounded-lg border p-3 pl-4 transition-shadow hover:shadow-sm",
        selected && "ring-primary ring-2",
      )}
    >
      {/* Stretched over the card so the whole card selects the route; the
          content sits above it and lets clicks through, bar the controls. */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${route.name}`}
        className="focus-visible:ring-ring/50 absolute inset-0 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-inset"
      />
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", colors.bar)}
      />

      <div className="pointer-events-none relative flex items-start gap-2">
        <span
          aria-hidden
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", colors.bar)}
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{route.name}</span>
            {locked ? (
              <Lock
                className="text-muted-foreground size-3.5 shrink-0"
                aria-label={confirmed ? "Confirmed" : "Locked"}
              />
            ) : null}
          </p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
            <RouteCode plan={plan} />
            {template && route.routeVersion !== template.version ? (
              <span title="Generated from an earlier version of the Route">
                v{route.routeVersion}
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {SHIFT_LABEL[route.shiftId]} · {route.startTime}–{route.endTime} ·{" "}
            {route.estimatedKm} km · {formatDuration(route.estimatedDriveMins)}{" "}
            drive
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <InstanceStatusPill status={route.status} />
            {plan.closed ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="size-3" aria-hidden />
                Closed
              </Badge>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="pointer-events-auto"
                  />
                }
                aria-label={`Actions for ${route.name}`}
              >
                <MoreVertical aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {plan.closed ? (
                  <DropdownMenuItem onClick={onAdjust}>
                    <FilePen aria-hidden />
                    Add adjustment…
                  </DropdownMenuItem>
                ) : plan.closable ? (
                  <DropdownMenuItem
                    onClick={onCloseRun}
                    className="items-start"
                  >
                    <Lock className="mt-0.5" aria-hidden />
                    <span className="min-w-0">
                      <span className="block">Close run…</span>
                      <span className="text-muted-foreground block text-xs">
                        Resolve open stops, lock the actuals
                      </span>
                    </span>
                  </DropdownMenuItem>
                ) : null}
                {plan.closed ? null : confirmed || locked ? (
                  <DropdownMenuItem
                    onClick={() => actions.setConfirmed(route.id, false)}
                  >
                    <LockOpen aria-hidden />
                    {confirmed ? "Reopen instance" : "Unlock instance"}
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem
                      disabled={!canConfirm || blocked}
                      onClick={() => actions.setConfirmed(route.id, true)}
                    >
                      <CheckCircle2 aria-hidden />
                      Confirm
                    </DropdownMenuItem>
                    {canConfirm && blocked ? (
                      <DropdownMenuItem
                        onClick={() =>
                          actions.setConfirmed(route.id, true, true)
                        }
                        className="items-start"
                      >
                        <ShieldAlert className="mt-0.5" aria-hidden />
                        <span className="min-w-0">
                          <span className="block">Confirm anyway</span>
                          <span className="text-muted-foreground block text-xs">
                            Override: {plan.blockers.join(", ")}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ) : null}
                  </>
                )}

                <DropdownMenuItem
                  disabled={!canOptimize(plan) || openStops < 2}
                  onClick={() => actions.optimize(route.id)}
                  className="items-start"
                >
                  <Sparkles className="mt-0.5" aria-hidden />
                  <span className="min-w-0">
                    <span className="block">Optimize stop order</span>
                    <span className="text-muted-foreground block text-xs">
                      {plan.closed
                        ? "Closed runs are read-only"
                        : !canOptimize(plan)
                          ? "Reopen the instance to re-sequence it"
                          : openStops < 2
                            ? "Needs two or more open stops"
                            : "By window, then nearest stop"}
                    </span>
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={locked}>
                    <Truck aria-hidden />
                    Change vehicle
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        {vehicle
                          ? `${VEHICLE_CLASS[vehicle.vehicleClass]}s in service`
                          : "Vehicles in service"}
                      </DropdownMenuLabel>
                      {swapVehicles.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No other vehicle of this class
                        </DropdownMenuItem>
                      ) : (
                        swapVehicles.map((v) => {
                          const busy = busyWith(
                            (p) => p.route.vehicleId === v.id,
                          );
                          return (
                            <DropdownMenuItem
                              key={v.id}
                              onClick={() => actions.setVehicle(route.id, v.id)}
                            >
                              <span className="font-mono text-xs">
                                {v.plate}
                              </span>
                              <span className="text-muted-foreground ml-auto truncate text-xs">
                                {busy ? `On ${busy}` : formatKg(v.capacityKg)}
                              </span>
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={locked}>
                    <UserRound aria-hidden />
                    Change driver
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-60">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Drivers</DropdownMenuLabel>
                      {drivers.map((driver) => {
                        const busy = busyWith(
                          (p) => p.route.primaryServiceProId === driver.id,
                        );
                        return (
                          <DropdownMenuItem
                            key={driver.id}
                            onClick={() =>
                              actions.setPrimary(route.id, driver.id)
                            }
                          >
                            <span className="truncate">{driver.name}</span>
                            {busy ? (
                              <span className="text-muted-foreground ml-auto truncate text-xs">
                                On {busy}
                              </span>
                            ) : null}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={locked || openStops === 0}
                  onClick={() => actions.clearRoute(route.id)}
                >
                  <Undo2 aria-hidden />
                  Send open stops to backlog
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={
                    plan.closed || !CANCELLABLE_STATUSES.includes(route.status)
                  }
                  onClick={onCancel}
                >
                  <Ban aria-hidden />
                  Cancel run…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <RouteScoreBadge
            score={plan.score}
            scope={SCORE_SCOPE.run}
            className="pointer-events-auto mr-7"
          />
        </div>
      </div>

      <InstanceFlagChips
        // With a live load the card judges capacity itself (Over capacity
        // box below), so the generation-time flag would only go stale.
        flags={
          plan.load
            ? route.flags.filter((f) => f.kind !== "over-capacity")
            : route.flags
        }
        className="pointer-events-auto relative mt-2"
      />

      <div className="pointer-events-none relative mt-3 flex flex-wrap items-center gap-1.5">
        {pro ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm" className="size-6">
              <AvatarFallback className="text-[10px] font-semibold">
                {pro.initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">{pro.name}</span>
            <SourceTag source={route.staffing.driver} />
          </span>
        ) : driverSlot ? null : (
          <span className="text-muted-foreground text-xs">No driver</span>
        )}
        {crew.map((member) => (
          <Badge
            key={member.pro.id}
            variant="outline"
            title={`${member.pro.name} · ${CREW_ROLE_LABEL[member.role]}${member.source && member.source !== "primary" ? ` · ${STAFFING_SOURCE[member.source]}` : ""}`}
          >
            {member.pro.initials}
            <span className="text-muted-foreground">
              {CREW_ROLE_LABEL[member.role]}
            </span>
            <SourceTag source={member.source} />
          </Badge>
        ))}
      </div>

      {vehicle ? (
        <p className="text-muted-foreground pointer-events-none relative mt-2 flex items-center gap-1.5 text-xs">
          <Truck className="size-3.5" aria-hidden />
          <span className="text-foreground font-mono">{vehicle.plate}</span>·{" "}
          {VEHICLE_CLASS[vehicle.vehicleClass]}
          <SourceTag source={route.staffing.truck} />
        </p>
      ) : truckSlot ? null : (
        <p className="text-muted-foreground pointer-events-none relative mt-2 flex items-center gap-1.5 text-xs">
          <Truck className="size-3.5" aria-hidden />
          No vehicle assigned
        </p>
      )}

      {plan.openSlots.length ? (
        <ul className="relative mt-2 flex flex-col gap-1">
          {[truckSlot, driverSlot, ...helperSlots]
            .filter((s): s is OpenSlot => s !== undefined)
            .map((slot) => (
              <li
                key={slot.slot}
                className="border-destructive/40 bg-destructive-bg/50 flex items-center gap-2 rounded-md border border-dashed py-1 pr-1 pl-2"
              >
                <span className="text-destructive pointer-events-none min-w-0 flex-1 truncate text-xs font-medium">
                  Unstaffed: {slotLabel(slot.slot)}
                </span>
                {canConfirm ? (
                  <span className="pointer-events-auto">
                    <StaffSlotMenu
                      slot={slot}
                      onStaff={(assetId) =>
                        actions.staff(route.id, slot.slot, assetId)
                      }
                    />
                  </span>
                ) : null}
              </li>
            ))}
        </ul>
      ) : null}

      <div className="pointer-events-none relative mt-3 grid grid-cols-2 gap-3">
        {/* Progress, not capacity: the truck's real limit is the bar beside it. */}
        <CapacityBar
          label="Stops done"
          value={plan.doneStops}
          max={plan.activeStops}
          display={`${plan.doneStops}/${plan.activeStops}`}
          progress
        />
        {plan.load ? (
          // The binding limit of the truck it actually has: volume, payload,
          // slots or visits, whichever is closest to full.
          <LoadBar load={plan.load} />
        ) : (
          // One-off instance with no Route: estimated weight on the truck.
          <CapacityBar
            label="Load"
            value={plan.loadKg}
            max={vehicle?.capacityKg ?? 0}
            display={
              vehicle
                ? `${formatKg(plan.loadKg)} / ${formatKg(vehicle.capacityKg)}`
                : formatKg(plan.loadKg)
            }
          />
        )}
      </div>

      {plan.overCapacity ? (
        <OverCapacityBox plan={plan} actions={actions} />
      ) : null}
      {route.extraTrips ? (
        <p className="text-muted-foreground pointer-events-none relative mt-2 text-[11px]">
          +{route.extraTrips.count} extra{" "}
          {route.extraTrips.count === 1 ? "trip" : "trips"} accepted{" "}
          {formatTime(route.extraTrips.at)}
        </p>
      ) : null}
      {plan.load ? (
        <LoadNotes load={plan.load} snapshot={route.forecastSnapshot} />
      ) : null}

      {route.closure ? <ClosureSummary closure={route.closure} /> : null}
      {route.cancellation ? (
        <p className="text-muted-foreground pointer-events-none relative mt-2 flex items-center gap-1.5 text-[11px]">
          <Ban className="size-3 shrink-0" aria-hidden />
          Cancelled {formatTime(route.cancellation.at)}:{" "}
          {RUN_CANCEL_REASON[route.cancellation.reason].toLowerCase()}
          {route.cancellation.note ? ` · ${route.cancellation.note}` : ""}
        </p>
      ) : null}

      {plan.eligibility.map((issue) => (
        <p
          key={`${issue.slot}-${issue.name}`}
          className={cn(
            "pointer-events-none relative mt-2 flex items-start gap-1.5 text-xs font-medium",
            issue.severity === "block" ? "text-destructive" : "text-warning",
          )}
        >
          <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>
            {issue.name} ({slotLabel(issue.slot)}): {issue.reason}
            {issue.severity === "block" ? " Change before confirming." : ""}
          </span>
        </p>
      ))}

      {offShift.length ? (
        <p className="text-destructive pointer-events-none relative mt-2 flex items-center gap-1.5 text-xs font-medium">
          <AlertTriangle className="size-3.5" aria-hidden />
          {offShift.map((p) => p.name).join(", ")}{" "}
          {offShift.length === 1 ? "has" : "have"} no shift this day
        </p>
      ) : null}
      {plan.mismatches > 0 ? (
        <p className="text-warning pointer-events-none relative mt-2 flex items-center gap-1.5 text-xs font-medium">
          <AlertTriangle className="size-3.5" aria-hidden />
          {plan.mismatches}{" "}
          {plan.mismatches === 1 ? "stop needs" : "stops need"} a different
          vehicle
        </p>
      ) : null}

      {canConfirm ? (
        <div className="relative mt-3 flex items-center justify-end gap-2">
          {blocked ? (
            <span className="text-muted-foreground pointer-events-none mr-auto truncate text-[11px]">
              {plan.blockers.join(" · ")}
            </span>
          ) : null}
          <Button
            size="xs"
            variant={blocked ? "outline" : "default"}
            disabled={blocked}
            title={
              blocked
                ? "Resolve first, or use Confirm anyway in the menu"
                : "Lock the instance for the shift"
            }
            onClick={() => actions.setConfirmed(route.id, true)}
          >
            <CheckCircle2 data-icon="inline-start" />
            Confirm
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** The Route code, linking to its template. */
export function RouteCode({
  plan,
  className,
}: {
  plan: RoutePlan;
  className?: string;
}) {
  const code = plan.template?.code ?? plan.route.id;
  if (!plan.route.routeId)
    return <span className={cn("font-mono", className)}>{code}</span>;
  return (
    <Link
      href={`/field-service/routes/${plan.route.routeId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "text-info pointer-events-auto truncate font-mono hover:underline",
        className,
      )}
    >
      {code}
    </Link>
  );
}

/** Where a filled slot came from, when it wasn't the Route's primary. */
/**
 * Live Over capacity (R16, spec section 8.5 rule 3) with the two fixes the
 * spec allows: split stops to the run with the most room, or accept extra
 * trips. Confirm stays blocked until one is chosen (or overridden).
 */
function OverCapacityBox({
  plan,
  actions,
}: {
  plan: RoutePlan;
  actions: BoardActions;
}) {
  const over = plan.overCapacity;
  if (!over) return null;
  const refs = over.move?.stopIds
    .map((id) => plan.stops.find((a) => a.id === id)?.ref)
    .filter(Boolean)
    .join(", ");
  return (
    <div className="border-destructive/40 bg-destructive-bg/40 pointer-events-auto relative mt-2 space-y-2 rounded-md border p-2">
      <p className="text-destructive flex items-center gap-1.5 text-xs font-medium">
        <Gauge className="size-3.5" aria-hidden />
        Over capacity {over.pct}% ({LIMIT_NAME[over.limit]}): split the run or
        add a trip
      </p>
      <div className="flex flex-col gap-1.5">
        {over.move ? (
          <Button
            size="xs"
            variant="outline"
            className="h-auto justify-start py-1 text-left whitespace-normal"
            onClick={() =>
              over.move &&
              actions.moveStops(over.move.stopIds, over.move.toRouteId)
            }
          >
            <span>
              Move {over.move.stopIds.length}{" "}
              {over.move.stopIds.length === 1 ? "stop" : "stops"} ({refs}) to{" "}
              {over.move.toName}
              <span className="text-muted-foreground block text-[11px] font-normal">
                This run {over.pct}% → {over.move.after}% · {over.move.toName}{" "}
                {over.move.toBefore}% → {over.move.toAfter}%
              </span>
            </span>
          </Button>
        ) : (
          <p className="text-muted-foreground text-[11px]">
            No other run of this type has room for the stops today.
          </p>
        )}
        {over.extraTrips ? (
          <Button
            size="xs"
            variant="outline"
            className="justify-start"
            onClick={() =>
              over.extraTrips &&
              actions.acceptExtraTrips(plan.route.id, over.extraTrips)
            }
          >
            Accept {over.extraTrips} extra{" "}
            {over.extraTrips === 1 ? "trip" : "trips"} (+
            {over.extraTrips} tip{over.extraTrips === 1 ? "" : "s"})
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** What closing recorded: when, the weighbridge vs the stops, adjustments. */
function ClosureSummary({ closure }: { closure: InstanceClosure }) {
  const weighed = closure.tipTickets.reduce((n, t) => n + (t.netKg ?? 0), 0);
  const recorded = closure.actual.find((a) => a.kind === "weight")?.value ?? 0;
  const parts = [
    `Closed ${formatTime(closure.at)}`,
    closure.resolved.length
      ? `${closure.resolved.length} resolved at closing`
      : null,
    weighed
      ? `weighbridge ${formatKg(weighed)} vs ${formatKg(recorded)} on stops`
      : null,
    closure.adjustments.length
      ? `${closure.adjustments.length} ${closure.adjustments.length === 1 ? "adjustment" : "adjustments"}`
      : null,
  ].filter(Boolean);
  return (
    <p
      className="text-muted-foreground pointer-events-none relative mt-2 flex items-center gap-1.5 text-[11px]"
      title={closure.adjustments
        .map((a) => `${formatTime(a.at)}: ${a.note}`)
        .join("\n")}
    >
      <Lock className="size-3 shrink-0" aria-hidden />
      {parts.join(" · ")}
    </p>
  );
}

function SourceTag({ source }: { source: StaffingSource | undefined }) {
  if (!source || source === "primary") return null;
  return (
    <span
      className={cn(
        "rounded px-1 text-[10px] font-semibold tracking-wide uppercase",
        source === "pool"
          ? "bg-warning-bg text-warning"
          : source === "backup"
            ? "bg-info-bg text-info"
            : "bg-muted text-muted-foreground",
      )}
    >
      {STAFFING_SOURCE[source]}
    </span>
  );
}

/** Thin meter that warns from 90% and turns destructive over capacity. */
function CapacityBar({
  label,
  value,
  max,
  display,
  progress = false,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  /** A progress bar (done of planned): never warns, it's not a limit. */
  progress?: boolean;
}) {
  const ratio = max > 0 ? value / max : 0;
  const tone = progress
    ? "bg-primary"
    : ratio > 1
      ? "bg-destructive"
      : ratio >= 0.9
        ? "bg-warning"
        : "bg-primary";
  return (
    <div className="min-w-0">
      <p className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "truncate font-mono tabular-nums",
            !progress && ratio > 1 && "text-destructive",
            !progress && ratio >= 0.9 && ratio <= 1 && "text-warning",
          )}
        >
          {display}
        </span>
      </p>
      <span className="bg-muted mt-1 block h-1.5 overflow-hidden rounded-full">
        <span
          className={cn("block h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </span>
    </div>
  );
}

const LIMIT_LABEL: Record<CapacityLimitKind, string> = {
  volume: "Volume",
  weight: "Payload",
  slots: "Slots",
  visits: "Visits",
};

/** Flag a run once its forecast passes this share of the binding limit. */
const FORECAST_WARN = 0.9;

const pctOf = (consumed: number, max: number) =>
  max > 0 ? (consumed / max) * 100 : 0;

/** Bar-sized amounts: tonnes once a weight passes 1,000 kg. */
function compactAmount(
  value: number,
  unit: CapacityLimit["unit"],
  max: number,
) {
  if (unit === "kg" && max >= 1000) {
    const t = Math.round(value / 100) / 10;
    return `${t.toLocaleString("en-AE")} t`;
  }
  return formatAmount(value, unit);
}

/**
 * The run's binding limit in three layers: worst case (every container full)
 * in light grey, the forecast solid, and what completed stops recorded on
 * top. Width is a share of the limit; a forecast over it turns red.
 */
function LoadBar({ load }: { load: InstanceLoad }) {
  const index = load.forecast.limits.findIndex((l) => l.kind === load.binding);
  const forecast = load.forecast.limits[index];
  const max = forecast.perLoad ? forecast.perTrip : forecast.perShift;
  const worst = load.worst.limits[index]?.consumed ?? forecast.consumed;
  const actual = load.actual.limits[index]?.consumed ?? 0;
  const ratio = max > 0 ? forecast.consumed / max : 0;
  const tone =
    ratio > 1
      ? "bg-destructive"
      : ratio >= FORECAST_WARN
        ? "bg-warning"
        : "bg-primary";
  const fmt = (n: number) => compactAmount(n, forecast.unit, max);
  // Only volume has a worst case of its own (every bin full); weights and
  // counts are the same in both, so the note would repeat the forecast.
  const showWorst = worst - forecast.consumed > 0.05;
  const title = [
    `${LIMIT_LABEL[forecast.kind]} (binding limit)`,
    `Worst case: ${fmt(worst)}`,
    `Forecast: ${fmt(forecast.consumed)} of ${fmt(max)}`,
    load.doneStops
      ? `Actual: ${fmt(actual)} after ${load.doneStops} of ${load.totalStops} stops`
      : "No stops completed yet",
  ].join("\n");
  return (
    <div className="min-w-0" title={title}>
      <p className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">
          {LIMIT_LABEL[forecast.kind]}
        </span>
        <span
          className={cn(
            "truncate font-mono tabular-nums",
            ratio > 1 && "text-destructive",
            ratio >= FORECAST_WARN && ratio <= 1 && "text-warning",
          )}
        >
          {/* Counts read better with the unit once: "2 / 5 visits". */}
          {forecast.unit === "visits" || forecast.unit === "slots"
            ? `${Math.round(forecast.consumed)} / ${max} ${forecast.unit}`
            : `${fmt(forecast.consumed)} / ${fmt(max)}`}
        </span>
      </p>
      <span className="bg-muted relative mt-1 block h-1.5 overflow-hidden rounded-full">
        <span
          className="bg-muted-foreground/25 absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${Math.min(100, pctOf(worst, max))}%` }}
        />
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full opacity-45 transition-all",
            tone,
          )}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all",
            tone,
          )}
          style={{ width: `${Math.min(100, pctOf(actual, max))}%` }}
        />
      </span>
      <p className="text-muted-foreground mt-1 flex justify-between gap-2 text-[10px] tabular-nums">
        <span>
          {showWorst ? `Worst ${Math.round(pctOf(worst, max))}%` : null}
        </span>
        {load.doneStops ? (
          <span>
            Actual {fmt(actual)} · {load.doneStops}/{load.totalStops}
          </span>
        ) : null}
      </p>
    </div>
  );
}

/**
 * Under the bars: the truck's other limit when it's within 10 points of the
 * binding one, and a warning when actuals run ahead of the forecast.
 */
function LoadNotes({
  load,
  snapshot,
}: {
  load: InstanceLoad;
  snapshot: CapacitySnapshot | null | undefined;
}) {
  const binding = load.forecast.binding;
  // The other limit matters once the run is half full and it's close behind.
  const close =
    binding.pct >= 50
      ? load.forecast.limits.filter(
          (l) => l !== binding && !l.perLoad && l.pct >= binding.pct - 10,
        )
      : [];
  // The plan moved since Confirm (stops, fill rates or the truck changed).
  const drift =
    snapshot && Math.abs(snapshot.forecastPct - load.forecast.pct) >= 5
      ? snapshot.forecastPct
      : null;
  if (!close.length && !load.runningHeavy && drift === null) return null;
  return (
    <div className="pointer-events-none relative mt-2 flex flex-col gap-1">
      {drift !== null ? (
        <p className="text-muted-foreground text-[11px]">
          Forecast at Confirm {drift}%, now {load.forecast.pct}%
        </p>
      ) : null}
      {close.map((limit) => (
        <p
          key={limit.kind}
          className="text-muted-foreground flex items-center justify-between gap-2 text-[11px]"
        >
          <span>{LIMIT_LABEL[limit.kind]} close behind</span>
          <span className="font-mono tabular-nums">
            {compactAmount(limit.consumed, limit.unit, limit.perShift)} /{" "}
            {compactAmount(limit.perShift, limit.unit, limit.perShift)} ·{" "}
            {limit.pct}%
          </span>
        </p>
      ))}
      {load.runningHeavy ? (
        <p className="text-warning flex items-center gap-1.5 text-xs font-medium">
          <AlertTriangle className="size-3.5" aria-hidden />
          Running heavy: completed stops are 15%+ over their forecast
        </p>
      ) : null}
    </div>
  );
}

function BacklogRow({
  appointment,
  plans,
  defaultRoute,
  showDate = false,
  onSelect,
  onAssign,
}: {
  appointment: Appointment;
  plans: RoutePlan[];
  defaultRoute: DefaultRoute | undefined;
  showDate?: boolean;
  onSelect: () => void;
  onAssign: (routeId: string) => void;
}) {
  const directory = useDirectory();
  const customer = directory.customer(appointment.customerId);
  const servicePoint = directory.servicePoint(appointment.servicePointId);
  const [first, ...rest] = appointment.workOrders;
  const target = defaultRoute?.plan;

  return (
    <div className="hover:bg-muted/50 px-3 py-2.5 transition-colors">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate text-sm font-medium">
            {customer?.name ?? appointment.ref}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {servicePoint?.location ?? servicePoint?.name}
          </span>
          <span className="text-muted-foreground mt-1 block text-xs tabular-nums">
            {showDate ? `${formatDate(appointment.windowStart)} · ` : null}
            {WINDOW_LABEL[appointment.window]}{" "}
            {formatWindowRange(appointment.windowStart, appointment.windowEnd)}
          </span>
          <span className="mt-1.5 flex min-w-0 items-center gap-1.5">
            <StreamTag
              stream={appointment.stream}
              className="h-5 text-[11px]"
            />
            {first ? (
              <span className="truncate text-xs">
                {first.itemName}
                {rest.length > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    +{rest.length} more
                  </span>
                ) : null}
              </span>
            ) : null}
          </span>
        </button>

        <AssignRouteMenu
          appointment={appointment}
          plans={plans}
          onAssign={onAssign}
          trigger={<Button variant="outline" size="xs" />}
        >
          <RouteIcon data-icon="inline-start" />
          Assign
        </AssignRouteMenu>
      </div>
      {defaultRoute ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <CornerDownRight
            className="text-muted-foreground size-3.5 shrink-0"
            aria-hidden
          />
          {target ? (
            <>
              <span className="text-muted-foreground min-w-0 truncate">
                Default route:{" "}
                <span className="text-foreground font-mono text-[11px]">
                  {defaultRoute.route.code}
                </span>
              </span>
              <Button
                size="xs"
                className="ml-auto shrink-0"
                disabled={target.locked}
                title={
                  target.locked
                    ? "Its instance is confirmed: reopen it to add stops"
                    : `Add to ${target.route.id}`
                }
                onClick={() => onAssign(target.route.id)}
              >
                Add to its instance
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground min-w-0 truncate">
              Default route{" "}
              <span className="font-mono text-[11px]">
                {defaultRoute.route.code}
              </span>{" "}
              doesn't run this day
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The day's routes to put an appointment on. Routes whose truck can carry the
 * work come first; the rest carry a mismatch hint. Confirmed ones can't change.
 */
export function AssignRouteMenu({
  appointment,
  plans,
  onAssign,
  trigger,
  children,
  label = "Assign to route",
}: {
  appointment: Appointment;
  plans: RoutePlan[];
  onAssign: (routeId: string) => void;
  trigger: ReactElement;
  children: ReactNode;
  label?: string;
}) {
  const candidates = plans
    .filter((p) => p.route.id !== appointment.routeInstanceId)
    .map((p) => ({
      plan: p,
      fits: fitsVehicle(appointment, p.vehicle?.vehicleClass),
    }))
    .sort((a, b) => Number(b.fits) - Number(a.fits));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {candidates.length === 0 ? (
            <DropdownMenuItem disabled>
              No other route instances on this day
            </DropdownMenuItem>
          ) : (
            candidates.map(({ plan, fits }) => (
              <DropdownMenuItem
                key={plan.route.id}
                disabled={plan.locked}
                onClick={() => onAssign(plan.route.id)}
                className="items-start"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    plan.colors.bar,
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{plan.route.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {plan.locked
                      ? "Confirmed"
                      : `${plan.template?.code ?? plan.route.id} · ${plan.activeStops} ${plan.activeStops === 1 ? "stop" : "stops"}`}
                    {!fits ? (
                      <span className="text-warning"> · Vehicle mismatch</span>
                    ) : null}
                  </span>
                </span>
                {plan.locked ? <Lock className="mt-1" aria-hidden /> : null}
                {!plan.locked && !fits ? (
                  <AlertTriangle className="text-warning mt-1" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
