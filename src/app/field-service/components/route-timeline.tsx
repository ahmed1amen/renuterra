"use client";

import {
  ChevronDown,
  ChevronUp,
  Clock,
  Minus,
  MoreVertical,
  Plus,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Job } from "@/mocks";
import { MOCK_NOW } from "@/mocks";
import {
  formatDuration,
  formatHour,
  formatTime,
  isSameDay,
  minutesOfDay,
  TODAY,
} from "../utils";
import { JOB_STATUS } from "./job-status";
import { type Route, routeColors } from "./route-sidebar";

const LANE_WIDTH = 224;
const MIN_HOUR_WIDTH = 60;
const MAX_HOUR_WIDTH = 220;

const MIN_HEIGHT = 140;
const DEFAULT_HEIGHT = 320;
/** Leave at least the date bar and a strip of map visible. */
const MAX_HEIGHT_FRACTION = 0.75;

/** Block tint per status, so a lane reads at a glance. */
const BLOCK_TONE: Record<Job["status"], string> = {
  unassigned: "bg-muted border-border",
  scheduled: "bg-card border-border",
  "en-route": "bg-sky-50 border-sky-300 dark:bg-sky-950 dark:border-sky-800",
  "on-site": "bg-sky-100 border-sky-400 dark:bg-sky-900 dark:border-sky-700",
  completed:
    "bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:border-emerald-800",
  blocked: "bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800",
};

/**
 * The dispatcher's day in one picture: a lane per route — each run belongs to
 * one service pro — with the appointments they travel between laid out on a
 * shared hour axis. Collapses to its header so the map can take the screen.
 */
export function RouteTimeline({
  routes,
  unassigned,
  date,
  selectedRouteId,
  selectedJobId,
  onSelectRoute,
  onSelectJob,
}: {
  routes: Route[];
  unassigned: Job[];
  date: Date;
  selectedRouteId: string | null;
  selectedJobId: string | null;
  onSelectRoute: (technicianId: string | null) => void;
  onSelectJob: (jobId: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const [hourWidth, setHourWidth] = useState(110);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const scroller = useRef<HTMLDivElement>(null);
  const resize = useRef<{ y: number; height: number } | null>(null);

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
    if (!el) return;
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
  }, [clampHourWidth]);

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

  const allJobs = useMemo(
    () => [...routes.flatMap((route) => route.jobs), ...unassigned],
    [routes, unassigned],
  );

  /** Whole-hour window wide enough for the day's work, 6 hours minimum. */
  const { startHour, endHour } = useMemo(() => {
    if (allJobs.length === 0) return { startHour: 6, endHour: 18 };
    const starts = allJobs.map((job) => minutesOfDay(job.scheduledFor));
    const ends = allJobs.map(
      (job) => minutesOfDay(job.scheduledFor) + job.durationMins,
    );
    const first = Math.floor(Math.min(...starts) / 60) - 1;
    const last = Math.ceil(Math.max(...ends) / 60) + 1;
    return {
      startHour: Math.max(0, first),
      endHour: Math.min(24, Math.max(last, first + 6)),
    };
  }, [allJobs]);

  const hours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  );
  const trackWidth = hours.length * hourWidth;

  /** Where a minute-of-day sits on the track. */
  const xFor = (minutes: number) =>
    ((minutes - startHour * 60) / 60) * hourWidth;

  // The now line only means anything on today's board.
  const nowMinutes = minutesOfDay(MOCK_NOW);
  const showNow =
    isSameDay(date, TODAY) &&
    nowMinutes >= startHour * 60 &&
    nowMinutes <= endHour * 60;

  const totalStops = allJobs.length;
  const doneStops = allJobs.filter((job) => job.status === "completed").length;

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
          aria-label="Resize the routes panel"
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
          Routes
        </button>

        <Badge variant="neutral" className="font-mono text-[10px] tabular-nums">
          {routes.length} routes · {doneStops}/{totalStops} appts
        </Badge>

        {unassigned.length > 0 ? (
          <Badge variant="warning" className="font-mono text-[10px]">
            {unassigned.length} unassigned
          </Badge>
        ) : null}

        {open ? (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="text-muted-foreground mr-1 hidden text-[11px] lg:inline">
              Ctrl + scroll to zoom
            </span>
            <ZoomButton
              label="Zoom out"
              icon={Minus}
              disabled={hourWidth <= MIN_HOUR_WIDTH}
              onClick={() =>
                setHourWidth(Math.max(MIN_HOUR_WIDTH, hourWidth - 25))
              }
            />
            <input
              type="range"
              min={MIN_HOUR_WIDTH}
              max={MAX_HOUR_WIDTH}
              step={5}
              value={hourWidth}
              onChange={(e) => setHourWidth(Number(e.target.value))}
              aria-label="Timeline zoom"
              className="accent-primary w-28"
            />
            <ZoomButton
              label="Zoom in"
              icon={Plus}
              disabled={hourWidth >= MAX_HOUR_WIDTH}
              onClick={() =>
                setHourWidth(Math.min(MAX_HOUR_WIDTH, hourWidth + 25))
              }
            />
          </span>
        ) : null}
      </header>

      {open ? (
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
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="border-border/60 text-muted-foreground shrink-0 border-r px-2 text-[11px] leading-8"
                  style={{ width: hourWidth }}
                >
                  {formatHour(hour)}
                </span>
              ))}
            </div>

            {routes.map((route, index) => (
              <Lane
                key={route.technician.id}
                route={route}
                colors={routeColors(index)}
                hours={hours}
                hourWidth={hourWidth}
                xFor={xFor}
                selected={selectedRouteId === route.technician.id}
                selectedJobId={selectedJobId}
                onSelectRoute={() =>
                  onSelectRoute(
                    selectedRouteId === route.technician.id
                      ? null
                      : route.technician.id,
                  )
                }
                onSelectJob={onSelectJob}
              />
            ))}

            {/* Unassigned sits at the foot of the board, as its own lane. */}
            <div className="border-border/60 bg-warning-bg/30 flex border-b">
              <div
                className="bg-background border-border sticky left-0 z-10 shrink-0 border-r px-3 py-2"
                style={{ width: LANE_WIDTH }}
              >
                <p className="text-[13px] font-medium">Unassigned</p>
                <p className="text-muted-foreground text-[11px]">
                  {unassigned.length} appointment
                  {unassigned.length === 1 ? "" : "s"}
                </p>
              </div>
              <div
                className="relative py-2"
                style={{ width: hours.length * hourWidth, minHeight: 56 }}
              >
                <HourGrid hours={hours} hourWidth={hourWidth} />
                {unassigned.map((job) => (
                  <AppointmentBlock
                    key={job.id}
                    job={job}
                    x={xFor(minutesOfDay(job.scheduledFor))}
                    width={(job.durationMins / 60) * hourWidth}
                    selected={selectedJobId === job.id}
                    onClick={() =>
                      onSelectJob(selectedJobId === job.id ? null : job.id)
                    }
                  />
                ))}
                {unassigned.length === 0 ? (
                  <p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-xs">
                    Nothing waiting — every appointment is on a route.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Now line, drawn over every lane. */}
            {showNow ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-8 bottom-0 z-30 w-px bg-red-500"
                style={{ left: LANE_WIDTH + xFor(nowMinutes) }}
              >
                <span className="absolute -top-1 -left-[3px] size-[7px] rounded-full bg-red-500" />
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Lane({
  route,
  colors,
  hours,
  hourWidth,
  xFor,
  selected,
  selectedJobId,
  onSelectRoute,
  onSelectJob,
}: {
  route: Route;
  colors: { bar: string; tint: string; fill: string };
  hours: number[];
  hourWidth: number;
  xFor: (minutes: number) => number;
  selected: boolean;
  selectedJobId: string | null;
  onSelectRoute: () => void;
  onSelectJob: (jobId: string | null) => void;
}) {
  const { technician, jobs, bookedMins } = route;
  const done = jobs.filter((job) => job.status === "completed").length;

  return (
    <div
      className={cn(
        "border-border/60 flex border-b",
        selected ? "bg-accent/40" : colors.tint,
      )}
    >
      <div
        className={cn(
          "bg-background border-border sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r pr-2 pl-3",
          selected && "bg-accent/40",
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
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <Avatar size="sm" className="size-7 shrink-0">
            <AvatarFallback className="text-[10px] font-semibold">
              {technician.initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[13px] font-medium">
              {technician.name}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
              <Clock className="size-3" aria-hidden />
              {formatDuration(bookedMins)}
            </span>
          </span>
        </button>

        <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
          {done}/{jobs.length}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${technician.name}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md transition-colors"
          >
            <MoreVertical className="size-3.5" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => toast("Optimise order — prototype only")}
            >
              Optimise order
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => toast("Break added — prototype only")}
            >
              Add break
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className="relative py-2"
        style={{ width: hours.length * hourWidth, minHeight: 56 }}
      >
        <HourGrid hours={hours} hourWidth={hourWidth} />
        {jobs.map((job) => (
          <AppointmentBlock
            key={job.id}
            job={job}
            x={xFor(minutesOfDay(job.scheduledFor))}
            width={(job.durationMins / 60) * hourWidth}
            selected={selectedJobId === job.id}
            onClick={() =>
              onSelectJob(selectedJobId === job.id ? null : job.id)
            }
          />
        ))}
      </div>
    </div>
  );
}

/** Hour column rules behind the blocks. */
function HourGrid({
  hours,
  hourWidth,
}: {
  hours: number[];
  hourWidth: number;
}) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 flex">
      {hours.map((hour) => (
        <span
          key={hour}
          className="border-border/40 shrink-0 border-r"
          style={{ width: hourWidth }}
        />
      ))}
    </span>
  );
}

/** One appointment: the service point the pro drives to, at its booked slot. */
function AppointmentBlock({
  job,
  x,
  width,
  selected,
  onClick,
}: {
  job: Job;
  x: number;
  width: number;
  selected: boolean;
  onClick: () => void;
}) {
  const status = JOB_STATUS[job.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${job.ref} · ${job.customer} · ${job.window}`}
      aria-label={`${job.ref}, ${job.customer}, ${status.label}`}
      className={cn(
        "absolute top-2 flex h-10 flex-col justify-center gap-0.5 overflow-hidden rounded-md border px-2 text-left transition-shadow",
        BLOCK_TONE[job.status],
        selected ? "ring-primary z-10 ring-2" : "hover:shadow-sm",
      )}
      style={{ left: x, width: Math.max(width, 56) }}
    >
      <span className="flex items-center gap-1 text-[11px] leading-none font-semibold">
        <StatusIcon className="size-3 shrink-0" aria-hidden />
        <span className="font-mono tabular-nums">
          {formatTime(job.scheduledFor)}
        </span>
      </span>
      <span className="truncate text-[11px] leading-none">{job.customer}</span>
    </button>
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
