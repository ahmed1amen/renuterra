"use client";

import { FileSignature, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  ErrorState,
  KpiCard,
  PageHeader,
  StatusPill,
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
import { useDeals, useLeads } from "@/features/crm";
import { DEAL_STAGES, findUser } from "@/mocks";
import { useAgreementModal } from "@/stores/agreement-modal";
import { AgreementModal, LEAD_SOURCE, LEAD_STATUS } from "../../components";
import { formatCount, formatCurrency } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export default function Dashboard() {
  const leads = useLeads();
  const deals = useDeals();
  const openAgreement = useAgreementModal((s) => s.openModal);

  const pipeline = useMemo(() => {
    const all = deals.data ?? [];
    const open = all.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const won = all.filter((d) => d.stage === "won");
    const lost = all.filter((d) => d.stage === "lost");
    const closed = won.length + lost.length;

    return {
      open: open.reduce((sum, d) => sum + d.value, 0),
      weighted: open.reduce(
        (sum, d) => sum + (d.value * d.probability) / 100,
        0,
      ),
      won: won.reduce((sum, d) => sum + d.value, 0),
      winRate: closed ? Math.round((won.length / closed) * 100) : 0,
      openCount: open.length,
      byStage: DEAL_STAGES.map((stage) => {
        const rows = all.filter((d) => d.stage === stage.id);
        return {
          ...stage,
          count: rows.length,
          value: rows.reduce((sum, d) => sum + d.value, 0),
        };
      }),
    };
  }, [deals.data]);

  const maxStageValue = Math.max(1, ...pipeline.byStage.map((s) => s.value));

  const funnel = useMemo(() => {
    const all = leads.data ?? [];
    const open = all.filter((l) => l.status !== "unqualified");
    return {
      open: open.length,
      new: all.filter((l) => l.status === "new").length,
      qualified: all.filter((l) => l.status === "qualified").length,
      bySource: Object.entries(LEAD_SOURCE).map(([id, source]) => ({
        id,
        ...source,
        count: all.filter((l) => l.source === id).length,
      })),
    };
  }, [leads.data]);

  const maxSourceCount = Math.max(1, ...funnel.bySource.map((s) => s.count));

  /** The deals a rep should be working today: open, biggest first. */
  const topDeals = useMemo(
    () =>
      [...(deals.data ?? [])]
        .filter((d) => d.stage !== "won" && d.stage !== "lost")
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [deals.data],
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Sales" }]}
        title="Dashboard"
        description="Pipeline, win rate and where this quarter's revenue is coming from."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/sales/leads" />}
            >
              View leads
            </Button>
            <Button size="sm" onClick={() => openAgreement()}>
              <FileSignature data-icon="inline-start" />
              New agreement
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open pipeline"
          value={deals.isSuccess ? formatCurrency(pipeline.open) : undefined}
          hint={
            deals.isSuccess ? `${pipeline.openCount} open deals` : undefined
          }
        />
        <KpiCard
          label="Weighted pipeline"
          value={
            deals.isSuccess ? formatCurrency(pipeline.weighted) : undefined
          }
          hint="Value × probability"
        />
        <KpiCard
          label="Closed won"
          value={deals.isSuccess ? formatCurrency(pipeline.won) : undefined}
          hint="This quarter"
        />
        <KpiCard
          label="Win rate"
          value={deals.isSuccess ? `${pipeline.winRate}%` : undefined}
          hint="Of closed deals"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
            <CardDescription>
              Total deal value at each step of the funnel.
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
                {pipeline.byStage.map((stage) => (
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
                          width: `${Math.round((stage.value / maxStageValue) * 100)}%`,
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
            <CardTitle>Where leads come from</CardTitle>
            <CardDescription>
              {leads.isSuccess
                ? `${formatCount(funnel.open)} open · ${formatCount(funnel.qualified)} qualified`
                : "Lead sources this quarter."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leads.isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading lead sources"
              >
                {SKELETON_ROWS.slice(0, 4).map((n) => (
                  <Skeleton key={n} className="h-6 w-full" />
                ))}
              </output>
            ) : leads.isError ? (
              <ErrorState error={leads.error} onRetry={() => leads.refetch()} />
            ) : (
              <ul className="space-y-4">
                {funnel.bySource.map((source) => (
                  <li key={source.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{source.label}</span>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {source.count}
                      </span>
                    </div>
                    <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                      <div
                        className="bg-info h-full rounded-full"
                        style={{
                          width: `${Math.round((source.count / maxSourceCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Biggest open deals</CardTitle>
          <CardDescription>
            Where the quarter is won or lost — largest value first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deals.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading deals"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-9 w-full" />
              ))}
            </output>
          ) : deals.isError ? (
            <ErrorState error={deals.error} onRetry={() => deals.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDeals.map((deal) => {
                  const owner = findUser(deal.ownerId);
                  const stage = DEAL_STAGES.find((s) => s.id === deal.stage);
                  return (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {deal.company}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone="info" dot>
                          {stage?.label}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {formatCurrency(deal.value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono text-sm tabular-nums">
                        {deal.probability}%
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {owner?.name}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-muted-foreground size-4" aria-hidden />
            Lead pipeline
          </CardTitle>
          <CardDescription>
            Open leads by status, newest work first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leads.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading leads"
            >
              {SKELETON_ROWS.slice(0, 3).map((n) => (
                <Skeleton key={n} className="h-9 w-full" />
              ))}
            </output>
          ) : leads.isError ? (
            <ErrorState error={leads.error} onRetry={() => leads.refetch()} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(LEAD_STATUS).map(([id, status]) => {
                const count = (leads.data ?? []).filter(
                  (lead) => lead.status === id,
                ).length;
                return (
                  <li
                    key={id}
                    className="border-border flex items-center justify-between gap-2 rounded-lg border p-3"
                  >
                    <StatusPill tone={status.tone} dot>
                      {status.label}
                    </StatusPill>
                    <span className="font-mono text-lg font-bold tabular-nums">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <AgreementModal />
    </>
  );
}
