"use client";

import { Radio } from "lucide-react";
import Link from "next/link";
import { ErrorState, KpiCard, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FAILED_REASON, INSTANCE_STATUS, TODAY_KEY } from "../../components";
import { formatCount, formatKg } from "../../utils";
import {
  NeedsAttentionCard,
  RunsWeekCard,
  StreamWeekCard,
  TodaysRunsCard,
  TomorrowCard,
} from "./components";
import { useDashboard } from "./hooks";

export default function Dashboard() {
  const { model, error, refetch } = useDashboard();
  const k = model?.kpis;

  const runsHint = k
    ? k.runsByStatus
        .map(
          (s) => `${s.count} ${INSTANCE_STATUS[s.status].label.toLowerCase()}`,
        )
        .join(" · ") || "None generated"
    : undefined;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Field Service" }]}
        title="Dashboard"
        description="Today's runs, what needs a dispatcher, and how the week is going."
        actions={
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/field-service/dispatch?date=${TODAY_KEY}`} />}
          >
            <Radio data-icon="inline-start" />
            Open dispatch
          </Button>
        }
      />

      {error && !model ? (
        <Card>
          <CardContent>
            <ErrorState error={error} onRetry={refetch} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 xl:grid-cols-6">
            <KpiCard
              label="Runs today"
              value={k ? formatCount(k.runsToday) : undefined}
              hint={runsHint}
            />
            <KpiCard
              label="Unstaffed runs"
              value={k ? formatCount(k.unstaffedAhead) : undefined}
              hint={k ? `Next 7 days · ${k.unstaffedToday} today` : undefined}
              tone={k && k.unstaffedAhead > 0 ? "destructive" : "default"}
            />
            <KpiCard
              label="Stops done today"
              value={k ? `${k.stopsDone} / ${k.stopsPlanned}` : undefined}
              hint={k ? `${k.stopsFailed} failed visits` : undefined}
            />
            <KpiCard
              label="Collected today"
              value={k ? formatKg(k.kgToday) : undefined}
              hint={
                k
                  ? `${formatCount(k.workOrdersToday)} completed work orders`
                  : undefined
              }
            />
            <KpiCard
              label="Backlog"
              value={k ? formatCount(k.backlog) : undefined}
              hint={
                k ? `${k.staleBacklog} waiting since before today` : undefined
              }
            />
            <KpiCard
              label="Failed visits"
              value={k ? formatCount(k.failedWeek) : undefined}
              hint={
                k
                  ? k.topFailedReason
                    ? `Last 7 days · mostly ${FAILED_REASON[k.topFailedReason].toLowerCase()}`
                    : "Last 7 days"
                  : undefined
              }
            />
          </div>

          <div className="mt-4">
            <TodaysRunsCard runs={model?.runs ?? null} />
          </div>

          <div className="mt-4 grid grid-cols-3 items-start gap-4">
            <NeedsAttentionCard items={model?.attention ?? null} />
            <div className="space-y-4">
              <TomorrowCard tomorrow={model?.tomorrow ?? null} />
              <RunsWeekCard days={model?.runsByDay ?? null} />
            </div>
            <StreamWeekCard streams={model?.streams ?? null} />
          </div>
        </>
      )}
    </>
  );
}
