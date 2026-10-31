"use client";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  SearchX,
  Wand2,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  autofillShifts,
  defaultScheduleOf,
  isWorkingShift,
  useAppointments,
  useDefaultScheduleStore,
  useRouteInstances,
  useShiftStore,
  useShifts,
  useShiftTemplates,
  useTechnicians,
} from "@/features/field-service";
import type { Shift, Technician } from "@/mocks";
import { ChoiceChips } from "../../components";
import {
  addDays,
  parseDayKey,
  startOfWeek,
  TODAY,
  toDayKey,
  toDubaiDayKey,
} from "../../utils";
import {
  type DayCoverage,
  formatWeekRange,
  isDriver,
  type ProGroup,
  ROLE_FILTERS,
  type RoleFilter,
  type RouteSeat,
  ShiftBoardSkeleton,
  ShiftDialog,
  ShiftGrid,
  ShiftLegend,
  type ShiftTarget,
  seatsByProDay,
} from "./components";

const NO_SEATS: RouteSeat[] = [];
const THIS_WEEK = startOfWeek(TODAY);

/**
 * Who works when, a week at a time: one row per service pro, one cell per day.
 * Routes each pro sits on are overlaid so a missing shift or leave on a route
 * day stands out.
 *
 * Prototype-grade: every edit, Autofill and Copy previous week only patches
 * the session shift store.
 */
export default function ShiftBoard() {
  const pros = useTechnicians();
  const shifts = useShifts();
  const templates = useShiftTemplates();
  const routes = useRouteInstances();
  const appointments = useAppointments();
  const setMany = useShiftStore((s) => s.setMany);
  const removeShift = useShiftStore((s) => s.remove);

  const [weekStart, setWeekStart] = useState(THIS_WEEK);
  const [role, setRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<ShiftTarget | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => toDayKey(addDays(weekStart, i))),
    [weekStart],
  );
  const weekLabel = formatWeekRange(weekStart, addDays(weekStart, 6));

  const allPros = useMemo(() => pros.data ?? [], [pros.data]);
  const schedules = useDefaultScheduleStore((s) => s.schedules);
  const activeTemplates = useMemo(
    () => (templates.data ?? []).filter((t) => t.active),
    [templates.data],
  );
  const proById = useMemo(() => {
    const map = new Map(allPros.map((p) => [p.id, p]));
    return (id: string) => map.get(id);
  }, [allPros]);

  const seats = useMemo(() => seatsByProDay(routes.data ?? []), [routes.data]);
  const seatsOf = useCallback(
    (proId: string, date: string) => seats.get(`${proId}|${date}`) ?? NO_SEATS,
    [seats],
  );

  const groups = useMemo<ProGroup[]>(() => {
    const term = query.trim().toLowerCase();
    const visible = allPros.filter(
      (p) =>
        (role === "all" || (role === "driver") === isDriver(p)) &&
        (!term || p.name.toLowerCase().includes(term)),
    );
    return [
      { id: "drivers", label: "Drivers", pros: visible.filter(isDriver) },
      {
        id: "crew",
        label: "Helpers & trainees",
        pros: visible.filter((p) => !isDriver(p)),
      },
    ];
  }, [allPros, role, query]);
  const visibleCount = groups.reduce((sum, g) => sum + g.pros.length, 0);

  const { shiftOf } = shifts;
  const coverage = useMemo<DayCoverage[]>(
    () =>
      days.map((day) => ({
        day,
        driversOnShift: allPros.filter(
          (p) => isDriver(p) && isWorkingShift(shiftOf(p.id, day)),
        ).length,
        routes: (routes.data ?? []).filter((r) => r.date === day).length,
        stops: (appointments.data ?? []).filter(
          (a) =>
            a.status !== "cancelled" && toDubaiDayKey(a.windowStart) === day,
        ).length,
      })),
    [days, allPros, shiftOf, routes.data, appointments.data],
  );

  /** Bulk changes get an Undo that clears exactly the cells they filled. */
  function announce(created: Shift[], what: string, nothing: string) {
    if (!created.length) {
      toast.info(nothing);
      return;
    }
    setMany(created);
    toast.success(
      `${what} ${created.length} ${created.length === 1 ? "shift" : "shifts"} for ${weekLabel}`,
      {
        description: "Only empty cells were filled.",
        action: {
          label: "Undo",
          onClick: () => {
            for (const s of created) removeShift(s.serviceProId, s.date);
          },
        },
      },
    );
  }

  function autofill() {
    announce(
      autofillShifts(
        // Schedules saved on a pro's profile this session win over the fixture.
        allPros.map((p) => ({
          ...p,
          defaultSchedule: defaultScheduleOf(p, schedules),
        })),
        days,
        activeTemplates,
        shiftOf,
      ),
      "Autofilled",
      "Nothing to fill — every service pro with a default schedule already has this week's shifts.",
    );
  }

  function copyPreviousWeek() {
    const created: Shift[] = [];
    for (const pro of allPros) {
      for (const day of days) {
        if (shiftOf(pro.id, day)) continue;
        const prev = shiftOf(pro.id, toDayKey(addDays(parseDayKey(day), -7)));
        // Leave is personal — it doesn't roll over to the next week.
        if (!prev || prev.type === "leave") continue;
        created.push({
          ...prev,
          id: `shift_${pro.id}_${day.replaceAll("-", "")}`,
          date: day,
        });
      }
    }
    announce(
      created,
      "Copied",
      "Nothing to copy — every cell that had a shift last week is already filled.",
    );
  }

  const isPending =
    pros.isPending ||
    shifts.isPending ||
    templates.isPending ||
    routes.isPending ||
    appointments.isPending;
  const error =
    pros.error ??
    shifts.error ??
    templates.error ??
    routes.error ??
    appointments.error;

  function retry() {
    for (const q of [pros, shifts, templates, routes, appointments])
      if (q.error) q.refetch();
  }

  const ready = !isPending && !error;
  const targetShift = target ? shiftOf(target.pro.id, target.date) : undefined;

  return (
    // Full width for the 7-day grid, with the usual page gutters.
    <div className="px-6 py-8">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Shift board" },
        ]}
        title="Shift board"
        description="Who works when. A service pro needs a working shift to sit on a route that day; leave makes them unavailable."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPreviousWeek}
              disabled={!ready}
            >
              <Copy data-icon="inline-start" />
              Copy previous week
            </Button>
            <Button size="sm" onClick={autofill} disabled={!ready}>
              <Wand2 data-icon="inline-start" />
              Autofill week
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous week"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(THIS_WEEK)}
                disabled={toDayKey(weekStart) === toDayKey(THIS_WEEK)}
              >
                This week
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next week"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
              >
                <ChevronRight />
              </Button>
            </div>
            <h2 className="text-base font-semibold tabular-nums">
              {weekLabel}
            </h2>

            <div className="ml-auto flex items-center gap-3">
              <ChoiceChips
                label="Role"
                options={ROLE_FILTERS}
                value={role}
                onChange={setRole}
              />
              <div className="relative w-56">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search service pros"
                  placeholder="Search service pros…"
                  className="pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {isPending ? (
            <ShiftBoardSkeleton />
          ) : error ? (
            <ErrorState
              title="Couldn't load the shift board"
              error={error}
              onRetry={retry}
            />
          ) : visibleCount === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No service pros match"
              description={
                allPros.length
                  ? "Try another name or switch the role filter back to All."
                  : "There are no service pros yet."
              }
              action={
                allPros.length ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQuery("");
                      setRole("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <ShiftGrid
              days={days}
              today={toDayKey(TODAY)}
              groups={groups}
              shiftOf={shiftOf}
              seatsOf={seatsOf}
              proById={proById}
              coverage={coverage}
              onOpen={(pro: Technician, date: string) =>
                setTarget({ pro, date })
              }
            />
          )}

          <ShiftLegend />
        </CardContent>
      </Card>

      <ShiftDialog
        target={target}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        shift={targetShift}
        seats={target ? seatsOf(target.pro.id, target.date) : NO_SEATS}
        templates={activeTemplates}
        trainers={allPros.filter(isDriver)}
      />
    </div>
  );
}
