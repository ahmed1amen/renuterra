"use client";

import { Search, SearchX, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
  isWorkingShift,
  useRouteInstances,
  useShifts,
  useTechnicians,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { RouteInstance, Technician } from "@/mocks";
import {
  LicenceBadge,
  needsRenewal,
  proRole,
  routeRoleOf,
  ShiftSummary,
  TechnicianIdentity,
  TechnicianStatusPill,
} from "../../components";
import { formatCount, TODAY, toDayKey } from "../../utils";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

type RoleFilter = "all" | "drivers" | "crew";

const FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "drivers", label: "Drivers" },
  { id: "crew", label: "Helpers & trainees" },
];

const matchesRole = (pro: Technician, filter: RoleFilter) =>
  filter === "all" ||
  (filter === "drivers" ? pro.role === "driver" : pro.role !== "driver");

export default function ServicePros() {
  const router = useRouter();
  const pros = useTechnicians();
  const shifts = useShifts();
  const routes = useRouteInstances();

  const [role, setRole] = useState<RoleFilter>("all");
  const [query, setQuery] = useState("");

  const today = toDayKey(TODAY);
  const all = useMemo(() => pros.data ?? [], [pros.data]);

  /** Today's route per pro — as primary or as crew. */
  const routeToday = useMemo(() => {
    const map = new Map<string, RouteInstance>();
    for (const route of routes.data ?? []) {
      if (route.date !== today) continue;
      if (route.primaryServiceProId) map.set(route.primaryServiceProId, route);
      for (const c of route.crew) map.set(c.serviceProId, route);
    }
    return map;
  }, [routes.data, today]);

  const counts = useMemo(
    () =>
      new Map<RoleFilter, number>(
        FILTERS.map((f) => [
          f.id,
          all.filter((p) => matchesRole(p, f.id)).length,
        ]),
      ),
    [all],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return all
      .filter((p) => matchesRole(p, role))
      .filter(
        (p) =>
          !term ||
          `${p.name} ${p.zone} ${p.phone} ${p.skills.join(" ")}`
            .toLowerCase()
            .includes(term),
      );
  }, [all, role, query]);

  const loaded = pros.isSuccess && shifts.isSuccess && routes.isSuccess;
  const onShift = all.filter((p) =>
    isWorkingShift(shifts.shiftOf(p.id, today)),
  ).length;
  const onLeave = all.filter(
    (p) => shifts.shiftOf(p.id, today)?.type === "leave",
  ).length;
  const renewals = all.filter(needsRenewal).length;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Service pros" },
        ]}
        title="Service pros"
        description="Drivers, helpers and trainees: today's shift, route and licence status."
        actions={
          <Button
            size="sm"
            onClick={() =>
              toast.info("New service pro", {
                description: "Prototype — onboarding isn't built yet.",
              })
            }
          >
            <UserPlus data-icon="inline-start" />
            New service pro
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="On shift today"
          value={loaded ? formatCount(onShift) : undefined}
          hint={loaded ? `of ${all.length} service pros` : undefined}
        />
        <KpiCard
          label="On routes today"
          value={loaded ? formatCount(routeToday.size) : undefined}
          hint="Primary or crew"
        />
        <KpiCard
          label="On leave today"
          value={loaded ? formatCount(onLeave) : undefined}
          hint="Not available for routes"
        />
        <KpiCard
          label="Licences to renew"
          value={loaded ? formatCount(renewals) : undefined}
          hint="Expired or expiring within 30 days"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((filter) => {
                const active = role === filter.id;
                return (
                  <li key={filter.id}>
                    <button
                      type="button"
                      onClick={() => setRole(filter.id)}
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

            <span className="relative flex w-64">
              <Search
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, zone, skill…"
                aria-label="Search service pros"
                className="h-8 ps-9"
              />
            </span>
          </div>

          {pros.isPending || shifts.isPending || routes.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading service pros"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : pros.isError || shifts.isError || routes.isError ? (
            <ErrorState
              error={pros.error ?? shifts.error ?? routes.error}
              onRetry={() => {
                pros.refetch();
                shifts.refetch();
                routes.refetch();
              }}
            />
          ) : all.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No service pros yet"
              description="Add the drivers and helpers who run your routes."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No service pros match"
              description="Try a different search or clear the filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setRole("all");
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
                  <TableHead>Service pro</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Today's shift</TableHead>
                  <TableHead>Today's route</TableHead>
                  <TableHead>Licence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((pro) => {
                  const route = routeToday.get(pro.id);
                  const href = `/field-service/service-pros/${pro.id}`;
                  return (
                    <TableRow
                      key={pro.id}
                      className="cursor-pointer"
                      onClick={() => router.push(href)}
                    >
                      <TableCell className="max-w-64">
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="block hover:underline"
                        >
                          <TechnicianIdentity technician={pro} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{proRole(pro)}</TableCell>
                      <TableCell>
                        <span className="flex max-w-56 flex-wrap gap-1">
                          {pro.skills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ShiftSummary shift={shifts.shiftOf(pro.id, today)} />
                      </TableCell>
                      <TableCell className="max-w-60 text-sm">
                        {route ? (
                          <>
                            <span className="block truncate">{route.name}</span>
                            <span className="text-muted-foreground block text-xs">
                              {routeRoleOf(route, pro.id)} ·{" "}
                              {route.appointmentIds.length}{" "}
                              {route.appointmentIds.length === 1
                                ? "stop"
                                : "stops"}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <LicenceBadge pro={pro} />
                      </TableCell>
                      <TableCell>
                        <TechnicianStatusPill status={pro.status} />
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
