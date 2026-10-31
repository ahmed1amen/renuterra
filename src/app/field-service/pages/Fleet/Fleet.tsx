"use client";

import { Search, SearchX, Truck } from "lucide-react";
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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
  useFleetStore,
  useOpsMasters,
  useRouteAssignments,
  useRouteInstances,
  useRoutes,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type { VehicleStatus } from "@/mocks";
import { InstanceStatusPill, VEHICLE_CLASS } from "../../components";
import { formatCount, TODAY, toDayKey } from "../../utils";
import {
  assignmentRole,
  capacityLines,
  ExpiryLine,
  expiresSoon,
  type FleetRow,
  VEHICLE_STATUS,
  VehicleSheet,
  VehicleStatusPill,
} from "./components";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
/** Entity filter value for trucks registered to no entity. */
const POOL = "pool";

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All statuses" },
  ...(Object.keys(VEHICLE_STATUS) as VehicleStatus[]).map((s) => ({
    value: s,
    label: VEHICLE_STATUS[s].label,
  })),
];

export default function Fleet() {
  const vehicles = useVehicles();
  const masters = useOpsMasters();
  const routes = useRoutes();
  const assignments = useRouteAssignments();
  const instances = useRouteInstances();
  const pros = useTechnicians();
  const overrides = useFleetStore((s) => s.statusOverrides);

  const [query, setQuery] = useState("");
  const [truckType, setTruckType] = useState("all");
  const [entity, setEntity] = useState("all");
  const [status, setStatus] = useState<"all" | VehicleStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const today = toDayKey(TODAY);

  /** Every truck joined to its type, entity, assignments and today's run. */
  const rows = useMemo<FleetRow[]>(() => {
    const types = new Map(masters.data?.truckTypes.map((t) => [t.id, t]));
    const entities = new Map(masters.data?.entities.map((e) => [e.code, e]));
    const routeById = new Map(routes.data?.map((r) => [r.id, r]));
    const proName = new Map(pros.data?.map((p) => [p.id, p.name]));
    return (vehicles.data ?? []).map((v) => {
      const vehicle = overrides[v.id] ? { ...v, status: overrides[v.id] } : v;
      const todayRun = instances.data?.find(
        (i) => i.date === today && i.vehicleId === v.id,
      );
      return {
        vehicle,
        truckType: types.get(v.truckTypeId),
        entityName: v.entity
          ? (entities.get(v.entity)?.name ?? v.entity)
          : null,
        assignments: (assignments.data ?? [])
          .filter((a) => a.assetType === "truck" && a.assetId === v.id)
          .sort((a, b) => a.rank - b.rank)
          .map((a) => ({ ...a, route: routeById.get(a.routeId) })),
        today: todayRun,
        todayDriver: todayRun?.primaryServiceProId
          ? (proName.get(todayRun.primaryServiceProId) ?? null)
          : null,
      };
    });
  }, [
    vehicles.data,
    masters.data,
    routes.data,
    assignments.data,
    instances.data,
    pros.data,
    overrides,
    today,
  ]);

  const truckTypeOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "all", label: "All truck types" },
      ...(masters.data?.truckTypes ?? []).map((t) => ({
        value: t.id,
        label: t.name,
        description: t.id,
      })),
    ],
    [masters.data],
  );

  const entityOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "all", label: "All entities" },
      ...(masters.data?.entities ?? []).map((e) => ({
        value: e.code,
        label: e.code,
        description: e.name,
      })),
      { value: POOL, label: "Shared pool" },
    ],
    [masters.data],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase().replace(/\s+/g, "");
    return rows.filter(({ vehicle: v }) => {
      if (truckType !== "all" && v.truckTypeId !== truckType) return false;
      if (entity === POOL && v.entity !== null) return false;
      if (entity !== "all" && entity !== POOL && v.entity !== entity)
        return false;
      if (status !== "all" && v.status !== status) return false;
      return !term || v.plate.toLowerCase().replace(/\s+/g, "").includes(term);
    });
  }, [rows, query, truckType, entity, status]);

  const open = rows.find((r) => r.vehicle.id === openId) ?? null;
  const filtered =
    query !== "" || truckType !== "all" || entity !== "all" || status !== "all";
  const clearFilters = () => {
    setQuery("");
    setTruckType("all");
    setEntity("all");
    setStatus("all");
  };

  const queries = [vehicles, masters, routes, assignments, instances, pros];
  const pending = queries.some((q) => q.isPending);
  const failed = queries.find((q) => q.isError);
  const loaded = !pending && !failed;

  const count = (fn: (r: FleetRow) => boolean) =>
    loaded ? formatCount(rows.filter(fn).length) : undefined;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Fleet" },
        ]}
        title="Fleet"
        description="Every truck: type, entity, permits, paperwork and the routes it runs."
        actions={
          <Button
            size="sm"
            onClick={() =>
              toast.info("Add truck", {
                description: "Prototype — trucks come from the fleet master.",
              })
            }
          >
            <Truck data-icon="inline-start" />
            Add truck
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="In service"
          value={count((r) => r.vehicle.status === "in-service")}
          hint={loaded ? `of ${rows.length} trucks` : undefined}
        />
        <KpiCard
          label="In workshop"
          value={count((r) => r.vehicle.status === "maintenance")}
          hint="Not offered to Dispatch"
        />
        <KpiCard
          label="Expiring in 30 days"
          value={count((r) => expiresSoon(r.vehicle))}
          hint="Registration or insurance"
        />
        <KpiCard
          label="Pool trucks"
          value={count((r) => r.vehicle.entity === null)}
          hint="Usable by any entity"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative flex w-56">
              <Search
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plate…"
                aria-label="Search by plate"
                size="sm"
                className="ps-9"
              />
            </span>
            <Combobox
              size="sm"
              options={truckTypeOptions}
              value={truckType}
              onValueChange={setTruckType}
              aria-label="Truck type"
              className="w-48"
            />
            <Combobox
              size="sm"
              options={entityOptions}
              value={entity}
              onValueChange={setEntity}
              aria-label="Entity"
              className="w-44"
            />
            <Combobox
              size="sm"
              options={STATUS_OPTIONS}
              value={status}
              onValueChange={(v) => setStatus(v as typeof status)}
              aria-label="Status"
              className="w-40"
            />
            {filtered ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            ) : null}
            {loaded ? (
              <span className="text-muted-foreground ms-auto text-sm tabular-nums">
                {visible.length} of {rows.length} trucks
              </span>
            ) : null}
          </div>

          {pending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading fleet"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : failed ? (
            <ErrorState
              error={failed.error}
              onRetry={() => {
                for (const q of queries) q.refetch();
              }}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No trucks in the fleet yet"
              description="Trucks added to the fleet master show up here with their permits and routes."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No trucks match"
              description="Try a different plate or clear the filters."
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
                  <TableHead>Plate</TableHead>
                  <TableHead>Truck type · class</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Permits</TableHead>
                  <TableHead>Registration · insurance</TableHead>
                  <TableHead>Status · today</TableHead>
                  <TableHead>Routes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => {
                  const { vehicle: v, truckType: type } = row;
                  const capacity = capacityLines(v, type);
                  return (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => setOpenId(v.id)}
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(v.id);
                          }}
                          className="font-mono text-[13px] font-medium whitespace-nowrap hover:underline"
                        >
                          {v.plate}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="block whitespace-nowrap">
                          {type?.name ?? "—"}
                        </span>
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          <span className="font-mono">{v.truckTypeId}</span> ·{" "}
                          {VEHICLE_CLASS[v.vehicleClass]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.entity ? (
                          <span className="font-mono">{v.entity}</span>
                        ) : (
                          <Badge variant="outline">Pool</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap tabular-nums">
                        {capacity.payload}
                        {capacity.extra ? (
                          <span className="text-muted-foreground block text-xs">
                            {capacity.extra}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {v.permits.map((city) => (
                            <Badge
                              key={city}
                              variant="outline"
                              className="font-mono"
                            >
                              {city}
                            </Badge>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-col gap-1">
                          <ExpiryLine label="Reg" date={v.registrationExpiry} />
                          <ExpiryLine label="Ins" date={v.insuranceExpiry} />
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-col items-start gap-1">
                          <VehicleStatusPill status={v.status} />
                          {row.today ? (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs whitespace-nowrap">
                              Today
                              <InstanceStatusPill status={row.today.status} />
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Not out today
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-64 text-xs">
                        {row.assignments.length ? (
                          <span className="flex flex-col gap-0.5">
                            {row.assignments.map((a) => (
                              <span key={a.id} className="whitespace-nowrap">
                                <span className="text-muted-foreground">
                                  {assignmentRole(a)}
                                </span>{" "}
                                <span className="font-mono">
                                  {a.route?.code ?? a.routeId}
                                </span>
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VehicleSheet
        row={open}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
      />
    </>
  );
}
