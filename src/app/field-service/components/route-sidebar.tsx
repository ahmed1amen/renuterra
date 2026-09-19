"use client";

import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Star,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Job, Technician } from "@/mocks";
import { formatDuration, formatTime } from "../utils";
import { JOB_STATUS } from "./job-status";

/** A technician's day: the stops assigned to them, in time order. */
export type Route = {
  technician: Technician;
  jobs: Job[];
  bookedMins: number;
};

/**
 * One fixed colour per lane, so a route reads the same in the sidebar, on the
 * timeline and on the map: `bar` for the rail, `tint` behind a lane, `fill`
 * for its pins.
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

export function routeColors(index: number) {
  return ROUTE_COLORS[index % ROUTE_COLORS.length];
}

export function routeColor(index: number) {
  return routeColors(index).bar;
}

type SortField = "load" | "name" | "stops";

export function RouteSidebar({
  routes,
  unassigned,
  selectedRouteId,
  onSelectRoute,
  onSelectJob,
  className,
}: {
  routes: Route[];
  unassigned: Job[];
  selectedRouteId: string | null;
  onSelectRoute: (technicianId: string | null) => void;
  onSelectJob?: (jobId: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortField>("load");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [starred, setStarred] = useState<string[]>([]);
  const [showStaffed, setShowStaffed] = useState(true);
  const [showUnassigned, setShowUnassigned] = useState(true);

  const term = query.trim().toLowerCase();
  const visible = routes
    .map((route, index) => ({ ...route, color: routeColor(index) }))
    .filter(
      (route) =>
        !term ||
        route.technician.name.toLowerCase().includes(term) ||
        route.technician.zone.toLowerCase().includes(term),
    )
    .sort((a, b) => {
      if (sort === "name")
        return a.technician.name.localeCompare(b.technician.name);
      if (sort === "stops") return b.jobs.length - a.jobs.length;
      return b.bookedMins - a.bookedMins;
    });

  const totalStops = routes.reduce((sum, r) => sum + r.jobs.length, 0);
  const doneStops = routes.reduce(
    (sum, r) => sum + r.jobs.filter((j) => j.status === "completed").length,
    0,
  );

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <aside
      className={cn(
        "border-border bg-background flex w-88 shrink-0 flex-col border-l",
        className,
      )}
    >
      <header className="border-border space-y-3 border-b p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {routes.length} {routes.length === 1 ? "route" : "routes"}
          </h2>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {doneStops}/{totalStops} stops
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            onClick={() => toast.success("Route created — prototype only")}
          >
            <Plus data-icon="inline-start" />
            Create route
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast("Auto-plan is a placeholder", {
                description: "It would balance the queue across the crew.",
              })
            }
          >
            <Wand2 data-icon="inline-start" />
            Auto-plan
          </Button>
        </div>

        <span className="relative flex">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search routes or technicians…"
            aria-label="Search routes or technicians"
            className="h-8 ps-9 text-sm"
          />
        </span>

        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="xs" />}
            >
              <ArrowUpDown data-icon="inline-start" />
              {sort === "load" ? "Load" : sort === "name" ? "Name" : "Stops"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSort("load")}>
                Load
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("stops")}>
                Stops
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSort("name")}>
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="flex items-center gap-1">
            <IconButton
              label="Collapse all"
              icon={ChevronRight}
              onClick={() => setExpanded([])}
            />
            <IconButton
              label="Expand all"
              icon={ChevronDown}
              onClick={() => setExpanded(routes.map((r) => r.technician.id))}
            />
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SectionHeader
          label="Staffed"
          count={visible.length}
          open={showStaffed}
          onToggle={() => setShowStaffed(!showStaffed)}
        />

        {showStaffed ? (
          <ul>
            {visible.map((route) => (
              <li key={route.technician.id}>
                <RouteRow
                  route={route}
                  color={route.color}
                  selected={selectedRouteId === route.technician.id}
                  expanded={expanded.includes(route.technician.id)}
                  starred={starred.includes(route.technician.id)}
                  onToggleExpand={() =>
                    setExpanded(toggle(expanded, route.technician.id))
                  }
                  onToggleStar={() =>
                    setStarred(toggle(starred, route.technician.id))
                  }
                  onSelect={() =>
                    onSelectRoute(
                      selectedRouteId === route.technician.id
                        ? null
                        : route.technician.id,
                    )
                  }
                  onSelectJob={onSelectJob}
                />
              </li>
            ))}
            {visible.length === 0 ? (
              <p className="text-muted-foreground px-3 py-6 text-center text-xs">
                No routes match “{query.trim()}”.
              </p>
            ) : null}
          </ul>
        ) : null}

        <SectionHeader
          label="Unassigned"
          count={unassigned.length}
          open={showUnassigned}
          onToggle={() => setShowUnassigned(!showUnassigned)}
        />

        {showUnassigned ? (
          unassigned.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-xs">
              No unassigned jobs found
            </p>
          ) : (
            <ul className="divide-border/60 divide-y">
              {unassigned.map((job) => (
                <li key={job.id}>
                  <StopRow job={job} onClick={() => onSelectJob?.(job.id)} />
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </aside>
  );
}

function RouteRow({
  route,
  color,
  selected,
  expanded,
  starred,
  onToggleExpand,
  onToggleStar,
  onSelect,
  onSelectJob,
}: {
  route: Route;
  color: string;
  selected: boolean;
  expanded: boolean;
  starred: boolean;
  onToggleExpand: () => void;
  onToggleStar: () => void;
  onSelect: () => void;
  onSelectJob?: (jobId: string) => void;
}) {
  const { technician, jobs, bookedMins } = route;
  const done = jobs.filter((j) => j.status === "completed").length;
  const blocked = jobs.some((j) => j.status === "blocked");

  return (
    <div
      className={cn(
        "border-border/60 relative border-b",
        selected && "bg-accent/50",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", color)}
        aria-hidden
      />

      <div className="flex items-center gap-1.5 py-2 pr-2 pl-3">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? "Collapse route" : "Expand route"}
          aria-expanded={expanded}
          className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center"
        >
          {expanded ? (
            <ChevronDown className="size-4" aria-hidden />
          ) : (
            <ChevronRight className="size-4" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Avatar size="sm" className="size-8 shrink-0">
            <AvatarFallback className="text-[11px] font-semibold">
              {technician.initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 leading-tight">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium">
                {technician.name} Route
              </span>
              {blocked ? (
                <AlertTriangle
                  className="text-warning size-3.5 shrink-0"
                  aria-label="Has a blocked stop"
                />
              ) : null}
            </span>
            <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              {technician.zone}
              <span className="inline-flex items-center gap-0.5">
                <Clock className="size-3" aria-hidden />
                {formatDuration(bookedMins)}
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onToggleStar}
          aria-label={starred ? "Unstar route" : "Star route"}
          aria-pressed={starred}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
            starred
              ? "text-warning"
              : "text-muted-foreground/60 hover:text-foreground",
          )}
        >
          <Star
            className={cn("size-3.5", starred && "fill-current")}
            aria-hidden
          />
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
              onClick={() => toast("Optimise route — prototype only")}
            >
              Optimise order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Locked — prototype only")}>
              Lock route
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast("Cleared — prototype only")}>
              Clear stops
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded ? (
        jobs.length === 0 ? (
          <p className="text-muted-foreground px-3 pb-3 pl-10 text-xs">
            No stops on this route.
          </p>
        ) : (
          <ul className="divide-border/60 divide-y border-t border-dashed">
            {jobs.map((job, index) => (
              <li key={job.id}>
                <StopRow
                  job={job}
                  index={index + 1}
                  onClick={() => onSelectJob?.(job.id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

function StopRow({
  job,
  index,
  onClick,
}: {
  job: Job;
  index?: number;
  onClick?: () => void;
}) {
  const status = JOB_STATUS[job.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-muted/60 flex w-full items-center gap-2 py-2 pr-2 pl-10 text-left transition-colors"
    >
      <span className="text-muted-foreground w-4 shrink-0 font-mono text-[11px] tabular-nums">
        {index ?? "—"}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-medium">
          {job.customer}
        </span>
        <span className="text-muted-foreground block truncate text-[11px]">
          {job.ref} · {job.site}
        </span>
      </span>
      <Badge variant="neutral" className="shrink-0 font-mono text-[10px]">
        {formatTime(job.scheduledFor)}
      </Badge>
      <StatusIcon
        className="text-muted-foreground size-3.5 shrink-0"
        aria-label={status.label}
      />
    </button>
  );
}

function SectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="bg-muted/50 hover:bg-muted text-muted-foreground sticky top-0 z-10 flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase transition-colors"
    >
      {open ? (
        <ChevronDown className="size-3.5" aria-hidden />
      ) : (
        <ChevronRight className="size-3.5" aria-hidden />
      )}
      {label}
      <span className="ml-auto font-mono tabular-nums">{count}</span>
    </button>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof ChevronDown;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
    >
      <Icon className="size-3.5" aria-hidden />
    </button>
  );
}
