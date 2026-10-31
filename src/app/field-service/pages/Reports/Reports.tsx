"use client";

import { ArrowUpRight, Coins } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
} from "@/components/shared";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  expiringForRoutes,
  LIMIT_NAME,
  missedAndRescheduled,
  routeWeeklyUtilisation,
  substitutionLog,
  useAppointments,
  useRouteInstances,
  useVisitHistory,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import { MOCK_NOW } from "@/mocks";
import {
  BarList,
  FAILED_REASON,
  formatDayKey,
  RESCHEDULE_REASON,
  UtilisationBar,
  useRouteContext,
} from "../../components";
import { formatCount } from "../../utils";

const TODAY = MOCK_NOW.slice(0, 10);
const RECENT_WEEKS = 4;

const avg = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;

/**
 * The standard reports the Route module must produce from day one (spec
 * section 11): today's board, route utilisation planned vs actual by week,
 * missed and rescheduled stops by reason, the substitution log, expiring
 * certifications and permits, and route profitability (planned: needs
 * contract prices and costs).
 */
export default function Reports() {
  const { ctx, isPending, error, refetch } = useRouteContext();
  const history = useVisitHistory();
  const instances = useRouteInstances();
  const appointments = useAppointments();

  const data = useMemo(() => {
    const visits = history.data;
    const runs = instances.data;
    const stops = appointments.data;
    if (!ctx || !visits || !runs || !stops) return null;
    const routes = ctx.routes.filter((r) => r.status === "active");
    const utilisation = routes
      .map((route) => {
        const weeks = routeWeeklyUtilisation(
          route,
          ctx,
          visits,
          runs,
          stops,
        ).slice(-RECENT_WEEKS);
        return {
          route,
          planned: avg(weeks.map((w) => w.planned)),
          actual: avg(weeks.map((w) => w.actual)),
          kind: weeks.at(-1)?.kind,
          runs: weeks.reduce((n, w) => n + w.runs, 0),
        };
      })
      .sort((a, b) => b.actual - a.actual);
    const today = runs.filter((i) => i.date === TODAY);
    const byId = new Map(stops.map((a) => [a.id, a]));
    const todayStops = today.flatMap((i) =>
      i.appointmentIds
        .map((id) => byId.get(id))
        .filter((a) => a !== undefined && a.status !== "cancelled"),
    );
    return {
      utilisation,
      today,
      todayStops,
      todayDone: todayStops.filter(
        (a) => a?.status === "completed" || a?.status === "failed",
      ).length,
      reasons: missedAndRescheduled(stops),
      subs: substitutionLog(runs),
      expiring: expiringForRoutes(ctx.pros, ctx.vehicles, ctx.assignments),
    };
  }, [ctx, history.data, instances.data, appointments.data]);

  const routeName = (id: string) =>
    ctx?.routes.find((r) => r.id === id)?.code ?? id;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Reports" },
        ]}
        title="Reports"
        description="The six standard Route reports: how the runs went, where capacity and plans drift, and what needs attention next."
      />

      {error ? (
        <Card>
          <CardContent>
            <ErrorState error={error} onRetry={refetch} />
          </CardContent>
        </Card>
      ) : isPending || !data ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Runs today"
              value={formatCount(data.today.length)}
              hint={`${data.todayDone} of ${data.todayStops.length} stops done`}
              href="/field-service/dispatch"
            />
            <KpiCard
              label="Missed and moved stops"
              value={formatCount(data.reasons.reduce((n, r) => n + r.count, 0))}
              hint="All days in the data"
              href="/field-service/appointments?period=all&status=failed"
            />
            <KpiCard
              label="Substitutions"
              value={formatCount(
                data.subs.reduce((n, r) => n + r.backup + r.pool + r.manual, 0),
              )}
              hint="Backup, pool or manual picks"
            />
            <KpiCard
              label="Expiring in 30 days"
              value={formatCount(data.expiring.length)}
              hint={`${data.expiring.filter((e) => e.daysLeft < 0).length} already expired`}
              tone={
                data.expiring.some((e) => e.daysLeft < 0)
                  ? "destructive"
                  : "default"
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>2 · Route utilisation, planned vs actual</CardTitle>
              <CardDescription>
                Average daily use of each route's binding limit over the last{" "}
                {RECENT_WEEKS} weeks. Open a route's Performance tab for the
                weekly chart and a trip suggestion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Binding limit</TableHead>
                    <TableHead>Planned</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead className="text-end">Gap</TableHead>
                    <TableHead className="text-end">Runs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.utilisation.map((u) => {
                    const gap = u.actual - u.planned;
                    return (
                      <TableRow key={u.route.id}>
                        <TableCell>
                          <Link
                            href={`/field-service/routes/${u.route.id}?tab=performance`}
                            className="text-info font-mono text-xs hover:underline"
                          >
                            {u.route.code}
                          </Link>
                          <span className="text-muted-foreground block text-xs">
                            {u.route.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {u.kind ? LIMIT_NAME[u.kind] : "-"}
                        </TableCell>
                        <TableCell>
                          <UtilisationBar pct={u.planned} />
                        </TableCell>
                        <TableCell>
                          <UtilisationBar pct={u.actual} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-end font-mono text-xs tabular-nums",
                            Math.abs(gap) >= 10 && "text-warning",
                          )}
                        >
                          {gap > 0 ? "+" : ""}
                          {gap} pts
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs tabular-nums">
                          {u.runs}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 items-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>3 · Missed and rescheduled stops</CardTitle>
                <CardDescription>
                  By reason, across every route. Reschedule reasons are captured
                  when a visit is moved or rescheduled at closing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  empty="No missed or rescheduled stops."
                  rows={data.reasons.map((r) => ({
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

            <Card>
              <CardHeader>
                <CardTitle>4 · Substitution log</CardTitle>
                <CardDescription>
                  How often a route ran without its primary assets.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-end">Runs</TableHead>
                      <TableHead className="text-end">Backup</TableHead>
                      <TableHead className="text-end">Pool</TableHead>
                      <TableHead className="text-end">Manual</TableHead>
                      <TableHead className="text-end">Skipped</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.subs.map((s) => (
                      <TableRow key={s.routeId}>
                        <TableCell>
                          <Link
                            href={`/field-service/routes/${s.routeId}?tab=resources`}
                            className="text-info font-mono text-xs hover:underline"
                          >
                            {routeName(s.routeId)}
                          </Link>
                        </TableCell>
                        {[s.runs, s.backup, s.pool, s.manual, s.skipped].map(
                          (n, i) => (
                            <TableCell
                              // biome-ignore lint/suspicious/noArrayIndexKey: fixed column order
                              key={i}
                              className={cn(
                                "text-end font-mono text-xs tabular-nums",
                                n === 0 && "text-muted-foreground",
                                i === 4 && n > 0 && "text-destructive",
                              )}
                            >
                              {n}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 items-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>5 · Expiring certifications and permits</CardTitle>
                <CardDescription>
                  Next 30 days, and anything already expired, for people and
                  trucks assigned to a route.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.expiring.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nothing expiring in the next 30 days.
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {data.expiring.map((e) => (
                      <li
                        key={`${e.assetId}-${e.what}`}
                        className="flex items-start justify-between gap-3 py-2 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{e.name}</span>{" "}
                          <span className="text-muted-foreground text-xs">
                            {e.assetType} · {e.what}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            Affects{" "}
                            {e.routeIds.map((id, i) => (
                              <span key={id}>
                                {i > 0 ? ", " : ""}
                                <Link
                                  href={`/field-service/routes/${id}?tab=resources`}
                                  className="text-info font-mono hover:underline"
                                >
                                  {routeName(id)}
                                </Link>
                              </span>
                            ))}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-end text-xs font-medium",
                            e.daysLeft < 0
                              ? "text-destructive"
                              : "text-warning",
                          )}
                        >
                          {e.daysLeft < 0
                            ? `Expired ${-e.daysLeft}d ago`
                            : `${e.daysLeft}d left`}
                          <span className="text-muted-foreground block font-normal">
                            {formatDayKey(e.expiresOn)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>1 · Daily dispatch board</CardTitle>
                  <CardDescription>
                    Every run, its status, crew and truck, stops done vs planned
                    and exceptions: that report is the Dispatch board itself.
                  </CardDescription>
                  <CardAction>
                    <Link
                      href="/field-service/dispatch"
                      className="text-info flex items-center gap-1 text-sm hover:underline"
                    >
                      Open Dispatch
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </Link>
                  </CardAction>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>6 · Route profitability</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Coins}
                    title="Needs prices and costs"
                    description="Revenue per route comes from the contract lines in the CRM, and costs (fuel, driver hours, tip fees) from Business Central. Planned with the integrations (spec section 11)."
                    className="py-6"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
