"use client";

import { CalendarPlus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  WASTE_STREAMS,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments, useDirectory } from "@/features/field-service";
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

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
const PAGE_SIZE = 25;

type Period = "today" | "upcoming" | "past" | "all";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "all", label: "All" },
];

const TODAY_KEY = toDubaiDayKey(MOCK_NOW);

function inPeriod(apt: Appointment, period: Period) {
  const day = toDubaiDayKey(apt.windowStart);
  if (period === "today") return day === TODAY_KEY;
  if (period === "upcoming") return day > TODAY_KEY;
  if (period === "past") return day < TODAY_KEY;
  return true;
}

export default function Appointments() {
  const appointments = useAppointments();
  const directory = useDirectory();
  const openBooking = useBookAppointmentModal((s) => s.openModal);

  const [period, setPeriod] = useState<Period>("today");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
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
      inField: all.filter(
        (a) => a.status === "en-route" || a.status === "in-progress",
      ).length,
      failedWeek: all.filter(
        (a) => a.status === "failed" && toDubaiDayKey(a.windowStart) >= weekAgo,
      ).length,
      unassigned: all.filter(
        (a) => !a.serviceProId && !CLOSED_STATUSES.includes(a.status),
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
      .filter((a) => {
        if (!term) return true;
        const customer = directory.customer(a.customerId)?.name ?? "";
        const site = directory.servicePoint(a.servicePointId)?.location ?? "";
        return `${a.ref} ${customer} ${site}`.toLowerCase().includes(term);
      });
    // Past work reads newest first; everything else soonest first.
    return period === "past" ? rows.reverse() : rows;
  }, [all, period, status, stream, query, directory]);

  const filtered = status !== "all" || stream !== "all" || query !== "";
  const clearFilters = () => {
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
        description="Every booked visit to a customer's service points — recurring and on request."
        actions={
          <Button size="sm" onClick={() => openBooking()}>
            <CalendarPlus data-icon="inline-start" />
            Book appointment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today"
          value={appointments.isSuccess ? formatCount(stats.today) : undefined}
          hint={
            appointments.isSuccess
              ? `${stats.todayDone} completed so far`
              : undefined
          }
        />
        <KpiCard
          label="In the field"
          value={
            appointments.isSuccess ? formatCount(stats.inField) : undefined
          }
          hint="En route or on site"
        />
        <KpiCard
          label="Failed visits"
          value={
            appointments.isSuccess ? formatCount(stats.failedWeek) : undefined
          }
          hint="Last 7 days"
        />
        <KpiCard
          label="Unassigned"
          value={
            appointments.isSuccess ? formatCount(stats.unassigned) : undefined
          }
          hint="Waiting for dispatch"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4">
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

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <NativeSelect
                size="sm"
                aria-label="Filter by status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AppointmentStatus | "all")
                }
              >
                <NativeSelectOption value="all">
                  All statuses
                </NativeSelectOption>
                {APPOINTMENT_STATUS_ORDER.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {APPOINTMENT_STATUS[s].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                size="sm"
                aria-label="Filter by waste stream"
                value={stream}
                onChange={(e) =>
                  setStream(e.target.value as WasteStreamId | "all")
                }
              >
                <NativeSelectOption value="all">All streams</NativeSelectOption>
                {WASTE_STREAMS.map((s) => (
                  <NativeSelectOption key={s.id} value={s.id}>
                    {s.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
                  className="h-8 ps-9"
                />
              </span>
            </div>
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
          ) : visible.length === 0 ? (
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
              <AppointmentsTable appointments={visible.slice(0, limit)} />
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
            </>
          )}
        </CardContent>
      </Card>

      <BookAppointmentDialog />
    </>
  );
}
