"use client";

import { Badge } from "@/components/ui/badge";
import { useDirectory } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/mocks";
import {
  MapLegend,
  OsmMap,
  type RouteLine,
  RouteLines,
  type RoutePlan,
  StopPin,
  VehicleMarker,
} from "../../../components";

/** Dubai — where the service points in the fixtures are. */
const MAP_CENTER = { lat: 25.14, lng: 55.23 };

const OPEN_ON_ROUTE = ["scheduled", "confirmed", "en-route", "in-progress"];

/**
 * The day on a map: each route's stops as numbered pins in its colour joined
 * in drive order, backlog pins as alerts and, today, each route's truck.
 */
export function DispatchMap({
  plans,
  backlog,
  matches,
  isToday,
  selectedRouteId,
  selectedAppointmentId,
  onSelectRoute,
  onSelectAppointment,
}: {
  plans: RoutePlan[];
  backlog: Appointment[];
  matches: (appointment: Appointment) => boolean;
  isToday: boolean;
  selectedRouteId: string | null;
  selectedAppointmentId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  onSelectAppointment: (appointmentId: string | null) => void;
}) {
  const directory = useDirectory();
  const isDimmed = (routeId: string | null) =>
    selectedRouteId !== null && routeId !== null && routeId !== selectedRouteId;

  const labelFor = (apt: Appointment) => {
    const sp = directory.servicePoint(apt.servicePointId);
    return [apt.ref, directory.customer(apt.customerId)?.name, sp?.location]
      .filter(Boolean)
      .join(" · ");
  };

  const pinCount =
    plans.reduce((sum, p) => sum + p.stops.filter(matches).length, 0) +
    backlog.filter(matches).length;

  return (
    <OsmMap center={MAP_CENTER} zoom={11} className="min-h-0 flex-1">
      {({ toScreen }) => {
        const at = (apt: Appointment) => {
          const sp = directory.servicePoint(apt.servicePointId);
          return sp ? toScreen(sp) : null;
        };

        const lines = plans
          .filter((plan) => plan.stops.length > 0)
          .map<RouteLine>((plan) => {
            const points = plan.stops
              .map(at)
              .filter((p): p is { x: number; y: number } => p !== null);
            const next = plan.stops.find((a) =>
              OPEN_ON_ROUTE.includes(a.status),
            );
            return {
              id: plan.route.id,
              stroke: plan.colors.stroke,
              points,
              from:
                isToday && next && plan.pro ? toScreen(plan.pro) : undefined,
              dimmed: isDimmed(plan.route.id),
            };
          });

        const pin = (apt: Appointment, plan?: RoutePlan, stop?: number) => {
          const point = at(apt);
          if (!point) return null;
          return (
            <span
              key={apt.id}
              className={cn(
                "pointer-events-none absolute transition-opacity",
                plan && isDimmed(plan.route.id) && "opacity-30",
              )}
              style={{ left: point.x, top: point.y }}
            >
              <span className="pointer-events-auto">
                <StopPin
                  stop={stop}
                  fill={plan?.colors.fill}
                  status={apt.status}
                  label={labelFor(apt)}
                  selected={selectedAppointmentId === apt.id}
                  onClick={() =>
                    onSelectAppointment(
                      selectedAppointmentId === apt.id ? null : apt.id,
                    )
                  }
                />
              </span>
            </span>
          );
        };

        return (
          <>
            {/* The planned run for each route, drawn beneath the pins. */}
            <RouteLines lines={lines} />

            {isToday
              ? plans.map((plan) => {
                  if (!plan.pro) return null;
                  const point = toScreen(plan.pro);
                  const selected = selectedRouteId === plan.route.id;
                  return (
                    <span
                      key={plan.route.id}
                      className={cn(
                        "pointer-events-none absolute transition-opacity",
                        isDimmed(plan.route.id) && "opacity-30",
                      )}
                      style={{ left: point.x, top: point.y }}
                    >
                      <span className="pointer-events-auto">
                        <VehicleMarker
                          label={[
                            plan.route.name,
                            plan.pro.name,
                            plan.vehicle?.plate,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                          className={plan.colors.bar}
                          selected={selected}
                          onClick={() =>
                            onSelectRoute(selected ? null : plan.route.id)
                          }
                        />
                      </span>
                    </span>
                  );
                })
              : null}

            {plans.flatMap((plan) =>
              plan.stops
                .map((apt, index) =>
                  matches(apt) ? pin(apt, plan, index + 1) : null,
                )
                .filter(Boolean),
            )}

            {backlog.filter(matches).map((apt) => pin(apt))}

            <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-2">
              <Badge
                variant="neutral"
                className="bg-card/90 pointer-events-auto backdrop-blur"
              >
                {pinCount} {pinCount === 1 ? "appointment" : "appointments"}
              </Badge>
              <MapLegend className="pointer-events-auto" />
            </div>
          </>
        );
      }}
    </OsmMap>
  );
}
