"use client";

import {
  CalendarClock,
  RefreshCw,
  Route as RouteIcon,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EmptyState, StatusPill } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useFleetStore } from "@/features/field-service";
import type {
  Route,
  RouteAssignment,
  RouteInstance,
  TruckType,
  Vehicle,
} from "@/mocks";
import {
  InstanceStatusPill,
  licenceState,
  VEHICLE_CLASS,
} from "../../../components";
import { formatKg, WEEKDAY_LABELS } from "../../../utils";
import {
  assignmentRole,
  bodyLabel,
  formatDay,
  isCompacting,
  slotsLabel,
  VehicleStatusPill,
} from "./fleet-meta";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export type FleetRow = {
  vehicle: Vehicle;
  truckType: TruckType | undefined;
  entityName: string | null;
  assignments: (RouteAssignment & { route: Route | undefined })[];
  today: RouteInstance | undefined;
  todayDriver: string | null;
};

export function VehicleSheet({
  row,
  onOpenChange,
}: {
  row: FleetRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={row !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {row ? <SheetBody row={row} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ row }: { row: FleetRow }) {
  const { vehicle, truckType, assignments, today } = row;
  const setStatus = useFleetStore((s) => s.setStatus);
  const body = bodyLabel(truckType);
  const loose =
    truckType?.bodyM3 && isCompacting(truckType)
      ? truckType.bodyM3 * (truckType.compressionRatio ?? 1)
      : null;

  const sendToWorkshop = () => {
    setStatus(vehicle.id, "maintenance");
    toast.success(`${vehicle.plate} sent to workshop`, {
      description: assignments.length
        ? "Dispatch fills its routes from backups, then the pool."
        : "It won't be offered to Dispatch until it's back.",
    });
  };
  const backInService = () => {
    setStatus(vehicle.id, "in-service");
    toast.success(`${vehicle.plate} back in service`, {
      description: "Available to Dispatch again from the next shift.",
    });
  };

  return (
    <>
      <SheetHeader className="border-b pe-12">
        <SheetTitle className="font-mono text-lg">{vehicle.plate}</SheetTitle>
        <SheetDescription>
          {truckType?.name ?? vehicle.truckTypeId} ·{" "}
          {VEHICLE_CLASS[vehicle.vehicleClass]} ·{" "}
          {row.entityName ?? "Shared pool"}
        </SheetDescription>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <VehicleStatusPill status={vehicle.status} />
          {vehicle.entity === null ? (
            <Badge variant="outline">Pool</Badge>
          ) : null}
        </div>
      </SheetHeader>

      <div className="space-y-5 p-4">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Truck</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Fact label="Truck type">
              {truckType?.name ?? "-"}
              <span className="text-muted-foreground ms-1.5 font-mono text-xs whitespace-nowrap">
                {vehicle.truckTypeId}
              </span>
            </Fact>
            <Fact label="Service types">
              {truckType?.serviceTypes.join(", ") ?? "-"}
            </Fact>
            <Fact label="Payload">{formatKg(vehicle.capacityKg)}</Fact>
            {body ? (
              <Fact label={loose ? "Body × compression" : "Tank"}>
                {body}
                {loose ? (
                  <span className="text-muted-foreground block text-xs">
                    {loose} m³ loose per trip
                  </span>
                ) : null}
              </Fact>
            ) : truckType?.containerSlots ? (
              <Fact label="Container slots">
                {slotsLabel(truckType.containerSlots)}
              </Fact>
            ) : null}
            <Fact label="City permits">
              <span className="flex flex-wrap gap-1">
                {vehicle.permits.map((city) => (
                  <Badge key={city} variant="outline" className="font-mono">
                    {city}
                  </Badge>
                ))}
              </span>
            </Fact>
          </dl>
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Registration & insurance</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <ExpiryFact
              label="Registration"
              date={vehicle.registrationExpiry}
            />
            <ExpiryFact label="Insurance" date={vehicle.insuranceExpiry} />
          </dl>
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Route assignments</h3>
          {assignments.length ? (
            <ul className="divide-y rounded-lg border">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    {a.route ? (
                      <Link
                        href={`/field-service/routes/${a.route.id}`}
                        className="text-info font-mono text-sm hover:underline"
                      >
                        {a.route.code}
                      </Link>
                    ) : (
                      <span className="font-mono text-sm">{a.routeId}</span>
                    )}
                    <span className="text-muted-foreground block truncate text-xs">
                      {a.route?.name ?? "Unknown route"} ·{" "}
                      {a.days.length
                        ? a.days
                            .map((d) => WEEKDAY_LABELS[DAY_KEYS.indexOf(d)])
                            .join(", ")
                        : "Every route day"}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <StatusPill
                      tone={a.role === "primary" ? "info" : "neutral"}
                    >
                      {assignmentRole(a)}
                    </StatusPill>
                    {a.status === "suspended" ? (
                      <StatusPill tone="warning">Suspended</StatusPill>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={RouteIcon}
              title="Not assigned to a route"
              description="Pool trucks and spares are offered to Dispatch when a primary is unavailable."
              className="py-6"
            />
          )}
        </section>

        <Separator />

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Today</h3>
          {today ? (
            <div className="rounded-lg border px-3 py-2.5 text-sm">
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium">{today.name}</span>
                <InstanceStatusPill status={today.status} />
              </span>
              <span className="text-muted-foreground mt-0.5 block font-mono text-xs">
                {today.id}
              </span>
              <span className="text-muted-foreground mt-1 block text-xs">
                {today.startTime}–{today.endTime} ·{" "}
                {row.todayDriver ?? "No driver yet"} ·{" "}
                {today.appointmentIds.length}{" "}
                {today.appointmentIds.length === 1 ? "stop" : "stops"}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Not on a route instance today.
            </p>
          )}
        </section>
      </div>

      <SheetFooter className="flex-row flex-wrap border-t">
        {vehicle.status === "in-service" ? (
          <Button variant="outline" size="sm" onClick={sendToWorkshop}>
            <Wrench data-icon="inline-start" />
            Send to workshop
          </Button>
        ) : (
          <Button size="sm" onClick={backInService}>
            <RefreshCw data-icon="inline-start" />
            Back in service
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success(
              `Registration renewal requested for ${vehicle.plate}`,
              {
                description:
                  "Prototype: the fleet team would upload the new Mulkiya.",
              },
            )
          }
        >
          <CalendarClock data-icon="inline-start" />
          Renew registration
        </Button>
      </SheetFooter>
    </>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ExpiryFact({ label, date }: { label: string; date: string }) {
  const state = licenceState(date);
  return (
    <Fact label={label}>
      <span className="block tabular-nums">{formatDay(date)}</span>
      <StatusPill tone={state.tone} dot className="mt-1">
        {state.label}
      </StatusPill>
    </Fact>
  );
}
