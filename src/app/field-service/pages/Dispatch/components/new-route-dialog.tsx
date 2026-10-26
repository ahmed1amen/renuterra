"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  isWorkingShift,
  useRouteStore,
  useShifts,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type { Route, RouteCrewRole } from "@/mocks";
import { Field, type RoutePlan, VEHICLE_CLASS } from "../../../components";
import { formatDate } from "../../../utils";

let routeSeq = 1;

/**
 * Create an empty route for the day: a name, the primary service pro who owns
 * it, optional crew and a truck. Stops are added afterwards from the backlog
 * (drag, Assign to route or Auto-Plan).
 *
 * Prototype-grade: the route lives in the session store until reload. Pros and
 * trucks already on a route that day are shown but can't be picked twice.
 */
export function NewRouteDialog({
  open,
  onOpenChange,
  day,
  plans,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dubai day key, `2026-09-04`. */
  day: string;
  plans: RoutePlan[];
  onCreated: (route: Route) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <NewRouteForm
          day={day}
          plans={plans}
          onCancel={() => onOpenChange(false)}
          onCreated={onCreated}
        />
      ) : null}
    </Dialog>
  );
}

function NewRouteForm({
  day,
  plans,
  onCancel,
  onCreated,
}: {
  day: string;
  plans: RoutePlan[];
  onCancel: () => void;
  onCreated: (route: Route) => void;
}) {
  const id = useId();
  const add = useRouteStore((s) => s.add);
  const pros = useTechnicians();
  const vehicles = useVehicles();
  const { shiftOf } = useShifts();

  const [name, setName] = useState("");
  const [primaryId, setPrimaryId] = useState("");
  const [crew, setCrew] = useState<Record<string, RouteCrewRole>>({});
  const [vehicleId, setVehicleId] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:00");
  const [maxStops, setMaxStops] = useState("12");

  // Who and what is already out on a route that day.
  const busyPro = new Map<string, string>();
  const busyVehicle = new Map<string, string>();
  for (const plan of plans) {
    busyPro.set(plan.route.primaryServiceProId, plan.route.name);
    for (const member of plan.route.crew)
      busyPro.set(member.serviceProId, plan.route.name);
    if (plan.route.vehicleId)
      busyVehicle.set(plan.route.vehicleId, plan.route.name);
  }

  /** Why a pro can't be picked: already on a route, or no working shift. */
  const unavailable = (proId: string) => {
    const busy = busyPro.get(proId);
    if (busy) return `on ${busy}`;
    const shift = shiftOf(proId, day);
    if (shift?.type === "leave") return "on leave";
    if (!isWorkingShift(shift)) return "no shift";
    return null;
  };

  /** Pick the primary and take the route's hours from their shift. */
  function choosePrimary(proId: string) {
    setPrimaryId(proId);
    setCrew((prev) => {
      const { [proId]: _, ...rest } = prev;
      return rest;
    });
    const shift = shiftOf(proId, day);
    if (shift?.startTime && shift.endTime) {
      setStartTime(shift.startTime);
      // A shift past midnight ends the day's route at midnight (00:00 here).
      setEndTime(shift.endTime < shift.startTime ? "00:00" : shift.endTime);
    }
  }

  const drivers = (pros.data ?? []).filter((p) => p.role !== "loader");
  const helpers = (pros.data ?? []).filter(
    (p) => p.role === "loader" && p.id !== primaryId,
  );
  const vehicle = vehicles.data?.find((v) => v.id === vehicleId);
  const suggestedName = vehicle
    ? `New ${VEHICLE_CLASS[vehicle.vehicleClass].toLowerCase()} route`
    : "New route";
  // A run that ends at midnight reads 00:00 in the time input.
  const end = endTime === "00:00" ? "24:00" : endTime;
  const ready = Boolean(primaryId) && startTime < end;

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    const seq = routeSeq++;
    const route: Route = {
      id: `route_new_${seq}`,
      name: name.trim() || suggestedName,
      date: day,
      primaryServiceProId: primaryId,
      crew: Object.entries(crew).map(([serviceProId, role]) => ({
        serviceProId,
        role,
      })),
      vehicleId: vehicleId || null,
      startTime,
      endTime: end,
      maxStops: Math.max(1, Number(maxStops) || 1),
      // Next free colour after the day's existing routes.
      colorIndex:
        plans.reduce((max, p) => Math.max(max, p.route.colorIndex), -1) + 1,
      appointmentIds: [],
      tippingTrips: [],
      estimatedKm: 0,
      estimatedDriveMins: 0,
      lockedAt: null,
      lockedBy: null,
    };
    add(route);
    onCreated(route);
    toast.success(`${route.name} created`, {
      description:
        "Add stops from the backlog — drag them, use Assign to route or Auto-Plan.",
    });
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={create} className="grid gap-4">
        <DialogHeader>
          <DialogTitle>New route</DialogTitle>
          <DialogDescription>
            {formatDate(`${day}T08:00:00.000Z`)} · the primary service pro owns
            the route and works its stops in order.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          <Field
            label="Primary service pro"
            htmlFor={`${id}-pro`}
            hint="Only pros with a working shift this day — add shifts on the Shift board."
          >
            <NativeSelect
              id={`${id}-pro`}
              className="w-full"
              value={primaryId}
              onChange={(e) => choosePrimary(e.target.value)}
            >
              <NativeSelectOption value="">Select a driver…</NativeSelectOption>
              {drivers.map((p) => {
                const reason = unavailable(p.id);
                const shift = shiftOf(p.id, day);
                return (
                  <NativeSelectOption
                    key={p.id}
                    value={p.id}
                    disabled={Boolean(reason)}
                  >
                    {p.name} — {p.skills.join(", ")}
                    {reason
                      ? ` (${reason})`
                      : shift?.startTime
                        ? ` · shift ${shift.startTime}–${shift.endTime}`
                        : ""}
                  </NativeSelectOption>
                );
              })}
            </NativeSelect>
          </Field>

          {helpers.length ? (
            <Field label="Crew (optional)">
              <ul className="grid gap-2">
                {helpers.map((p) => {
                  const busy = unavailable(p.id);
                  const role = crew[p.id];
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <Label className="flex flex-1 items-center gap-2 font-normal">
                        <Checkbox
                          checked={Boolean(role)}
                          disabled={Boolean(busy)}
                          onCheckedChange={(checked) =>
                            setCrew((prev) => {
                              const { [p.id]: _, ...rest } = prev;
                              return checked
                                ? { ...rest, [p.id]: "secondary" }
                                : rest;
                            })
                          }
                        />
                        {p.name}
                        {busy ? (
                          <span className="text-muted-foreground text-xs">
                            {busy}
                          </span>
                        ) : null}
                      </Label>
                      {role ? (
                        <NativeSelect
                          size="sm"
                          aria-label={`${p.name}'s role`}
                          value={role}
                          onChange={(e) =>
                            setCrew((prev) => ({
                              ...prev,
                              [p.id]: e.target.value as RouteCrewRole,
                            }))
                          }
                        >
                          <NativeSelectOption value="secondary">
                            Loader
                          </NativeSelectOption>
                          <NativeSelectOption value="trainee">
                            Trainee
                          </NativeSelectOption>
                        </NativeSelect>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Field>
          ) : null}

          <Field
            label="Vehicle"
            htmlFor={`${id}-vehicle`}
            hint="Its class decides which work fits — bins need a compactor, skips a skip loader."
          >
            <NativeSelect
              id={`${id}-vehicle`}
              className="w-full"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <NativeSelectOption value="">No vehicle yet</NativeSelectOption>
              {(vehicles.data ?? []).map((v) => {
                const busy = busyVehicle.get(v.id);
                const unavailable = v.status !== "in-service";
                return (
                  <NativeSelectOption
                    key={v.id}
                    value={v.id}
                    disabled={Boolean(busy) || unavailable}
                  >
                    {v.plate} — {VEHICLE_CLASS[v.vehicleClass]}
                    {unavailable
                      ? " (maintenance)"
                      : busy
                        ? ` (on ${busy})`
                        : ""}
                  </NativeSelectOption>
                );
              })}
            </NativeSelect>
          </Field>

          <Field label="Route name" htmlFor={`${id}-name`}>
            <Input
              id={`${id}-name`}
              value={name}
              placeholder={suggestedName}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Start" htmlFor={`${id}-start`}>
              <Input
                id={`${id}-start`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </Field>
            <Field label="End" htmlFor={`${id}-end`}>
              <Input
                id={`${id}-end`}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Field>
            <Field label="Max stops" htmlFor={`${id}-stops`}>
              <Input
                id={`${id}-stops`}
                type="number"
                min={1}
                value={maxStops}
                onChange={(e) => setMaxStops(e.target.value)}
              />
            </Field>
          </div>
          {startTime >= end ? (
            <p className="text-destructive text-xs">
              End time must be after the start.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready}>
            Create route
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
