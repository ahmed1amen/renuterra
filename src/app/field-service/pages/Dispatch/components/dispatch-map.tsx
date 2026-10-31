"use client";

import { ChevronDown, Inbox, Info, Layers } from "lucide-react";
import {
  cloneElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";
import { StreamSwatch, WASTE_STREAMS } from "@/components/shared";
import { useDirectory } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Appointment, WasteStreamId } from "@/mocks";
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
  stream,
  onStreamChange,
  onShowBacklog,
  matches,
  isToday,
  selectedRouteId,
  selectedAppointmentId,
  onSelectRoute,
  onSelectAppointment,
}: {
  plans: RoutePlan[];
  backlog: Appointment[];
  stream: WasteStreamId | null;
  onStreamChange: (stream: WasteStreamId | null) => void;
  /** Opens the sidebar's Backlog tab. */
  onShowBacklog: () => void;
  matches: (appointment: Appointment) => boolean;
  isToday: boolean;
  selectedRouteId: string | null;
  selectedAppointmentId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  onSelectAppointment: (appointmentId: string | null) => void;
}) {
  const directory = useDirectory();
  const [legendOpen, setLegendOpen] = useState(false);
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

            {/* Chrome floats on the full-bleed map: filters
                along the top, legend bottom-left. */}
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start gap-2">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <StreamFilter value={stream} onChange={onStreamChange} />
                <MapPill>
                  <Layers className="text-muted-foreground size-4" />
                  <span className="tabular-nums">{pinCount}</span>
                  <span className="text-muted-foreground">
                    {pinCount === 1 ? "stop" : "stops"}
                  </span>
                </MapPill>
              </div>
              <MapPill
                render={<button type="button" onClick={onShowBacklog} />}
                className={cn(
                  "hover:bg-muted",
                  backlog.length > 0 && "text-warning",
                )}
              >
                <Inbox className="size-4" />
                Backlog
                <CountBadge warn={backlog.length > 0}>
                  {backlog.length}
                </CountBadge>
              </MapPill>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col items-start gap-2">
              {legendOpen ? (
                <MapLegend className="pointer-events-auto shadow-md" />
              ) : null}
              <MapPill
                render={
                  <button
                    type="button"
                    aria-expanded={legendOpen}
                    onClick={() => setLegendOpen((open) => !open)}
                  />
                }
                className="hover:bg-muted"
              >
                <Info className="text-muted-foreground size-4" />
                Legend
                <ChevronDown
                  className={cn(
                    "text-muted-foreground size-3.5 transition-transform",
                    !legendOpen && "rotate-180",
                  )}
                />
              </MapPill>
            </div>
          </>
        );
      }}
    </OsmMap>
  );
}

const pillSurface =
  "border-border bg-card/95 pointer-events-auto border shadow-md backdrop-blur";

/** Floating surface for a map control — same height as a compact button. */
function MapPill({
  className,
  children,
  render,
}: {
  className?: string;
  children: ReactNode;
  /** Swap the element, e.g. a `<button>` for clickable pills. */
  render?: ReactElement<{ className?: string; children?: ReactNode }>;
}) {
  const classes = cn(
    pillSurface,
    "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
    className,
  );
  if (render) {
    return cloneElement(render, { className: classes, children });
  }
  return <div className={classes}>{children}</div>;
}

function CountBadge({
  children,
  warn = false,
}: {
  children: ReactNode;
  warn?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
        warn ? "bg-warning-bg text-warning" : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Segmented stream filter: "All" plus one swatch per stream. The active
 * stream shows its name; the rest name themselves on hover.
 */
function StreamFilter({
  value,
  onChange,
}: {
  value: WasteStreamId | null;
  onChange: (stream: WasteStreamId | null) => void;
}) {
  const segment =
    "flex h-full items-center gap-1.5 px-3 text-sm font-medium transition-colors first:rounded-l-full last:rounded-r-full";
  return (
    <fieldset
      aria-label="Waste stream"
      className={cn(
        pillSurface,
        "m-0 flex h-9 min-w-0 items-stretch divide-x divide-border rounded-full p-0",
      )}
    >
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          segment,
          value === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted",
        )}
      >
        All streams
      </button>
      {WASTE_STREAMS.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            aria-label={s.label}
            title={s.label}
            onClick={() => onChange(active ? null : s.id)}
            className={cn(segment, active ? "bg-muted" : "hover:bg-muted")}
          >
            <StreamSwatch stream={s.id} className="size-2.5 rounded-full" />
            {active ? s.label : null}
          </button>
        );
      })}
    </fieldset>
  );
}
