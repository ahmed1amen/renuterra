"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  ErrorState,
  KpiCard,
  PageHeader,
  StreamTag,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import { useDispatchBoard } from "@/features/field-service";
import { findTechnician } from "@/mocks";
import {
  JOB_STATUS,
  JOB_STATUS_ORDER,
  JobStatusPill,
  PriorityLabel,
  TechnicianIdentity,
  TechnicianStatusPill,
} from "../../components";
import { formatCount, formatDuration, formatTime } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export default function Dashboard() {
  const { jobs, lanes, unassigned, isPending, isError, error, refetch } =
    useDispatchBoard();

  const stats = useMemo(() => {
    const active = jobs.filter(
      (j) => j.status === "en-route" || j.status === "on-site",
    );
    const completed = jobs.filter((j) => j.status === "completed");
    const blocked = jobs.filter((j) => j.status === "blocked");
    return {
      total: jobs.length,
      active: active.length,
      completed: completed.length,
      blocked: blocked.length,
      unassigned: unassigned.length,
      urgentUnassigned: unassigned.filter(
        (j) => j.priority === "urgent" || j.priority === "high",
      ).length,
      byStatus: JOB_STATUS_ORDER.map((status) => ({
        status,
        ...JOB_STATUS[status],
        count: jobs.filter((j) => j.status === status).length,
      })),
    };
  }, [jobs, unassigned]);

  const maxStatusCount = Math.max(1, ...stats.byStatus.map((s) => s.count));

  /** Everything still to run today, soonest first. */
  const upcoming = useMemo(
    () => jobs.filter((j) => j.status !== "completed").slice(0, 8),
    [jobs],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Field Service" }]}
        title="Dashboard"
        description="Today's work orders, crew status and anything still unassigned."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/field-service/dispatch" />}
            >
              Open dispatch
            </Button>
            <Button
              size="sm"
              onClick={() => toast.success("Job created — prototype only")}
            >
              <Plus data-icon="inline-start" />
              New job
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Jobs today"
          value={isPending ? undefined : formatCount(stats.total)}
          hint={isPending ? undefined : `${stats.active} in progress`}
        />
        <KpiCard
          label="Unassigned"
          value={isPending ? undefined : formatCount(stats.unassigned)}
          hint={
            isPending ? undefined : `${stats.urgentUnassigned} high or urgent`
          }
        />
        <KpiCard
          label="Completed"
          value={isPending ? undefined : formatCount(stats.completed)}
          hint="Closed out today"
        />
        <KpiCard
          label="Blocked"
          value={isPending ? undefined : formatCount(stats.blocked)}
          hint="Needs a dispatcher"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Jobs by status</CardTitle>
            <CardDescription>
              Where today's work orders stand right now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading job statuses"
              >
                {SKELETON_ROWS.map((n) => (
                  <Skeleton key={n} className="h-6 w-full" />
                ))}
              </output>
            ) : isError ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : (
              <ul className="space-y-4">
                {stats.byStatus.map((row) => {
                  const Icon = row.icon;
                  return (
                    <li key={row.status} className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Icon
                            className="text-muted-foreground size-3.5"
                            aria-hidden
                          />
                          {row.label}
                        </span>
                        <span className="text-muted-foreground font-mono text-xs tabular-nums">
                          {row.count}
                        </span>
                      </div>
                      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{
                            width: `${Math.round((row.count / maxStatusCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crew</CardTitle>
            <CardDescription>
              Who is out and how loaded they are.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading crew"
              >
                {SKELETON_ROWS.map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </output>
            ) : isError ? (
              <ErrorState error={error} onRetry={refetch} />
            ) : (
              <ul className="space-y-3">
                {lanes.map(({ technician, jobs: laneJobs, bookedMins }) => (
                  <li
                    key={technician.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <TechnicianIdentity technician={technician} />
                    <span className="shrink-0 space-y-1 text-right">
                      <TechnicianStatusPill status={technician.status} />
                      <span className="text-muted-foreground block font-mono text-[11px] tabular-nums">
                        {laneJobs.length} · {formatDuration(bookedMins)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Up next</CardTitle>
          <CardDescription>
            Open work orders in the order they are due.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading jobs"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-9 w-full" />
              ))}
            </output>
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stream</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((job) => {
                  const tech = findTechnician(job.technicianId);
                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {job.ref}
                      </TableCell>
                      <TableCell>
                        <span className="block text-sm font-medium">
                          {job.customer}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {job.site}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StreamTag stream={job.stream} />
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {job.window}
                        <span className="text-muted-foreground ml-1.5">
                          {formatTime(job.scheduledFor)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <JobStatusPill status={job.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tech?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <PriorityLabel priority={job.priority} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
