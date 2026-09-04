"use client";

import { Plus, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/features/crm";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/mocks";
import { CrmTabBar, Screen, ScreenBody } from "../components";
import { usePlaygroundParams } from "../hooks";
import { formatRelative, initials } from "../utils/format";

const STATUS_FILTERS: { id: LeadStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "unqualified", label: "Unqualified" },
];

const STATUS_BADGE: Record<
  LeadStatus,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "outline" },
  unqualified: { label: "Unqualified", variant: "destructive" },
};

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

export function LeadList() {
  const leads = useLeads();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (leads.data ?? [])
      .filter((l) => status === "all" || l.status === status)
      .filter(
        (l) =>
          !term ||
          `${l.firstName} ${l.lastName} ${l.company}`
            .toLowerCase()
            .includes(term),
      )
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }, [leads.data, search, status]);

  const isFiltered = search.trim() !== "" || status !== "all";

  return (
    <Screen>
      <div className="px-4 pt-2">
        <PageHeader
          title="Leads"
          actions={
            <Button size="icon" aria-label="Add lead">
              <Plus />
            </Button>
          }
        />
      </div>

      <div className="space-y-3 px-4 pb-3">
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads"
            aria-label="Search leads"
            className="h-10 ps-9"
          />
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {STATUS_FILTERS.map((f) => {
            const active = f.id === status;
            return (
              <Button
                key={f.id}
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setStatus(f.id)}
                className="shrink-0 rounded-full"
              >
                {f.label}
              </Button>
            );
          })}
        </div>
      </div>

      <ScreenBody>
        {leads.isPending ? (
          <ul className="space-y-2" aria-busy aria-label="Loading leads">
            {SKELETON_ROWS.map((n) => (
              <li key={n} className="flex items-center gap-3 py-2">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : leads.isError ? (
          <ErrorState
            title="Couldn't load leads"
            error={leads.error}
            onRetry={() => leads.refetch()}
          />
        ) : visible.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={SearchX}
              title="No matching leads"
              description="Try another name or clear the filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No leads yet"
              description="Leads from the website form and imports will show up here."
              action={
                <Button size="sm">
                  <Plus data-icon="inline-start" />
                  Add lead
                </Button>
              }
            />
          )
        ) : (
          <ul className="space-y-2">
            {visible.map((lead) => (
              <li key={lead.id}>
                <LeadRow lead={lead} />
              </li>
            ))}
          </ul>
        )}
      </ScreenBody>

      <CrmTabBar active="leads" />
    </Screen>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const { withParams } = usePlaygroundParams();
  const badge = STATUS_BADGE[lead.status];

  return (
    <Link
      href={withParams("/prototypes/lead-detail")}
      className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        size="sm"
        className="hover:bg-muted/50 flex-row items-center gap-3 px-3 transition-colors"
      >
        <Avatar size="lg">
          <AvatarFallback>
            {initials(lead.firstName, lead.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium">
              {lead.firstName} {lead.lastName}
            </p>
            <span className="text-muted-foreground shrink-0 text-xs">
              {formatRelative(lead.lastActivityAt)}
            </span>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {lead.title} · {lead.company}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <ScorePill score={lead.score} />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs tabular-nums",
        score >= 75
          ? "text-foreground"
          : score >= 50
            ? "text-muted-foreground"
            : "text-muted-foreground/70",
      )}
    >
      <span className="sr-only">Fit score</span>
      <span className="bg-muted h-1.5 w-10 overflow-hidden rounded-full">
        <span
          className="bg-foreground block h-full rounded-full"
          style={{ width: `${score}%` }}
        />
      </span>
      {score}
    </span>
  );
}
