"use client";

import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fillByWeekday,
  LIMIT_NAME,
  missedAndRescheduled,
  type RouteContext,
  routeWeeklyUtilisation,
  substitutionLog,
  useAppointments,
  useRouteStore,
  useVisitHistory,
} from "@/features/field-service";
import type { Route, RouteInstance } from "@/mocks";
import {
  BarList,
  BulletColumns,
  Columns,
  FAILED_REASON,
  formatShortDay,
  RESCHEDULE_REASON,
} from "../../../components";

/** Recent weeks the trip suggestion looks at. */
const RECENT_WEEKS = 4;

/**
 * How the Route actually runs (spec section 8.5 rule 4: the planner tunes
 * fill rate, cycle time and trip count from real data): planned vs actual
 * by week on its binding limit, fill by weekday, missed and moved stops,
 * substitutions, and a trip-count suggestion with Accept.
 */
export function PerformanceTab({
  route,
  ctx,
  instances,
}: {
  route: Route;
  ctx: RouteContext;
  /** This Route's instances. */
  instances: RouteInstance[];
}) {
  const history = useVisitHistory().data ?? [];
  const appointments = useAppointments().data ?? [];
  const patchRoute = useRouteStore((s) => s.patchRoute);

  const weeks = routeWeeklyUtilisation(
    route,
    ctx,
    history,
    instances,
    appointments,
  );
  const recent = weeks.slice(-RECENT_WEEKS);
  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
  const recentPlanned = avg(recent.map((w) => w.planned));
  const recentActual = avg(recent.map((w) => w.actual));
  const limit = weeks.at(-1)?.kind;

  // Fewer trips would still fit the busiest recent week under 90%.
  const peak = Math.max(0, ...recent.map((w) => Math.max(w.planned, w.actual)));
  const tripsNeeded =
    limit && limit !== "visits" && peak > 0
      ? Math.max(1, Math.ceil((peak * route.plannedTrips) / 90))
      : route.plannedTrips;
  const suggestTrips =
    route.status !== "retired" && tripsNeeded < route.plannedTrips
      ? tripsNeeded
      : null;

  const ids = new Set(instances.map((i) => i.id));
  const reasons = missedAndRescheduled(
    appointments.filter(
      (a) => a.routeInstanceId !== null && ids.has(a.routeInstanceId),
    ),
  );
  const subs = substitutionLog(instances)[0];
  const fill = fillByWeekday(route, history);
  const hasBins = fill.some((d) => d.fill !== null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Planned vs actual, by week</CardTitle>
          <CardDescription>
            Average daily utilisation of the binding limit
            {limit ? ` (${LIMIT_NAME[limit]})` : ""}: planned with today's fill
            rates and quantities, actual from what the visits recorded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeks.length ? (
            <BulletColumns
              rows={weeks.map((w) => ({
                key: w.week,
                label: formatShortDay(w.week),
                actual: w.actual,
                planned: w.planned,
                note: `${w.runs} ${w.runs === 1 ? "run" : "runs"}`,
              }))}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              No visits recorded for this route yet.
            </p>
          )}
          {weeks.length ? (
            <p className="text-sm">
              Last {recent.length} weeks: actual{" "}
              <span className="font-mono tabular-nums">{recentActual}%</span>{" "}
              against planned{" "}
              <span className="font-mono tabular-nums">{recentPlanned}%</span>
              {recentActual > recentPlanned + 10
                ? ". Runs carry more than planned: check fill rates on the Service lines tab."
                : recentActual < recentPlanned - 10
                  ? ". Runs carry less than planned: the fill-rate assumptions may be high."
                  : ". Plan and reality agree."}
            </p>
          ) : null}
          {suggestTrips ? (
            <div className="bg-muted/50 flex items-start gap-3 rounded-lg p-3">
              <Lightbulb
                className="text-warning mt-0.5 size-4 shrink-0"
                aria-hidden
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">
                  {suggestTrips} {suggestTrips === 1 ? "trip" : "trips"} per
                  shift would do
                </p>
                <p className="text-muted-foreground text-xs">
                  The busiest of the last {recent.length} weeks reached {peak}%
                  with {route.plannedTrips} trips; {suggestTrips} keeps it under
                  90%. Fewer tipping trips mean less driving.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const before = route.plannedTrips;
                  patchRoute(route.id, { plannedTrips: suggestTrips });
                  toast.success(
                    `${route.code}: ${suggestTrips} trips per shift`,
                    {
                      action: {
                        label: "Undo",
                        onClick: () =>
                          patchRoute(route.id, { plannedTrips: before }),
                      },
                    },
                  );
                }}
              >
                Accept
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {hasBins ? (
          <Card>
            <CardHeader>
              <CardTitle>Fill level by weekday</CardTitle>
              <CardDescription>
                Drivers' reported fill on this route's bins, against the
                standard it plans with.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Columns
                rows={fill.map((d) => ({
                  key: d.label,
                  label: d.label,
                  value: d.fill,
                  note: `${d.visits} visits`,
                }))}
                reference={{
                  value: Math.round(route.fillRate * 100),
                  label: "Standard",
                }}
              />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Missed and rescheduled stops</CardTitle>
            <CardDescription>
              On this route's runs, by reason (report 3).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              empty="No missed or rescheduled stops on its runs."
              rows={reasons.map((r) => ({
                key: `${r.kind}-${r.reason}`,
                label:
                  r.kind === "missed"
                    ? FAILED_REASON[r.reason as keyof typeof FAILED_REASON]
                    : RESCHEDULE_REASON[
                        r.reason as keyof typeof RESCHEDULE_REASON
                      ],
                tag: r.kind === "missed" ? "missed" : "moved",
                value: r.count,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Runs"
          value={String(subs?.runs ?? 0)}
          hint="In the data so far"
        />
        <KpiCard
          label="Backup used"
          value={String(subs?.backup ?? 0)}
          hint="Slots filled by a ranked backup"
        />
        <KpiCard
          label="Pool used"
          value={String(subs?.pool ?? 0)}
          hint="Slots filled from the pool"
        />
        <KpiCard
          label="Assigned skipped"
          value={String(subs?.skipped ?? 0)}
          hint="Failed a check at generation (R5)"
          tone={(subs?.skipped ?? 0) > 0 ? "destructive" : "default"}
        />
      </div>
    </div>
  );
}
