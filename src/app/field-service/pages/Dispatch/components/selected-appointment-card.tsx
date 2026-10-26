"use client";

import {
  ArrowUpRight,
  Clock,
  MapPin,
  Route as RouteIcon,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDirectory } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/mocks";
import {
  AppointmentStatusPill,
  AssignRouteMenu,
  formatCountUnit,
  isMovable,
  type RoutePlan,
  WINDOW_LABEL,
} from "../../../components";
import {
  formatDate,
  formatKg,
  formatTime,
  formatWindowRange,
} from "../../../utils";

/** The appointment picked on the map or timeline, with its quick actions. */
export function SelectedAppointmentCard({
  appointment,
  plan,
  plans,
  onAssign,
  onClose,
}: {
  appointment: Appointment;
  /** The route it's on; `undefined` for the backlog. */
  plan: RoutePlan | undefined;
  plans: RoutePlan[];
  onAssign: (routeId: string | null) => void;
  onClose: () => void;
}) {
  const directory = useDirectory();
  const customer = directory.customer(appointment.customerId);
  const servicePoint = directory.servicePoint(appointment.servicePointId);
  const stop = plan ? plan.stops.indexOf(appointment) + 1 : null;
  const canMove = isMovable(appointment) && !plan?.locked;
  const shown = appointment.workOrders.slice(0, 3);
  const hidden = appointment.workOrders.length - shown.length;

  return (
    <section
      aria-label={`Selected appointment ${appointment.ref}`}
      className="border-border bg-card border-b p-3"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono text-xs">
              {appointment.ref}
            </span>
            <AppointmentStatusPill status={appointment.status} />
          </p>
          <p className="mt-1 truncate text-sm font-semibold">
            {customer?.name ?? "Unknown customer"}
          </p>
          <p className="text-muted-foreground flex items-center gap-1 truncate text-xs">
            <MapPin className="size-3 shrink-0" aria-hidden />
            {servicePoint?.location ?? servicePoint?.name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close"
          onClick={onClose}
        >
          <X aria-hidden />
        </Button>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-muted-foreground">Window</dt>
        <dd className="tabular-nums">
          {formatDate(appointment.windowStart)} ·{" "}
          {WINDOW_LABEL[appointment.window]}{" "}
          {formatWindowRange(appointment.windowStart, appointment.windowEnd)}
        </dd>
        <dt className="text-muted-foreground">Planned</dt>
        <dd className="flex items-center gap-1 tabular-nums">
          <Clock className="size-3" aria-hidden />
          {formatTime(appointment.plannedStart)} · {appointment.durationMins}{" "}
          min
        </dd>
        <dt className="text-muted-foreground">Route</dt>
        <dd className="flex min-w-0 items-center gap-1.5">
          {plan ? (
            <>
              <span
                aria-hidden
                className={cn("size-2 shrink-0 rounded-full", plan.colors.bar)}
              />
              <span className="truncate">{plan.route.name}</span>
              <span className="text-muted-foreground shrink-0">
                · stop {stop} of {plan.stops.length}
              </span>
            </>
          ) : (
            <span className="text-warning font-medium">Backlog</span>
          )}
        </dd>
        <dt className="text-muted-foreground">Work</dt>
        <dd>
          <ul className="space-y-0.5">
            {shown.map((wo) => (
              <li key={wo.id} className="flex gap-1.5">
                <span className="min-w-0 truncate">{wo.itemName}</span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {formatCountUnit(wo.countPlanned, wo.countUnit)} ·{" "}
                  {formatKg(wo.weightKg ?? wo.weightEstKg)}
                </span>
              </li>
            ))}
            {hidden > 0 ? (
              <li className="text-muted-foreground">+{hidden} more</li>
            ) : null}
            {shown.length === 0 ? (
              <li className="text-muted-foreground">No work orders</li>
            ) : null}
          </ul>
        </dd>
      </dl>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/field-service/appointments/${appointment.id}`} />
          }
        >
          Open
          <ArrowUpRight data-icon="inline-end" />
        </Button>
        <AssignRouteMenu
          appointment={appointment}
          plans={plans}
          label="Move to route"
          onAssign={onAssign}
          trigger={<Button size="sm" variant="outline" disabled={!canMove} />}
        >
          <RouteIcon data-icon="inline-start" />
          Move to route
        </AssignRouteMenu>
        {plan ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={!canMove}
            onClick={() => onAssign(null)}
          >
            <Undo2 data-icon="inline-start" />
            Send to backlog
          </Button>
        ) : null}
      </div>
      {!canMove && isMovable(appointment) ? (
        <p className="text-muted-foreground mt-2 text-xs">
          The route is locked — unlock it to move this stop.
        </p>
      ) : null}
      {!isMovable(appointment) ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Already started or closed, so it stays on its route.
        </p>
      ) : null}
    </section>
  );
}
