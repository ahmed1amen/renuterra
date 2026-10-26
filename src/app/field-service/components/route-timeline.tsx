"use client";

import {
  ChevronDown,
  ChevronUp,
  Factory,
  Lock,
  Minus,
  Plus,
} from "lucide-react";
import {
  type DragEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { findStream } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDirectory } from "@/features/field-service";
import { cn } from "@/lib/utils";
import {
  type Appointment,
  type AppointmentStatus,
  MOCK_NOW,
  type TippingTrip,
} from "@/mocks";
import { formatDuration, formatHour, formatTime, minutesOfDay } from "../utils";
import { APPOINTMENT_STATUS } from "./appointment-meta";
import { isMovable, type RoutePlan } from "./dispatch-meta";

const LANE_WIDTH = 248;
const MIN_HOUR_WIDTH = 48;
const MAX_HOUR_WIDTH = 220;
const DEFAULT_HOUR_WIDTH = 150;

/** Waste runs early and at night, so the grid always covers 04:00–24:00. */
const START_HOUR = 4;
const END_HOUR = 24;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

const MIN_HEIGHT = 140;
const DEFAULT_HEIGHT = 300;
/** Leave at least the header and a strip of map visible. */
const MAX_HEIGHT_FRACTION = 0.75;

/** Drop-target key for the backlog lane. */
const BACKLOG = "__backlog__";

/** Block tint per status, so a lane reads at a glance. */
const BLOCK_TONE: Record<AppointmentStatus, string> = {
  scheduled: "bg-card border-border",
  confirmed: "bg-card border-border",
  "en-route": "bg-info-bg border-info/40",
  "in-progress": "bg-info-bg border-info/60",
  completed: "bg-success-bg border-success/40",
  failed: "bg-destructive-bg border-destructive/40",
  cancelled: "bg-muted border-border text-muted-foreground line-through",
};

/**
 * The dispatcher's day in one picture: a lane per route on a shared hour
 * axis, with its stops and tipping trips, and the backlog at the foot. Drag a
 * stop onto another lane to move it. Collapses so the map can take the screen.
 */
export function RouteTimeline({
  plans,
  backlog,
  isToday,
  matches,
  selectedRouteId,
  selectedAppointmentId,
  onSelectRoute,
  onSelectAppointment,
  onMove,
  empty,
}: {
  plans: RoutePlan[];
  /** The day's unrouted appointments. */
  backlog: Appointment[];
  isToday: boolean;
  /** Whether an appointment passes the board's filters. */
  matches: (appointment: Appointment) => boolean;
  selectedRouteId: string | null;
  selectedAppointmentId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  onSelectAppointment: (appointmentId: string | null) => void;
  onMove: (appointmentId: string, routeId: string | null) => void;
  /** Shown in place of the lanes when the day has no routes. */
  empty?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [hourWidth, setHourWidth] = useState(DEFAULT_HOUR_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [dragging, setDragging] = useState<{
    id: string;
    from: string;
  } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const resize = useRef<{ y: number; height: number } | null>(null);
  // The scroller only exists while the panel is open and the day has routes.
  const hasLanes = open && plans.length > 0;

  const clampHourWidth = useCallback(
    (value: number) =>
      Math.min(MAX_HOUR_WIDTH, Math.max(MIN_HOUR_WIDTH, value)),
    [],
  );

  /**
   * Ctrl/⌘ + wheel zooms the hour columns, keeping the time under the pointer
   * in place; a plain wheel scrolls the board as usual.
   */
  useEffect(() => {
    const el = scroller.current;
    if (!el || !hasLanes) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setHourWidth((width) => {
        const next = clampHourWidth(width - e.deltaY * 0.25);
        if (next === width) return width;
        // Anchor: keep the hour under the cursor where it was.
        const rect = el.getBoundingClientRect();
        const offset = e.clientX - rect.left - LANE_WIDTH + el.scrollLeft;
        if (offset > 0) {
          const ratio = next / width;
          el.scrollLeft += offset * ratio - offset;
        }
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampHourWidth, hasLanes]);

  const onResizeStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!open) return;
    resize.current = { y: e.clientY, height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const clampHeight = (value: number) =>
    Math.min(
      window.innerHeight * MAX_HEIGHT_FRACTION,
      Math.max(MIN_HEIGHT, value),
    );

  const onResizeMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resize.current) return;
    setHeight(
      clampHeight(resize.current.height + (resize.current.y - e.clientY)),
    );
  };

  const onResizeEnd = (e: ReactPointerEvent<HTMLButtonElement>) => {
    resize.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const trackWidth = HOURS.length * hourWidth;

  /** Where a minute-of-day sits on the track. */
  const xFor = (minutes: number) =>
    ((minutes - START_HOUR * 60) / 60) * hourWidth;

  // The now line only means anything on today's board.
  const nowMinutes = minutesOfDay(MOCK_NOW);

  // Open today's board scrolled to a little before now.
  const initialHourWidth = useRef(hourWidth);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !hasLanes) return;
    const minutes = isToday ? nowMinutes - 90 : 5 * 60;
    el.scrollLeft = Math.max(
      0,
      ((minutes - START_HOUR * 60) / 60) * initialHourWidth.current,
    );
  }, [isToday, nowMinutes, hasLanes]);

  const allStops = plans.flatMap((plan) => plan.stops);
  const doneStops = allStops.filter((a) => a.status === "completed").length;

  /** Drag-and-drop: a lane takes a stop unless it's locked or its own. */
  const canDrop = (laneId: string, locked: boolean) =>
    dragging !== null && !locked && laneId !== dragging.from;

  const dropProps = (laneId: string, locked: boolean) => ({
    onDragOver: (e: DragEvent) => {
      if (!canDrop(laneId, locked)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (over !== laneId) setOver(laneId);
    },
    onDragLeave: (e: DragEvent) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      if (over === laneId) setOver(null);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragging && canDrop(laneId, locked)) {
        onMove(dragging.id, laneId === BACKLOG ? null : laneId);
      }
      setDragging(null);
      setOver(null);
    },
  });

  const blockProps = (
    appointment: Appointment,
    from: string,
    locked: boolean,
  ) => {
    const draggable = !locked && isMovable(appointment);
    return {
      appointment,
      x: xFor(minutesOfDay(appointment.plannedStart)),
      width: (appointment.durationMins / 60) * hourWidth,
      selected: selectedAppointmentId === appointment.id,
      draggable,
      dragging: dragging?.id === appointment.id,
      onClick: () =>
        onSelectAppointment(
          selectedAppointmentId === appointment.id ? null : appointment.id,
        ),
      onDragStart: (e: DragEvent) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", appointment.id);
        setDragging({ id: appointment.id, from });
      },
      onDragEnd: () => {
        setDragging(null);
        setOver(null);
      },
    };
  };

  return (
    <section
      className="border-border bg-background relative flex shrink-0 flex-col border-t"
      style={open ? { height } : undefined}
    >
      {/* Drag the top edge to give the board more or less of the screen. */}
      {open ? (
        <button
          type="button"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          onDoubleClick={() => setHeight(DEFAULT_HEIGHT)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") setHeight((h) => clampHeight(h + 24));
            if (e.key === "ArrowDown") setHeight((h) => clampHeight(h - 24));
          }}
          aria-label="Resize the timeline"
          title="Drag to resize · double-click to reset"
          className="hover:bg-primary/40 focus-visible:bg-primary/40 absolute inset-x-0 -top-1 z-40 h-2 cursor-row-resize transition-colors outline-none"
        />
      ) : null}
      <header className="border-border flex h-10 shrink-0 items-center gap-3 border-b px-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="hover:bg-muted -ml-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold transition-colors"
        >
          {open ? (
            <ChevronDown className="size-4" aria-hidden />
          ) : (
            <ChevronUp className="size-4" aria-hidden />
          )}
          Timeline
        </button>

        <Badge variant="neutral" className="font-mono text-[10px] tabular-nums">
          {plans.length} {plans.length === 1 ? "route" : "routes"} · {doneStops}
          /{allStops.length} done
        </Badge>

        {open ? (
          <span className="text-muted-foreground text-[11px]">
            Drag a stop onto another route to move it
          </span>
        ) : null}

        {open ? (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-muted-foreground mr-1 text-[11px]">
              Ctrl + scroll to zoom
            </span>
            <ZoomButton
              label="Zoom out"
              icon={Minus}
              disabled={hourWidth <= MIN_HOUR_WIDTH}
              onClick={() => setHourWidth(clampHourWidth(hourWidth - 24))}
            />
            <input
              type="range"
              min={MIN_HOUR_WIDTH}
              max={MAX_HOUR_WIDTH}
              step={4}
              value={hourWidth}
              onChange={(e) => setHourWidth(Number(e.target.value))}
              aria-label="Timeline zoom"
              className="accent-primary w-28"
            />
            <ZoomButton
              label="Zoom in"
              icon={Plus}
              disabled={hourWidth >= MAX_HOUR_WIDTH}
              onClick={() => setHourWidth(clampHourWidth(hourWidth + 24))}
            />
          </span>
        ) : null}
      </header>

      {open && plans.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-auto">{empty}</div>
      ) : null}

      {open && plans.length > 0 ? (
        <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
          <div
            className="relative"
            style={{ width: LANE_WIDTH + trackWidth, minWidth: "100%" }}
          >
            {/* Hour ruler */}
            <div className="bg-background sticky top-0 z-20 flex h-8 border-b">
              <span
                className="bg-background border-border sticky left-0 z-10 shrink-0 border-r"
                style={{ width: LANE_WIDTH }}
              />
              {HOURS.map((hour) => (
                <span
                  key={hour}
                  className="border-border/60 text-muted-foreground shrink-0 border-r px-2 text-[11px] leading-8"
                  style={{ width: hourWidth }}
                >
                  {formatHour(hour)}
                </span>
              ))}
            </div>

            {plans.map((plan) => {
              const id = plan.route.id;
              const selected = selectedRouteId === id;
              return (
                <Lane
                  key={id}
                  plan={plan}
                  hourWidth={hourWidth}
                  selected={selected}
                  dimmed={selectedRouteId !== null && !selected}
                  dropTarget={over === id}
                  dropBlocked={
                    dragging !== null && plan.locked && dragging.from !== id
                  }
                  onSelectRoute={() => onSelectRoute(selected ? null : id)}
                  {...dropProps(id, plan.locked)}
                >
                  {plan.route.tippingTrips.map((trip) => (
                    <TippingBlock
                      key={trip.id}
                      trip={trip}
                      x={xFor(minutesOfDay(trip.plannedStart))}
                      width={(trip.durationMins / 60) * hourWidth}
                    />
                  ))}
                  {plan.stops.filter(matches).map((apt) => (
                    <AppointmentBlock
                      key={apt.id}
                      stop={plan.stops.indexOf(apt) + 1}
                      {...blockProps(apt, id, plan.locked)}
                    />
                  ))}
                </Lane>
              );
            })}

            {/* The backlog sits at the foot of the board, as its own lane. */}
            <div
              className={cn(
                "border-border/60 flex border-b transition-colors",
                over === BACKLOG ? "bg-warning-bg" : "bg-warning-bg/30",
              )}
              {...dropProps(BACKLOG, false)}
            >
              <div
                className="bg-background border-border sticky left-0 z-10 shrink-0 border-r px-3 py-2"
                style={{ width: LANE_WIDTH }}
              >
                <p className="text-[13px] font-medium">Backlog</p>
                <p className="text-muted-foreground text-[11px]">
                  {backlog.length} appointment
                  {backlog.length === 1 ? "" : "s"} · drop here to unroute
                </p>
              </div>
              <div
                className="relative py-2"
                style={{ width: trackWidth, minHeight: 56 }}
              >
                <HourGrid hourWidth={hourWidth} />
                {backlog.filter(matches).map((apt) => (
                  <AppointmentBlock
                    key={apt.id}
                    {...blockProps(apt, BACKLOG, false)}
                  />
                ))}
                {backlog.length === 0 ? (
                  <p className="text-muted-foreground sticky left-0 flex h-10 items-center px-3 text-xs">
                    Nothing waiting — every appointment is on a route.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Now line, drawn over every lane. */}
            {isToday ? (
              <span
                aria-hidden
                className="bg-destructive pointer-events-none absolute top-8 bottom-0 z-30 w-px"
                style={{ left: LANE_WIDTH + xFor(nowMinutes) }}
              >
                <span className="bg-destructive absolute -top-1 -left-[3px] size-[7px] rounded-full" />
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Lane({
  plan,
  hourWidth,
  selected,
  dimmed,
  dropTarget,
  dropBlocked,
  onSelectRoute,
  children,
  ...drop
}: {
  plan: RoutePlan;
  hourWidth: number;
  selected: boolean;
  dimmed: boolean;
  dropTarget: boolean;
  dropBlocked: boolean;
  onSelectRoute: () => void;
  children: ReactNode;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}) {
  const { route, pro, vehicle, colors, locked } = plan;

  return (
    <div
      className={cn(
        "border-border/60 flex border-b transition-colors",
        selected ? "bg-accent/40" : colors.tint,
        dropTarget && "bg-primary/15",
      )}
      {...drop}
    >
      <div
        className={cn(
          "bg-background border-border sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r pr-2 pl-3",
        )}
        style={{ width: LANE_WIDTH }}
      >
        <span
          className={cn("absolute inset-y-0 left-0 w-1", colors.bar)}
          aria-hidden
        />
        <button
          type="button"
          onClick={onSelectRoute}
          aria-pressed={selected}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 py-2 text-left transition-opacity",
            dimmed && "opacity-60",
          )}
        >
          <Avatar size="sm" className="size-7 shrink-0">
            <AvatarFallback className="text-[10px] font-semibold">
              {pro?.initials ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 leading-tight">
            <span className="flex items-center gap-1 text-[13px] font-medium">
              <span className="truncate">{route.name}</span>
              {locked ? (
                <Lock
                  className="text-muted-foreground size-3 shrink-0"
                  aria-label="Locked"
                />
              ) : null}
            </span>
            <span className="text-muted-foreground block truncate text-[11px]">
              {pro?.name ?? "No primary pro"}
              {vehicle ? (
                <span className="font-mono"> · {vehicle.plate}</span>
              ) : null}
            </span>
          </span>
        </button>

        <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
          {plan.activeStops}/{route.maxStops}
        </span>
      </div>

      <div
        className={cn(
          "relative py-2 transition-opacity",
          dimmed && "opacity-40",
          dropBlocked && "cursor-not-allowed opacity-50",
        )}
        style={{ width: HOURS.length * hourWidth, minHeight: 56 }}
      >
        <HourGrid hourWidth={hourWidth} />
        {children}
      </div>
    </div>
  );
}

/** Hour column rules behind the blocks. */
function HourGrid({ hourWidth }: { hourWidth: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 flex">
      {HOURS.map((hour) => (
        <span
          key={hour}
          className="border-border/40 shrink-0 border-r"
          style={{ width: hourWidth }}
        />
      ))}
    </span>
  );
}

/** One stop: the service point the route drives to, at its planned arrival. */
function AppointmentBlock({
  appointment,
  stop,
  x,
  width,
  selected,
  draggable,
  dragging,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  appointment: Appointment;
  stop?: number;
  x: number;
  width: number;
  selected: boolean;
  draggable: boolean;
  dragging: boolean;
  onClick: () => void;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
}) {
  const directory = useDirectory();
  const customer = directory.customer(appointment.customerId)?.name;
  const status = APPOINTMENT_STATUS[appointment.status];
  const StatusIcon = status.icon;
  const stream = findStream(appointment.stream);
  const label = [
    stop ? `Stop ${stop}` : "Backlog",
    appointment.ref,
    customer,
    status.label,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={`${label} · ${formatTime(appointment.plannedStart)}, ${formatDuration(appointment.durationMins)}`}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "absolute top-2 flex h-10 flex-col justify-center gap-0.5 overflow-hidden rounded-md border pr-1.5 pl-2.5 text-left transition-shadow",
        BLOCK_TONE[appointment.status],
        draggable && "cursor-grab active:cursor-grabbing",
        selected ? "ring-primary z-10 ring-2" : "hover:shadow-sm",
        dragging && "opacity-40",
      )}
      style={{ left: x, width: Math.max(width, 56) }}
    >
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", stream.swatchClass)}
      />
      <span className="flex min-w-0 items-center gap-1 text-[11px] leading-none font-semibold">
        <StatusIcon className="size-3 shrink-0" aria-hidden />
        <span className="truncate font-mono tabular-nums">
          {stop ? `${stop} · ` : null}
          {formatTime(appointment.plannedStart)}
        </span>
      </span>
      <span className="truncate text-[11px] leading-none">
        {customer ?? appointment.ref}
      </span>
    </button>
  );
}

/** A run to the disposal facility to empty the truck — not a customer stop. */
function TippingBlock({
  trip,
  x,
  width,
}: {
  trip: TippingTrip;
  x: number;
  width: number;
}) {
  return (
    <span
      title={`Tipping · ${trip.facility} · ${formatTime(trip.plannedStart)}, ${formatDuration(trip.durationMins)}`}
      className={cn(
        "border-muted-foreground/40 text-muted-foreground absolute top-2 flex h-10 items-center gap-1 overflow-hidden rounded-md border border-dashed px-1.5 text-[11px]",
        "bg-muted bg-[image:repeating-linear-gradient(135deg,var(--color-border)_0_2px,transparent_2px_7px)]",
      )}
      style={{ left: x, width: Math.max(width, 28) }}
    >
      <Factory className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{trip.facility}</span>
    </span>
  );
}

function ZoomButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Plus;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 items-center justify-center rounded-md transition-colors disabled:opacity-40"
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
