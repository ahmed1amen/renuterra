"use client";

import { Building2, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  StreamSwatch,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  useAppointments,
  useCustomers,
  useServiceItems,
  useServicePoints,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import {
  type Appointment,
  type CustomerStatus,
  type CustomerTier,
  MOCK_NOW,
  type ServicePoint,
  type WasteStreamId,
} from "@/mocks";
import {
  CLOSED_STATUSES,
  CustomerFlags,
  CustomerStatusPill,
  TIER_LABEL,
} from "../../components";
import { formatCount, formatDate } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

type StatusFilter = CustomerStatus | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "passive", label: "Passive" },
];

/** Flags that mean someone should look at the account. */
const ATTENTION_FLAGS = ["at_risk", "past_due", "do_not_service"];

export default function Customers() {
  const router = useRouter();
  const customers = useCustomers();
  const servicePoints = useServicePoints();
  const serviceItems = useServiceItems();
  const streamOf = useMemo(
    () => new Map((serviceItems.data ?? []).map((i) => [i.id, i.stream])),
    [serviceItems.data],
  );
  const appointments = useAppointments();

  const [status, setStatus] = useState<StatusFilter>("active");
  const [tier, setTier] = useState<CustomerTier | "all">("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => customers.data ?? [], [customers.data]);

  /** Per-customer rollups: sites, streams handled and the next open visit. */
  const rollup = useMemo(() => {
    const sites = new Map<string, ServicePoint[]>();
    for (const sp of servicePoints.data ?? []) {
      sites.set(sp.customerId, [...(sites.get(sp.customerId) ?? []), sp]);
    }
    const next = new Map<string, Appointment>();
    for (const apt of appointments.data ?? []) {
      if (CLOSED_STATUSES.includes(apt.status) || apt.plannedStart < MOCK_NOW)
        continue;
      if (!next.has(apt.customerId)) next.set(apt.customerId, apt);
    }
    return { sites, next };
  }, [servicePoints.data, appointments.data]);

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([["all", all.length]]);
    for (const c of all) map.set(c.status, (map.get(c.status) ?? 0) + 1);
    return map;
  }, [all]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return all
      .filter((c) => status === "all" || c.status === status)
      .filter((c) => tier === "all" || c.tier === tier)
      .filter(
        (c) =>
          !term ||
          `${c.name} ${c.number} ${c.email} ${c.industry}`
            .toLowerCase()
            .includes(term),
      );
  }, [all, status, tier, query]);

  const activeSites = (servicePoints.data ?? []).filter(
    (sp) => sp.status === "active",
  ).length;
  const needsAttention = all.filter((c) =>
    c.flags.some((f) => ATTENTION_FLAGS.includes(f)),
  ).length;
  const loaded = customers.isSuccess && servicePoints.isSuccess;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Customers" },
        ]}
        title="Customers"
        description="Companies we collect from, their service points and upcoming visits."
        actions={
          <Button
            size="sm"
            onClick={() =>
              toast.info("New customers come from signed contracts", {
                description: "Prototype — onboarding lives in Sales.",
              })
            }
          >
            <Building2 data-icon="inline-start" />
            New customer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active customers"
          value={loaded ? formatCount(counts.get("active") ?? 0) : undefined}
          hint={loaded ? `${counts.get("passive") ?? 0} passive` : undefined}
        />
        <KpiCard
          label="Service points"
          value={loaded ? formatCount(activeSites) : undefined}
          hint="Active collection sites"
        />
        <KpiCard
          label="Platinum & Gold"
          value={
            loaded
              ? formatCount(
                  all.filter((c) => c.tier === "platinum" || c.tier === "gold")
                    .length,
                )
              : undefined
          }
          hint="Key accounts"
        />
        <KpiCard
          label="Needs attention"
          value={loaded ? formatCount(needsAttention) : undefined}
          hint="At risk, past due or on hold"
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

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <NativeSelect
                size="sm"
                aria-label="Filter by tier"
                value={tier}
                onChange={(e) =>
                  setTier(e.target.value as CustomerTier | "all")
                }
              >
                <NativeSelectOption value="all">All tiers</NativeSelectOption>
                {(Object.keys(TIER_LABEL) as CustomerTier[]).map((t) => (
                  <NativeSelectOption key={t} value={t}>
                    {TIER_LABEL[t]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <span className="relative flex w-full sm:w-64">
                <Search
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, code, industry…"
                  aria-label="Search customers"
                  className="h-8 ps-9"
                />
              </span>
            </div>
          </div>

          {customers.isPending || servicePoints.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading customers"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : customers.isError ? (
            <ErrorState
              error={customers.error}
              onRetry={() => customers.refetch()}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No customers match"
              description="Try a different search or clear the filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatus("all");
                    setTier("all");
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
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Industry
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Service points</TableHead>
                  <TableHead>Next visit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((customer) => {
                  const sites = rollup.sites.get(customer.id) ?? [];
                  const streams = [
                    ...new Set(
                      sites.flatMap((sp) =>
                        sp.serviceLines.flatMap(
                          (l) => streamOf.get(l.serviceItemId) ?? [],
                        ),
                      ),
                    ),
                  ] as WasteStreamId[];
                  const next = rollup.next.get(customer.id);
                  const nextServicePoint = next
                    ? sites.find((sp) => sp.id === next.servicePointId)
                    : undefined;
                  const href = `/field-service/customers/${customer.id}`;
                  return (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => router.push(href)}
                    >
                      <TableCell className="max-w-72">
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <span className="text-muted-foreground block font-mono text-xs">
                          {customer.number} · {customer.emirate}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                        {customer.industry}
                      </TableCell>
                      <TableCell className="text-sm">
                        {TIER_LABEL[customer.tier]}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-sm tabular-nums">
                            {sites.length}
                          </span>
                          <span className="flex gap-1">
                            {streams.map((s) => (
                              <StreamSwatch key={s} stream={s} />
                            ))}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {next ? (
                          <>
                            <span className="block">
                              {formatDate(next.windowStart)}
                            </span>
                            <span className="text-muted-foreground block max-w-48 truncate text-xs">
                              {nextServicePoint?.location}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-1">
                          <CustomerStatusPill status={customer.status} />
                          <CustomerFlags flags={customer.flags} />
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
