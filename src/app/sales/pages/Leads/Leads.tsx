"use client";

import { FileSignature, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  StatusPill,
} from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLeads } from "@/features/crm";
import { cn } from "@/lib/utils";
import { findUser, type LeadStatus } from "@/mocks";
import { useAgreementModal } from "@/stores/agreement-modal";
import { AgreementModal, LEAD_SOURCE, LEAD_STATUS } from "../../components";
import { formatCount, formatRelative } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

type StatusFilter = LeadStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "unqualified", label: "Unqualified" },
];

export default function Leads() {
  const leads = useLeads();
  const openAgreement = useAgreementModal((s) => s.openModal);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const all = useMemo(() => leads.data ?? [], [leads.data]);

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([["all", all.length]]);
    for (const lead of all) {
      map.set(lead.status, (map.get(lead.status) ?? 0) + 1);
    }
    return map;
  }, [all]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return all
      .filter((lead) => status === "all" || lead.status === status)
      .filter(
        (lead) =>
          !term ||
          `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(term) ||
          lead.company.toLowerCase().includes(term) ||
          lead.email.toLowerCase().includes(term),
      )
      .sort((a, b) => b.score - a.score);
  }, [all, status, query]);

  const avgScore = all.length
    ? Math.round(all.reduce((sum, lead) => sum + lead.score, 0) / all.length)
    : 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Sales", href: "/sales" },
          { label: "Leads" },
        ]}
        title="Leads"
        description="Everyone in the funnel, hottest fit score first."
        actions={
          <Button size="sm" onClick={() => openAgreement()}>
            <FileSignature data-icon="inline-start" />
            New agreement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="All leads"
          value={leads.isSuccess ? formatCount(all.length) : undefined}
          hint={
            leads.isSuccess
              ? `${counts.get("new") ?? 0} new this week`
              : undefined
          }
        />
        <KpiCard
          label="Qualified"
          value={
            leads.isSuccess
              ? formatCount(counts.get("qualified") ?? 0)
              : undefined
          }
          hint="Ready for an agreement"
        />
        <KpiCard
          label="Contacted"
          value={
            leads.isSuccess
              ? formatCount(counts.get("contacted") ?? 0)
              : undefined
          }
          hint="Awaiting a reply"
        />
        <KpiCard
          label="Average score"
          value={leads.isSuccess ? `${avgScore}` : undefined}
          hint="Fit out of 100"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((filter) => {
                const active = status === filter.id;
                return (
                  <li key={filter.id}>
                    <button
                      type="button"
                      onClick={() => setStatus(filter.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {filter.label}
                      <span className="font-mono text-[11px] tabular-nums opacity-70">
                        {counts.get(filter.id) ?? 0}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <span className="relative flex w-full sm:w-64">
              <Search
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, company or email…"
                aria-label="Search leads"
                className="h-9 ps-9"
              />
            </span>
          </div>

          {leads.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading leads"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-10 w-full" />
              ))}
            </output>
          ) : leads.isError ? (
            <ErrorState error={leads.error} onRetry={() => leads.refetch()} />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No leads match"
              description="Try a different search or clear the status filter."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((lead) => {
                  const statusMeta = LEAD_STATUS[lead.status];
                  const owner = findUser(lead.ownerId);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <span className="block text-sm font-medium">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {lead.title}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.company}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={statusMeta.tone} dot>
                          {statusMeta.label}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {LEAD_SOURCE[lead.source].label}
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
                      <TableCell className="text-muted-foreground text-sm">
                        {formatRelative(lead.lastActivityAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AgreementModal />
    </>
  );
}
