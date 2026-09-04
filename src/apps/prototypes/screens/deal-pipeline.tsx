"use client";

import { CalendarDays, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/features/crm";
import { cn } from "@/lib/utils";
import { DEAL_STAGES, type Deal, type DealStage, findUser } from "@/mocks";
import { CrmTabBar, Screen, ScreenBody } from "../components";
import { formatCurrency, formatShortDate } from "../utils/format";

const OPEN_STAGES: DealStage[] = [
  "prospecting",
  "qualification",
  "proposal",
  "negotiation",
];

const SKELETON_ROWS = [0, 1, 2];

export function DealPipeline() {
  const deals = useDeals();
  const [stage, setStage] = useState<DealStage>("proposal");

  const summary = useMemo(() => {
    const open = (deals.data ?? []).filter((d) =>
      OPEN_STAGES.includes(d.stage),
    );
    const total = open.reduce((sum, d) => sum + d.value, 0);
    const weighted = open.reduce(
      (sum, d) => sum + (d.value * d.probability) / 100,
      0,
    );
    return { count: open.length, total, weighted };
  }, [deals.data]);

  const inStage = useMemo(
    () =>
      (deals.data ?? [])
        .filter((d) => d.stage === stage)
        .sort((a, b) => b.value - a.value),
    [deals.data, stage],
  );

  const countFor = (id: DealStage) =>
    (deals.data ?? []).filter((d) => d.stage === id).length;

  return (
    <Screen>
      <div className="px-4 pt-2">
        <PageHeader
          title="Deals"
          actions={
            <Button size="icon" aria-label="Add deal">
              <Plus />
            </Button>
          }
        />
      </div>

      <div className="space-y-3 pb-3">
        <div className="flex gap-3 overflow-x-auto px-4 [scrollbar-width:none]">
          <Stat
            label="Open pipeline"
            value={deals.isSuccess ? formatCurrency(summary.total) : undefined}
          />
          <Stat
            label="Weighted"
            value={
              deals.isSuccess ? formatCurrency(summary.weighted) : undefined
            }
          />
          <Stat
            label="Open deals"
            value={deals.isSuccess ? String(summary.count) : undefined}
          />
        </div>

        <div
          role="tablist"
          aria-label="Pipeline stage"
          className="flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]"
        >
          {DEAL_STAGES.map((s) => {
            const active = s.id === stage;
            return (
              <Button
                key={s.id}
                role="tab"
                aria-selected={active}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setStage(s.id)}
                className="shrink-0 rounded-full"
              >
                {s.label}
                {deals.isSuccess ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[0.65rem] tabular-nums",
                      active ? "bg-primary-foreground/20" : "bg-muted",
                    )}
                  >
                    {countFor(s.id)}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
      </div>

      <ScreenBody>
        {deals.isPending ? (
          <output
            className="block space-y-3"
            aria-busy
            aria-label="Loading deals"
          >
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-28 w-full rounded-xl" />
            ))}
          </output>
        ) : deals.isError ? (
          <ErrorState
            title="Couldn't load deals"
            error={deals.error}
            onRetry={() => deals.refetch()}
          />
        ) : inStage.length === 0 ? (
          <EmptyState
            title={`Nothing in ${DEAL_STAGES.find((s) => s.id === stage)?.label.toLowerCase()}`}
            description="Move a deal here or create a new one."
            action={
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Add deal
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {inStage.map((deal) => (
              <li key={deal.id}>
                <DealCard deal={deal} />
              </li>
            ))}
          </ul>
        )}
      </ScreenBody>

      <CrmTabBar active="deals" />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <Card size="sm" className="min-w-32 shrink-0">
      <CardHeader>
        <CardDescription className="text-xs">{label}</CardDescription>
        {value === undefined ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <CardTitle className="text-lg tabular-nums">{value}</CardTitle>
        )}
      </CardHeader>
    </Card>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const owner = findUser(deal.ownerId);
  const closed = deal.stage === "won" || deal.stage === "lost";

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="leading-tight">{deal.name}</CardTitle>
        <CardDescription className="text-xs">{deal.company}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(deal.value)}
          </span>
          <Badge variant={closed ? "secondary" : "outline"}>
            {deal.probability}% likely
          </Badge>
        </div>
        <div
          className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
          aria-hidden
        >
          <div
            className="bg-foreground h-full rounded-full"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" aria-hidden />
            {closed ? "Closed" : "Closes"} {formatShortDate(deal.closeDate)}
          </span>
          {owner ? (
            <span className="flex items-center gap-1.5">
              <Avatar size="sm">
                <AvatarFallback>{owner.initials}</AvatarFallback>
              </Avatar>
              {owner.name.split(" ")[0]}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
