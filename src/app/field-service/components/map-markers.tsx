"use client";

import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job, JobStatus, Technician } from "@/mocks";

/**
 * Status shows as a small dot on the pin's shoulder — the pin body itself
 * carries the route colour, so the map answers "whose run is this?" first.
 * Fixed colours rather than theme tokens: a marker has to hold its meaning
 * against the basemap in both themes, like the waste streams do.
 */
const STATUS_DOT: Record<JobStatus, string | null> = {
  unassigned: null,
  scheduled: null,
  "en-route": "bg-sky-500",
  "on-site": "bg-sky-600",
  completed: "bg-emerald-500",
  blocked: "bg-orange-500",
};

/** Anything not on a route — the pin that should catch the dispatcher's eye. */
const UNASSIGNED_FILL = "fill-red-600";

/**
 * A teardrop pin anchored at its tip, so the point sits exactly on the
 * coordinate however the map is zoomed.
 */
export function JobPin({
  job,
  stop,
  fill,
  selected = false,
  onClick,
}: {
  job: Job;
  /**
   * Position in the service pro's run. Omitted when the job is not on a
   * route — those pins show an alert glyph instead of an order.
   */
  stop?: number;
  /** Route colour for the pin body; unassigned pins ignore it. */
  fill?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const routed = stop !== undefined;
  const dot = STATUS_DOT[job.status];

  return (
    <button
      type="button"
      onClick={onClick}
      title={
        routed
          ? `Stop ${stop} · ${job.ref} · ${job.customer}`
          : `Unassigned · ${job.ref} · ${job.customer}`
      }
      aria-label={
        routed
          ? `Stop ${stop}, ${job.ref}, ${job.customer}, ${job.site}`
          : `Unassigned, ${job.ref}, ${job.customer}, ${job.site}`
      }
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
          selected && "-translate-y-0.5",
        )}
      >
        <title>{job.ref}</title>
        <path
          d="M13 33.5C13 33.5 25 20.6 25 13A12 12 0 1 0 1 13c0 7.6 12 20.5 12 20.5Z"
          className={cn(
            routed ? (fill ?? "fill-slate-500") : UNASSIGNED_FILL,
            "stroke-white/90",
          )}
          strokeWidth={selected ? 2.5 : 1.5}
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
          title={job.status}
          className={cn(
            "absolute top-0 right-0 size-2.5 rounded-full ring-2 ring-white",
            dot,
          )}
        />
      ) : null}
    </button>
  );
}

/** The technician's vehicle — a circular badge, centred on the coordinate. */
export function VehicleMarker({
  technician,
  onClick,
}: {
  technician: Technician;
  onClick?: () => void;
}) {
  const off = technician.status === "off-shift";
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${technician.name} · ${technician.zone}`}
      aria-label={`${technician.name}, ${technician.status}`}
      className="group absolute z-30 -translate-x-1/2 -translate-y-1/2 outline-none"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white transition-transform",
          "group-hover:scale-110 group-focus-visible:scale-110",
          off ? "bg-slate-400" : "bg-navy-700",
        )}
      >
        <Truck className="size-4" aria-hidden />
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-white",
          off ? "bg-slate-400" : "bg-emerald-500",
        )}
      />
    </button>
  );
}

/** How to read the pins: order on a route, or an alert when on none. */
export function MapLegend({ className }: { className?: string }) {
  const dots: { label: string; className: string }[] = [
    { label: "En route / on site", className: "bg-sky-500" },
    { label: "Completed", className: "bg-emerald-500" },
    { label: "Blocked", className: "bg-orange-500" },
  ];

  return (
    <div
      className={cn(
        "border-border bg-card/90 w-46 rounded-lg border p-2.5 shadow-sm backdrop-blur",
        className,
      )}
    >
      <ul className="flex flex-col gap-1.5 text-xs">
        <li className="flex items-center gap-2">
          <PinGlyph className="fill-slate-500" glyph="1" />
          Stop order on a route
        </li>
        <li className="flex items-center gap-2">
          <PinGlyph className={UNASSIGNED_FILL} glyph="!" />
          Not on a route
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
      <path
        d="M13 33.5C13 33.5 25 20.6 25 13A12 12 0 1 0 1 13c0 7.6 12 20.5 12 20.5Z"
        className={className}
      />
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
  /** Where the vehicle is now — drawn as a dashed leg to the next stop. */
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
 * white casing beneath it — the cartographer's trick for keeping a coloured
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
