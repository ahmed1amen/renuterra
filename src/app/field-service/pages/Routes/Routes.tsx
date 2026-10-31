"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Plus,
  Route as RouteIcon,
  Search,
  SearchX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
  GRADE_LABEL,
  gradeOf,
  plannedUtilisation,
  type ScoreGrade,
  useRouteInstances,
  useRouteScoring,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type {
  CityCode,
  EntityCode,
  RouteStatus,
  ServiceTypeCode,
} from "@/mocks";
import {
  dayKeyFromToday,
  RouteFormDialog,
  RouteScoreBadge,
  RouteStatusPill,
  scheduleLabel,
  TODAY_KEY,
  UtilisationBar,
  useRouteContext,
} from "../../components";
import { formatCount } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

type StatusFilter = RouteStatus | "all";
type SortDir = "asc" | "desc" | null;

const GRADES: ScoreGrade[] = ["excellent", "good", "fair", "poor"];

const ARIA_SORT = {
  asc: "ascending",
  desc: "descending",
  none: "none",
} as const;

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "suspended", label: "Suspended" },
  { id: "retired", label: "Retired" },
  { id: "all", label: "All" },
];

export default function Routes() {
  const router = useRouter();
  const { ctx, isPending, error, refetch } = useRouteContext();
  const instances = useRouteInstances();
  const scoring = useRouteScoring();

  const [status, setStatus] = useState<StatusFilter>("active");
  const [entity, setEntity] = useState<EntityCode | "all">("all");
  const [city, setCity] = useState<CityCode | "all">("all");
  const [serviceType, setServiceType] = useState<ServiceTypeCode | "all">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [scoreSort, setScoreSort] = useState<SortDir>(null);

  /** Per-route rollups: utilisation and primary truck / driver. */
  const rows = useMemo(() => {
    if (!ctx) return [];
    return ctx.routes.map((route) => {
      const primaries = ctx.assignments.filter(
        (a) =>
          a.routeId === route.id &&
          a.role === "primary" &&
          a.status === "active",
      );
      const drivers = primaries
        .filter((a) => a.assetType === "driver")
        .map((a) => ctx.pros.find((p) => p.id === a.assetId))
        .filter((p) => p !== undefined);
      const truck = ctx.vehicles.find(
        (v) => v.id === primaries.find((a) => a.assetType === "truck")?.assetId,
      );
      return {
        route,
        util: plannedUtilisation(route, ctx),
        score: scoring.routeScore(route),
        drivers,
        truck,
      };
    });
  }, [ctx, scoring]);

  const counts = useMemo(() => {
    const map = new Map<StatusFilter, number>([["all", rows.length]]);
    for (const { route } of rows)
      map.set(route.status, (map.get(route.status) ?? 0) + 1);
    return map;
  }, [rows]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = rows
      .filter(({ route }) => status === "all" || route.status === status)
      .filter(({ route }) => entity === "all" || route.entity === entity)
      .filter(({ route }) => city === "all" || route.city === city)
      .filter(
        ({ route }) =>
          serviceType === "all" || route.serviceType === serviceType,
      )
      .filter(
        ({ route }) =>
          !term || `${route.code} ${route.name}`.toLowerCase().includes(term),
      );
    if (!scoreSort) return filtered;
    // Unscored (no stops / loading) always sink to the bottom.
    const value = (r: (typeof filtered)[number]) =>
      r.score && r.score.stops > 0 ? r.score.total : null;
    return [...filtered].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      if (va === null || vb === null) return va === null ? 1 : -1;
      return scoreSort === "asc" ? va - vb : vb - va;
    });
  }, [rows, status, entity, city, serviceType, query, scoreSort]);

  // Average and grade spread over active routes that have something to score.
  const scored = rows.flatMap(({ route, score }) =>
    route.status === "active" && score && score.stops > 0 ? [score] : [],
  );
  const avgScore = scored.length
    ? Math.round(scored.reduce((n, s) => n + s.total, 0) / scored.length)
    : null;
  const gradeHint = GRADES.map(
    (g) =>
      `${scored.filter((s) => s.grade === g).length} ${GRADE_LABEL[g].toLowerCase()}`,
  ).join(" · ");
  const scoresLoaded = Boolean(ctx) && scoring.ready;
  const weekEnd = dayKeyFromToday(7);
  const unstaffed = (instances.data ?? []).filter(
    (i) =>
      i.routeId &&
      i.status === "unstaffed" &&
      i.date >= TODAY_KEY &&
      i.date < weekEnd,
  ).length;
  const loaded = Boolean(ctx);

  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setEntity("all");
    setCity("all");
    setServiceType("all");
  };

  const openNew = () => {
    setFormKey((k) => k + 1);
    setCreating(true);
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Routes" },
        ]}
        title="Routes"
        description="Standing route templates. Each dispatch day, an instance is generated from every active route that's due."
        actions={
          <Button
            size="sm"
            onClick={openNew}
            disabled={!ctx?.masters.shifts.length}
          >
            <Plus data-icon="inline-start" />
            New route
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Active routes"
          value={loaded ? formatCount(counts.get("active") ?? 0) : undefined}
          hint={
            loaded
              ? `${counts.get("suspended") ?? 0} suspended · ${counts.get("retired") ?? 0} retired`
              : undefined
          }
        />
        <KpiCard
          label="Draft routes"
          value={loaded ? formatCount(counts.get("draft") ?? 0) : undefined}
          hint="Not dispatched until activated"
        />
        <KpiCard
          label="Average route score"
          value={
            scoresLoaded
              ? avgScore === null
                ? "—"
                : `${avgScore} · ${GRADE_LABEL[gradeOf(avgScore)]}`
              : undefined
          }
          hint={scoresLoaded ? gradeHint : undefined}
        />
        <KpiCard
          label="Unstaffed instances"
          value={instances.data ? formatCount(unstaffed) : undefined}
          hint="Next 7 days"
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

            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                size="sm"
                aria-label="Filter by entity"
                value={entity}
                onChange={(e) =>
                  setEntity(e.target.value as EntityCode | "all")
                }
              >
                <NativeSelectOption value="all">
                  All entities
                </NativeSelectOption>
                {ctx?.masters.entities.map((e) => (
                  <NativeSelectOption key={e.code} value={e.code}>
                    {e.code}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                size="sm"
                aria-label="Filter by city"
                value={city}
                onChange={(e) => setCity(e.target.value as CityCode | "all")}
              >
                <NativeSelectOption value="all">All cities</NativeSelectOption>
                {ctx?.masters.cities.map((c) => (
                  <NativeSelectOption key={c.code} value={c.code}>
                    {c.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                size="sm"
                aria-label="Filter by service type"
                value={serviceType}
                onChange={(e) =>
                  setServiceType(e.target.value as ServiceTypeCode | "all")
                }
              >
                <NativeSelectOption value="all">
                  All service types
                </NativeSelectOption>
                {ctx?.masters.serviceTypes.map((s) => (
                  <NativeSelectOption key={s.code} value={s.code}>
                    {s.code} · {s.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <span className="relative flex w-64">
                <Search
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search code or name…"
                  aria-label="Search routes"
                  className="h-8 ps-9"
                />
              </span>
            </div>
          </div>

          {isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading routes"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : error || !ctx ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={RouteIcon}
              title="No routes yet"
              description="A route is the standing template every truck, driver and service line hangs off. Create the first one."
              action={
                <Button
                  size="sm"
                  onClick={openNew}
                  disabled={!ctx.masters.shifts.length}
                >
                  <Plus data-icon="inline-start" />
                  New route
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No routes match"
              description="Try a different search or clear the filters."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Entity / type</TableHead>
                  <TableHead>City / zone</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Primary driver & truck</TableHead>
                  <TableHead className="text-end">Lines</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead aria-sort={ARIA_SORT[scoreSort ?? "none"]}>
                    <button
                      type="button"
                      onClick={() =>
                        setScoreSort((d) =>
                          d === null ? "desc" : d === "desc" ? "asc" : null,
                        )
                      }
                      className="hover:text-foreground -ms-1 flex items-center gap-1 rounded px-1"
                      title="Sort by score"
                    >
                      Score
                      {scoreSort === "desc" ? (
                        <ArrowDown className="size-3.5" aria-hidden />
                      ) : scoreSort === "asc" ? (
                        <ArrowUp className="size-3.5" aria-hidden />
                      ) : (
                        <ArrowUpDown
                          className="size-3.5 opacity-50"
                          aria-hidden
                        />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(({ route, util, score, drivers, truck }) => {
                  const href = `/field-service/routes/${route.id}`;
                  const shift = ctx.masters.shifts.find(
                    (s) => s.id === route.shiftId,
                  );
                  return (
                    <TableRow
                      key={route.id}
                      className="cursor-pointer"
                      onClick={() => router.push(href)}
                    >
                      <TableCell className="max-w-56">
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="block font-mono text-xs font-medium hover:underline"
                        >
                          {route.code}
                        </Link>
                        <span className="text-muted-foreground block truncate text-xs">
                          {route.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <Badge variant="outline">{route.entity}</Badge>
                          <span className="font-mono text-xs">
                            {route.serviceType}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {ctx.masters.cities.find((c) => c.code === route.city)
                          ?.name ?? route.city}
                        <span className="text-muted-foreground block max-w-32 truncate text-xs">
                          {route.zone ?? "Whole city"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {scheduleLabel(route)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {shift?.name ?? route.shiftId}
                        <span className="text-muted-foreground block font-mono text-xs tabular-nums">
                          {route.startTime}–{route.endTime}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {drivers.length ? (
                          <span className="block max-w-40 truncate">
                            {drivers[0].name}
                            {drivers.length > 1 ? (
                              <span className="text-muted-foreground">
                                {" "}
                                +{drivers.length - 1}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="text-destructive block text-xs">
                            No primary driver
                          </span>
                        )}
                        {truck ? (
                          <span className="text-muted-foreground block font-mono text-xs">
                            {truck.plate}
                          </span>
                        ) : (
                          <span className="text-destructive block text-xs">
                            No primary truck
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-end font-mono text-sm tabular-nums">
                        {route.serviceLineIds.length}
                      </TableCell>
                      <TableCell>
                        <UtilisationBar pct={util.pct} />
                      </TableCell>
                      <TableCell>
                        <RouteScoreBadge score={score} />
                      </TableCell>
                      <TableCell>
                        <RouteStatusPill status={route.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {ctx ? (
        <RouteFormDialog
          key={formKey}
          open={creating}
          onOpenChange={setCreating}
          ctx={ctx}
        />
      ) : null}
    </>
  );
}
