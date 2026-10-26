"use client";

import {
  AlertTriangle,
  CalendarX2,
  Inbox,
  Lock,
  LockOpen,
  MoreVertical,
  Route as RouteIcon,
  Truck,
  Undo2,
  UserRound,
} from "lucide-react";
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
  isWorkingShift,
  useDirectory,
  useShifts,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/mocks";
import {
  formatDate,
  formatDuration,
  formatKg,
  formatWindowRange,
} from "../utils";
import { WINDOW_LABEL } from "./appointment-meta";
import {
  type BoardActions,
  CREW_ROLE_LABEL,
  fitsVehicle,
  isMovable,
  type RoutePlan,
} from "./dispatch-meta";
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
  top,
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
  top?: ReactNode;
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
            <EmptyState
              icon={CalendarX2}
              title="No routes on this day"
              description="Routes are generated from the service schedule. Pick another day to plan."
              className="px-6"
            />
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
              description="Every appointment on this day is on a route."
              className="px-6 py-10"
            />
          ) : (
            <ul className="divide-border/60 divide-y">
              {backlog.map((apt) => (
                <li key={apt.id}>
                  <BacklogRow
                    appointment={apt}
                    plans={plans}
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
}: {
  plan: RoutePlan;
  plans: RoutePlan[];
  selected: boolean;
  onSelect: () => void;
  actions: BoardActions;
}) {
  const { route, pro, crew, vehicle, colors, locked } = plan;
  const vehicles = useVehicles();
  const technicians = useTechnicians();
  const { shiftOf } = useShifts();
  // Everyone on the route needs a working shift that day (Shift board).
  const offShift = [
    { id: route.primaryServiceProId, name: pro?.name },
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
    plans.find((p) => p.route.id !== route.id && check(p))?.route.name;
  const openStops = plan.stops.filter(isMovable).length;

  return (
    <div
      className={cn(
        "border-border bg-card relative overflow-hidden rounded-lg border p-3 pl-4 transition-shadow hover:shadow-sm",
        selected && "ring-primary ring-2",
      )}
    >
      {/* Stretched over the card so the whole card selects the route; the
          content sits above it and lets clicks through, bar the menu. */}
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
                aria-label="Locked"
              />
            ) : null}
          </p>
          <p className="text-muted-foreground text-xs tabular-nums">
            {route.startTime}–{route.endTime} · {route.estimatedKm} km ·{" "}
            {formatDuration(route.estimatedDriveMins)} drive
          </p>
        </div>

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
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem
              onClick={() => actions.setLocked(route.id, !locked)}
            >
              {locked ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
              {locked ? "Unlock route" : "Lock route"}
            </DropdownMenuItem>

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
                      const busy = busyWith((p) => p.route.vehicleId === v.id);
                      return (
                        <DropdownMenuItem
                          key={v.id}
                          onClick={() => actions.setVehicle(route.id, v.id)}
                        >
                          <span className="font-mono text-xs">{v.plate}</span>
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
                Change primary pro
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
                        onClick={() => actions.setPrimary(route.id, driver.id)}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="pointer-events-none relative mt-3 flex flex-wrap items-center gap-1.5">
        {pro ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar size="sm" className="size-6">
              <AvatarFallback className="text-[10px] font-semibold">
                {pro.initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">{pro.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">No primary pro</span>
        )}
        {crew.map((member) => (
          <Badge
            key={member.pro.id}
            variant="outline"
            title={`${member.pro.name} · ${CREW_ROLE_LABEL[member.role]}`}
          >
            {member.pro.initials}
            <span className="text-muted-foreground">
              {CREW_ROLE_LABEL[member.role]}
            </span>
          </Badge>
        ))}
      </div>

      <p className="text-muted-foreground pointer-events-none relative mt-2 flex items-center gap-1.5 text-xs">
        <Truck className="size-3.5" aria-hidden />
        {vehicle ? (
          <>
            <span className="text-foreground font-mono">{vehicle.plate}</span>·{" "}
            {VEHICLE_CLASS[vehicle.vehicleClass]}
          </>
        ) : (
          "No vehicle assigned"
        )}
      </p>

      <div className="pointer-events-none relative mt-3 grid grid-cols-2 gap-3">
        <CapacityBar
          label="Stops"
          value={plan.activeStops}
          max={route.maxStops}
          display={`${plan.activeStops}/${route.maxStops}`}
        />
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
      </div>

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
    </div>
  );
}

/** Thin meter that warns from 90% and turns destructive over capacity. */
function CapacityBar({
  label,
  value,
  max,
  display,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
}) {
  const ratio = max > 0 ? value / max : 0;
  const tone =
    ratio > 1 ? "bg-destructive" : ratio >= 0.9 ? "bg-warning" : "bg-primary";
  return (
    <div className="min-w-0">
      <p className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "truncate font-mono tabular-nums",
            ratio > 1 && "text-destructive",
            ratio >= 0.9 && ratio <= 1 && "text-warning",
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

function BacklogRow({
  appointment,
  plans,
  showDate = false,
  onSelect,
  onAssign,
}: {
  appointment: Appointment;
  plans: RoutePlan[];
  showDate?: boolean;
  onSelect: () => void;
  onAssign: (routeId: string) => void;
}) {
  const directory = useDirectory();
  const customer = directory.customer(appointment.customerId);
  const servicePoint = directory.servicePoint(appointment.servicePointId);
  const [first, ...rest] = appointment.workOrders;

  return (
    <div className="hover:bg-muted/50 flex items-start gap-2 px-3 py-2.5 transition-colors">
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
          <StreamTag stream={appointment.stream} className="h-5 text-[11px]" />
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
  );
}

/**
 * The day's routes to put an appointment on. Routes whose truck can carry the
 * work come first; the rest carry a mismatch hint. Locked routes can't change.
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
    .filter((p) => p.route.id !== appointment.routeId)
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
              No other routes on this day
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
                      ? "Locked"
                      : `${plan.activeStops}/${plan.route.maxStops} stops`}
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
