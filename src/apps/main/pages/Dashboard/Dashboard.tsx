"use client";

import {
  CalendarDays,
  Circle,
  CircleCheck,
  type LucideIcon,
  Mail,
  Phone,
  Plus,
  StickyNote,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  ErrorState,
  PageHeader,
  StatusPill,
  type StatusTone,
} from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useActivities, useDeals, useLeads } from "@/features/crm";
import {
  type ActivityType,
  DEAL_STAGES,
  findUser,
  type LeadStatus,
} from "@/mocks";
import { KpiCard } from "../../components";
import { formatCount, formatCurrency, formatRelative } from "../../utils";

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: CalendarDays,
  note: StickyNote,
  task: Circle,
};

const LEAD_STATUS: Record<LeadStatus, { label: string; tone: StatusTone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "warning" },
  qualified: { label: "Qualified", tone: "success" },
  unqualified: { label: "Unqualified", tone: "neutral" },
};

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export default function Dashboard() {
  const leads = useLeads();
  const deals = useDeals();
  const activities = useActivities();

  const leadStats = useMemo(() => {
    const all = leads.data ?? [];
    const open = all.filter((l) => l.status !== "unqualified");
    return {
      open: open.length,
      fresh: all.filter((l) => l.status === "new").length,
      top: [...open].sort((a, b) => b.score - a.score).slice(0, 5),
    };
  }, [leads.data]);

  const dealStats = useMemo(() => {
    const all = deals.data ?? [];
    const openDeals = all.filter(
      (d) => d.stage !== "won" && d.stage !== "lost",
    );
    const byStage = DEAL_STAGES.map((stage) => {
      const rows = all.filter((d) => d.stage === stage.id);
      return {
        ...stage,
        count: rows.length,
        value: rows.reduce((sum, d) => sum + d.value, 0),
      };
    });
    return {
      pipeline: openDeals.reduce((sum, d) => sum + d.value, 0),
      weighted: openDeals.reduce(
        (sum, d) => sum + (d.value * d.probability) / 100,
        0,
      ),
      won: all
        .filter((d) => d.stage === "won")
        .reduce((sum, d) => sum + d.value, 0),
      byStage,
      maxStageValue: Math.max(1, ...byStage.map((s) => s.value)),
    };
  }, [deals.data]);

  const recentActivities = (activities.data ?? []).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Pipeline, leads and team activity at a glance."
        actions={
          <Button
            size="sm"
            onClick={() => toast.success("Lead created — prototype only")}
          >
            <Plus data-icon="inline-start" />
            New lead
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open leads"
          value={leads.isSuccess ? formatCount(leadStats.open) : undefined}
          hint={
            leads.isSuccess ? `${formatCount(leadStats.fresh)} new` : undefined
          }
        />
        <KpiCard
          label="Pipeline value"
          value={
            deals.isSuccess ? formatCurrency(dealStats.pipeline) : undefined
          }
          hint="Open deals"
        />
        <KpiCard
          label="Weighted pipeline"
          value={
            deals.isSuccess ? formatCurrency(dealStats.weighted) : undefined
          }
          hint="Value × probability"
        />
        <KpiCard
          label="Won"
          value={deals.isSuccess ? formatCurrency(dealStats.won) : undefined}
          hint="Closed deals"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
            <CardDescription>
              Total deal value in each stage of the funnel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deals.isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading pipeline"
              >
                {SKELETON_ROWS.map((n) => (
                  <Skeleton key={n} className="h-6 w-full" />
                ))}
              </output>
            ) : deals.isError ? (
              <ErrorState error={deals.error} onRetry={() => deals.refetch()} />
            ) : (
              <ul className="space-y-4">
                {dealStats.byStage.map((stage) => (
                  <li key={stage.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {stage.label}
                        <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                          {stage.count}
                        </span>
                      </span>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${Math.round((stage.value / dealStats.maxStageValue) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest touches across the team.</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading activity"
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
            ) : activities.isError ? (
              <ErrorState
                error={activities.error}
                onRetry={() => activities.refetch()}
              />
            ) : (
              <ul className="space-y-1">
                {recentActivities.map((activity) => {
                  const done = activity.type === "task" && activity.completed;
                  const Icon = done
                    ? CircleCheck
                    : ACTIVITY_ICONS[activity.type];
                  const actor = findUser(activity.actorId);
                  return (
                    <li key={activity.id} className="flex gap-3 py-2">
                      <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {activity.subject}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {actor?.name} · {activity.relatedTo.name} ·{" "}
                          {formatRelative(activity.occurredAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Top leads</CardTitle>
          <CardDescription>
            Highest fit scores among open leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading leads"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-9 w-full" />
              ))}
            </output>
          ) : leads.isError ? (
            <ErrorState error={leads.error} onRetry={() => leads.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadStats.top.map((lead) => {
                  const status = LEAD_STATUS[lead.status];
                  const owner = findUser(lead.ownerId);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.firstName} {lead.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.company}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={status.tone} dot>
                          {status.label}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {lead.score}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <Avatar size="sm" className="size-6">
                            <AvatarFallback className="text-[10px] font-semibold">
                              {owner?.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground text-sm">
                            {owner?.name}
                          </span>
                        </span>
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
