"use client";

import { CalendarPlus, Search, SearchX, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  WASTE_STREAMS,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAppointments,
  useDirectory,
  useProjectedVisits,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import {
  type Appointment,
  type AppointmentStatus,
  MOCK_NOW,
  type WasteStreamId,
} from "@/mocks";
import { useBookAppointmentModal } from "@/stores/book-appointment-modal";
import {
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_ORDER,
  AppointmentsTable,
  BookAppointmentDialog,
  CLOSED_STATUSES,
} from "../../components";
import { formatCount, toDubaiDayKey } from "../../utils";
import { ScheduledByRoutes, WorkOrdersList } from "./components";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
const PAGE_SIZE = 25;

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All statuses" },
  ...APPOINTMENT_STATUS_ORDER.map((s) => ({
    value: s,
    label: APPOINTMENT_STATUS[s].label,
  })),
];

const STREAM_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All streams" },
  ...WASTE_STREAMS.map((s) => ({ value: s.id, label: s.label })),
];

type Period = "today" | "upcoming" | "past" | "all";
type View = "appointments" | "work-orders";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

const TODAY_KEY = toDubaiDayKey(MOCK_NOW);
const WEEK_END_KEY = new Date(
  Date.parse(`${TODAY_KEY}T00:00:00Z`) + 7 * 86_400_000,
)
  .toISOString()
  .slice(0, 10);

function inPeriod(apt: Appointment, period: Period) {
  const day = toDubaiDayKey(apt.windowStart);
  if (period === "today") return day === TODAY_KEY;
  if (period === "upcoming") return day > TODAY_KEY;
  if (period === "past") return day < TODAY_KEY;
  return true;
}

const STATUS_VALUES = new Set<string>(STATUS_OPTIONS.map((o) => o.value));
const PERIOD_VALUES = new Set<string>(PERIODS.map((p) => p.id));

// `useSearchParams` needs a Suspense boundary for the route to prerender.
export default function Appointments() {
  return (
    <Suspense fallback={null}>
      <AppointmentsList />
    </Suspense>
  );
}

/**
 * Filters start from the link (`?period=past&status=failed`, `?backlog=1`,
 * `?view=work-orders`), so a dashboard number opens the rows behind it.
 */
function AppointmentsList() {
  const params = useSearchParams();
  const appointments = useAppointments();
  const directory = useDirectory();
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  /** Next 14 days of route-scheduled visits, dispatched or not. */
  const projected = useProjectedVisits();

  const [view, setView] = useState<View>(
    params.get("view") === "work-orders" ? "work-orders" : "appointments",
  );
  const [period, setPeriod] = useState<Period>(() => {
    const p = params.get("period");
    return p && PERIOD_VALUES.has(p) ? (p as Period) : "today";
  });
  const [status, setStatus] = useState<AppointmentStatus | "all">(() => {
    const s = params.get("status");
    return s && STATUS_VALUES.has(s) ? (s as AppointmentStatus) : "all";
  });
  /** Only appointments not on a route instance yet. */
  const [backlogOnly, setBacklogOnly] = useState(params.get("backlog") === "1");
  /** En route or on site (two statuses, so not the status filter). */
  const [inFieldOnly, setInFieldOnly] = useState(false);
  const [stream, setStream] = useState<WasteStreamId | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const all = useMemo(() => appointments.data ?? [], [appointments.data]);

  const stats = useMemo(() => {
    const today = all.filter((a) => inPeriod(a, "today"));
    const weekAgo = new Date(Date.parse(MOCK_NOW) - 7 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return {
      today: today.length,
      todayDone: today.filter((a) => a.status === "completed").length,
      todayUnrouted: today.filter((a) => !a.routeInstanceId).length,
      inField: all.filter(
        (a) => a.status === "en-route" || a.status === "in-progress",
      ).length,
      failedWeek: all.filter(
        (a) => a.status === "failed" && toDubaiDayKey(a.windowStart) >= weekAgo,
      ).length,
      unassigned: all.filter(
        (a) => !a.routeInstanceId && !CLOSED_STATUSES.includes(a.status),
      ).length,
    };
  }, [all]);

  const periodCounts = useMemo(
    () =>
      new Map(
        PERIODS.map((p) => [p.id, all.filter((a) => inPeriod(a, p.id)).length]),
      ),
    [all],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = all
      .filter((a) => inPeriod(a, period))
      .filter((a) => status === "all" || a.status === status)
      .filter((a) => stream === "all" || a.stream === stream)
      .filter(
        (a) =>
          !backlogOnly ||
          (!a.routeInstanceId && !CLOSED_STATUSES.includes(a.status)),
      )
      .filter(
        (a) =>
          !inFieldOnly || a.status === "en-route" || a.status === "in-progress",
      )
      .filter((a) => {
        if (!term) return true;
        const customer = directory.customer(a.customerId)?.name ?? "";
        const site = directory.servicePoint(a.servicePointId)?.location ?? "";
        return `${a.ref} ${customer} ${site}`.toLowerCase().includes(term);
      });
    // Past work reads newest first; everything else soonest first.
    return period === "past" ? rows.reverse() : rows;
  }, [all, period, status, stream, query, directory, backlogOnly, inFieldOnly]);

  const inSelectedPeriod = useMemo(() => {
    const rows = all.filter((a) => inPeriod(a, period));
    return period === "past" ? rows.reverse() : rows;
  }, [all, period]);

  /** Upcoming route-scheduled visits whose day isn't generated yet, filtered like the table. */
  const notGenerated = useMemo(() => {
    if (status !== "all") return [];
    const term = query.trim().toLowerCase();
    return (projected ?? []).filter((v) => {
      if (v.instanceId || v.date <= TODAY_KEY) return false;
      const site = directory.servicePoint(v.servicePointId);
      const line = site?.serviceLines.find((l) => l.id === v.serviceLineId);
      const itemStream = line
        ? directory.serviceItem(line.serviceItemId)?.stream
        : undefined;
      if (stream !== "all" && itemStream !== stream) return false;
      if (!term) return true;
      const customer = directory.customer(v.customerId)?.name ?? "";
      return `${v.routeCode} ${customer} ${site?.location ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [projected, status, stream, query, directory]);
  const showProjected = period === "upcoming" && notGenerated.length > 0;
  const projectedWeek = (projected ?? []).filter((v) => v.date < WEEK_END_KEY);

  /** Each KPI tile sets the filters that show the rows behind its number. */
  type Kpi = "today" | "in-field" | "failed" | "backlog" | "upcoming";
  const applyKpi = (next: Kpi) => {
    setView("appointments");
    setStream("all");
    setQuery("");
    setStatus(next === "failed" ? "failed" : "all");
    setBacklogOnly(next === "backlog");
    setInFieldOnly(next === "in-field");
    // Failed visits include today's, and can't be in the future.
    setPeriod(
      next === "failed" || next === "backlog"
        ? "all"
        : next === "upcoming"
          ? "upcoming"
          : "today",
    );
  };
  const kpi: Kpi | null =
    stream !== "all" || query !== ""
      ? null
      : backlogOnly && status === "all" && period === "all"
        ? "backlog"
        : inFieldOnly && status === "all" && period === "today"
          ? "in-field"
          : status === "failed" && period === "all" && !backlogOnly
            ? "failed"
            : status === "all" && !backlogOnly && !inFieldOnly
              ? period === "today"
                ? "today"
                : period === "upcoming"
                  ? "upcoming"
                  : null
              : null;

  const filtered =
    status !== "all" ||
    stream !== "all" ||
    query !== "" ||
    backlogOnly ||
    inFieldOnly;
  const clearFilters = () => {
    setBacklogOnly(false);
    setInFieldOnly(false);
    setStatus("all");
    setStream("all");
    setQuery("");
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Appointments" },
        ]}
        title="Appointments"
        description="Every booked visit to a customer's service points: recurring and on request."
        actions={
          <Button size="sm" onClick={() => openBooking()}>
            <CalendarPlus data-icon="inline-start" />
            Book appointment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Today"
          value={appointments.isSuccess ? formatCount(stats.today) : undefined}
          hint={
            appointments.isSuccess
              ? `${stats.todayDone} completed${stats.todayUnrouted ? ` · ${stats.todayUnrouted} not on a route yet` : ""}`
              : undefined
          }
          onClick={() => applyKpi("today")}
          active={kpi === "today"}
        />
        <KpiCard
          label="In the field"
          value={
            appointments.isSuccess ? formatCount(stats.inField) : undefined
          }
          hint="En route or on site"
          onClick={() => applyKpi("in-field")}
          active={kpi === "in-field"}
        />
        <KpiCard
          label="Failed visits"
          value={
            appointments.isSuccess ? formatCount(stats.failedWeek) : undefined
          }
          hint="Last 7 days"
          onClick={() => applyKpi("failed")}
          active={kpi === "failed"}
        />
        <KpiCard
          label="In backlog"
          value={
            appointments.isSuccess ? formatCount(stats.unassigned) : undefined
          }
          hint="Not on a route yet"
          onClick={() => applyKpi("backlog")}
          active={kpi === "backlog"}
        />
        <KpiCard
          label="Projected next 7 days"
          value={projected ? formatCount(projectedWeek.length) : undefined}
          hint={
            projected
              ? `${formatCount(projectedWeek.filter((v) => !v.instanceId).length)} not generated yet`
              : undefined
          }
          onClick={() => applyKpi("upcoming")}
          active={kpi === "upcoming"}
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4">
          <Tabs value={view} onValueChange={(next) => setView(next as View)}>
            <TabsList>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="work-orders">Work orders</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap items-center gap-1.5">
              {PERIODS.map((p) => {
                const active = period === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPeriod(p.id);
                        setLimit(PAGE_SIZE);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {p.label}
                      <span className="font-mono text-[11px] tabular-nums opacity-70">
                        {periodCounts.get(p.id) ?? 0}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {view === "appointments" ? (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                {backlogOnly ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBacklogOnly(false)}
                    aria-label="Remove the backlog filter"
                  >
                    Backlog only
                    <X data-icon="inline-end" />
                  </Button>
                ) : null}
                {inFieldOnly ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInFieldOnly(false)}
                    aria-label="Remove the in-the-field filter"
                  >
                    In the field
                    <X data-icon="inline-end" />
                  </Button>
                ) : null}
                <Combobox
                  size="sm"
                  className="w-40"
                  aria-label="Filter by status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onValueChange={(v) =>
                    setStatus(v as AppointmentStatus | "all")
                  }
                />
                <Combobox
                  size="sm"
                  className="w-40"
                  aria-label="Filter by waste stream"
                  options={STREAM_OPTIONS}
                  value={stream}
                  onValueChange={(v) => setStream(v as WasteStreamId | "all")}
                />
                <span className="relative flex w-full sm:w-56">
                  <Search
                    className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search appointments…"
                    aria-label="Search appointments"
                    size="sm"
                    className="ps-9"
                  />
                </span>
              </div>
            ) : null}
          </div>

          {appointments.isPending || directory.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading appointments"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : appointments.isError ? (
            <ErrorState
              error={appointments.error}
              onRetry={() => appointments.refetch()}
            />
          ) : view === "work-orders" ? (
            <WorkOrdersList appointments={inSelectedPeriod} />
          ) : visible.length === 0 && !showProjected ? (
            <EmptyState
              icon={SearchX}
              title={filtered ? "No appointments match" : "Nothing booked here"}
              description={
                filtered
                  ? "Try a different search or clear the filters."
                  : "Book a visit for a customer to see it here."
              }
              action={
                filtered ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => openBooking()}>
                    <CalendarPlus data-icon="inline-start" />
                    Book appointment
                  </Button>
                )
              }
            />
          ) : (
            <>
              {visible.length ? (
                <AppointmentsTable appointments={visible.slice(0, limit)} />
              ) : (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No appointments booked yet: only route-scheduled visits.
                </p>
              )}
              {visible.length > limit ? (
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <p className="text-muted-foreground text-xs">
                    Showing {limit} of {visible.length}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLimit((n) => n + PAGE_SIZE)}
                  >
                    Show more
                  </Button>
                </div>
              ) : null}
              {showProjected ? (
                <ScheduledByRoutes visits={notGenerated} />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <BookAppointmentDialog />
    </>
  );
}
