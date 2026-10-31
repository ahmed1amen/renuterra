"use client";

import {
  ArrowLeftRight,
  Droplets,
  Factory,
  HardHat,
  type LucideIcon,
  Mountain,
  Recycle,
  Sprout,
  Truck,
  Warehouse,
} from "lucide-react";
import type { StatusTone } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, DisposalSite } from "@/mocks";
import { APPOINTMENT_STATUS } from "./appointment-meta";

/**
 * Status shows as a small dot on the pin's shoulder: the pin body itself
 * carries the route colour, so the map answers "whose run is this?" first.
 * Not-started stops get no dot, so the live ones stand out.
 */
const STATUS_DOT: Record<StatusTone, string | null> = {
  neutral: null,
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

/** Anything in the backlog: the pin that should catch the dispatcher's eye. */
const BACKLOG_FILL = "fill-destructive";

const PIN_PATH =
  "M13 33.5C13 33.5 25 20.6 25 13A12 12 0 1 0 1 13c0 7.6 12 20.5 12 20.5Z";

/**
 * A teardrop pin anchored at its tip, so the point sits exactly on the
 * coordinate however the map is zoomed.
 */
export function StopPin({
  stop,
  fill,
  status,
  label,
  selected = false,
  onClick,
}: {
  /**
   * Position in the route's run. Omitted for a backlog appointment: those
   * pins show an alert glyph instead of an order.
   */
  stop?: number;
  /** Route colour (`fill-*`) for the pin body; backlog pins ignore it. */
  fill?: string;
  status: AppointmentStatus;
  /** "APT-20412 · Customer · Service point": the tooltip and accessible name. */
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const routed = stop !== undefined;
  const meta = APPOINTMENT_STATUS[status];
  const dot = STATUS_DOT[meta.tone];
  const title = routed ? `Stop ${stop} · ${label}` : `Backlog · ${label}`;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${title} · ${meta.label}`}
      aria-label={`${title}, ${meta.label}`}
      aria-pressed={selected}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-full outline-none",
        selected ? "z-20" : routed ? "z-10" : "z-[15]",
      )}
    >
      <svg
        width="26"
        height="34"
        viewBox="0 0 26 34"
        aria-hidden
        className={cn(
          "drop-shadow-sm transition-transform",
          "group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5",
          selected && "-translate-y-1 scale-115",
        )}
      >
        <title>{title}</title>
        <path
          d={PIN_PATH}
          className={cn(
            routed ? (fill ?? "fill-muted-foreground") : BACKLOG_FILL,
            selected ? "stroke-foreground" : "stroke-white/90",
          )}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeDasharray={routed ? undefined : "3 2"}
        />
        <text
          x="13"
          y="17.5"
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: routed ? 12 : 15, fontWeight: 700 }}
        >
          {routed ? stop : "!"}
        </text>
      </svg>

      {dot ? (
        <span
          aria-hidden
          className={cn(
            "absolute top-0 right-0 size-2.5 rounded-full ring-2 ring-white",
            dot,
          )}
        />
      ) : null}
    </button>
  );
}

/** A route's truck: a circular badge in the route colour, centred on the coordinate. */
export function VehicleMarker({
  label,
  className,
  selected = false,
  onClick,
}: {
  /** "Route name · plate": tooltip and accessible name. */
  label: string;
  /** Route colour (`bg-*`). */
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={selected}
      className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 outline-none"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-white shadow-md ring-2 transition-transform",
          "group-hover:scale-110 group-focus-visible:scale-110",
          selected ? "ring-foreground scale-110" : "ring-white",
          className ?? "bg-navy-700",
        )}
      >
        <Truck className="size-4" aria-hidden />
      </span>
    </button>
  );
}

export const DISPOSAL_KIND: Record<
  DisposalSite["kind"],
  { label: string; icon: LucideIcon }
> = {
  landfill: { label: "Landfill", icon: Mountain },
  transfer: { label: "Transfer station", icon: ArrowLeftRight },
  mrf: { label: "MRF", icon: Recycle },
  organics: { label: "Organics facility", icon: Sprout },
  cnd: { label: "C&D facility", icon: HardHat },
  treatment: { label: "Treatment facility", icon: Factory },
  wastewater: { label: "Wastewater plant", icon: Droplets },
};

/**
 * A disposal site or depot: a square badge, so it never reads as a stop.
 * Centred on the coordinate. Not clickable; the tooltip names it.
 */
export function FacilityMarker({
  icon: Icon,
  label,
  highlighted = false,
  dimmed = false,
}: {
  icon: LucideIcon;
  /** "Al Qusais MRF · MRF · accepts MDR, CARD, PET". */
  label: string;
  /** One of the selected route's sites. */
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  return (
    <span
      role="img"
      title={label}
      aria-label={label}
      className={cn(
        "absolute z-[5] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border shadow-sm transition-opacity",
        highlighted
          ? "bg-foreground text-background border-foreground z-[25]"
          : "bg-card text-foreground border-border",
        dimmed && "opacity-40",
      )}
    >
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

/** How to read the pins: order on a route, the backlog, trucks and status. */
export function MapLegend({ className }: { className?: string }) {
  const dots: { label: string; className: string }[] = [
    { label: "En route / in progress", className: "bg-info" },
    { label: "Completed", className: "bg-success" },
    { label: "Failed visit", className: "bg-destructive" },
  ];

  return (
    <div
      className={cn(
        "border-border bg-card/90 w-48 rounded-lg border p-2.5 shadow-sm backdrop-blur",
        className,
      )}
    >
      <ul className="flex flex-col gap-1.5 text-xs">
        <li className="flex items-center gap-2">
          <PinGlyph className="fill-muted-foreground" glyph="1" />
          Stop order on a route
        </li>
        <li className="flex items-center gap-2">
          <PinGlyph className={BACKLOG_FILL} glyph="!" />
          Backlog
        </li>
        <li className="flex items-center gap-2">
          <span className="bg-navy-700 flex size-3.5 items-center justify-center rounded-full text-white">
            <Truck className="size-2" aria-hidden />
          </span>
          Route vehicle
        </li>
        <li className="flex items-center gap-2">
          <span className="bg-card border-border flex size-3.5 items-center justify-center rounded-sm border">
            <Factory className="size-2.5" aria-hidden />
          </span>
          Disposal site
        </li>
        <li className="flex items-center gap-2">
          <span className="bg-card border-border flex size-3.5 items-center justify-center rounded-sm border">
            <Warehouse className="size-2.5" aria-hidden />
          </span>
          Depot
        </li>
        <li className="flex items-center gap-2">
          <span className="border-muted-foreground w-3.5 border-t-2 border-dashed" />
          Tipping trip
        </li>
      </ul>

      <p className="text-muted-foreground border-border/60 mt-2 border-t pt-2 text-[10px] font-semibold tracking-wide uppercase">
        Status dot
      </p>
      <ul className="mt-1 flex flex-col gap-1 text-xs">
        {dots.map((dot) => (
          <li key={dot.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn("ml-1 size-2.5 rounded-full", dot.className)}
            />
            {dot.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PinGlyph({ className, glyph }: { className: string; glyph: string }) {
  return (
    <svg width="11" height="14" viewBox="0 0 26 34" aria-hidden>
      <title>{glyph}</title>
      <path d={PIN_PATH} className={className} />
      <text
        x="13"
        y="18"
        textAnchor="middle"
        className="fill-white"
        style={{ fontSize: 14, fontWeight: 700 }}
      >
        {glyph}
      </text>
    </svg>
  );
}

export type RouteLine = {
  id: string;
  /** `stroke-*` class for the route's colour. */
  stroke: string;
  /** The run's stops, in the order the service pro drives them. */
  points: { x: number; y: number }[];
  /** Where the vehicle is now: drawn as a dashed leg to the next stop. */
  from?: { x: number; y: number };
  dimmed?: boolean;
};

function toPath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

/**
 * The planned run for each route, drawn under the pins. Every line gets a
 * white casing beneath it: the cartographer's trick for keeping a coloured
 * stroke legible over a busy basemap.
 */
export function RouteLines({ lines }: { lines: RouteLine[] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <title>Planned routes</title>
      {lines.map((line) => {
        if (line.points.length === 0) return null;
        const path = toPath(line.points);
        return (
          <g
            key={line.id}
            className={cn(
              "transition-opacity",
              line.dimmed ? "opacity-20" : "opacity-95",
            )}
          >
            {line.from ? (
              <path
                d={toPath([line.from, line.points[0]])}
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeLinecap="round"
                className={cn(line.stroke, "opacity-70")}
              />
            ) : null}

            {line.points.length > 1 ? (
              <>
                <path
                  d={path}
                  fill="none"
                  strokeWidth={6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="stroke-white/80"
                />
                <path
                  d={path}
                  fill="none"
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className={line.stroke}
                />
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export type TipLeg = {
  id: string;
  /** `stroke-*` class for the route's colour. */
  stroke: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  dimmed?: boolean;
};

/** From the stop after which a truck goes to tip, to the facility. */
export function TipLegs({ legs }: { legs: TipLeg[] }) {
  return (
    <svg className="pointer-events-none absolute inset-0 size-full" aria-hidden>
      <title>Tipping trips</title>
      {legs.map((leg) => (
        <path
          key={leg.id}
          d={`M${leg.from.x.toFixed(1)} ${leg.from.y.toFixed(1)} L${leg.to.x.toFixed(1)} ${leg.to.y.toFixed(1)}`}
          fill="none"
          strokeWidth={2}
          strokeDasharray="2 4"
          strokeLinecap="round"
          className={cn(
            leg.stroke,
            "transition-opacity",
            leg.dimmed ? "opacity-15" : "opacity-80",
          )}
        />
      ))}
    </svg>
  );
}

export { Warehouse as DepotIcon };
