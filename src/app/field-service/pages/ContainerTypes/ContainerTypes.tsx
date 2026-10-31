"use client";

import { Container, PackagePlus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusPill,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCatalogItems,
  useContainers,
  useContainerTypes,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import { CONTAINER_KIND, VEHICLE_CLASS } from "../../components";
import { formatCount } from "../../utils";
import { ContainerTypeDialog } from "./components/container-type-dialog";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

type TrackedFilter = "all" | "tagged" | "consumable";

const FILTERS: { id: TrackedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tagged", label: "Tagged assets" },
  { id: "consumable", label: "Consumables" },
];

const litres = new Intl.NumberFormat("en-US");
const cbm = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

type InUse = { onSite: number; inDepot: number; total: number };

export default function ContainerTypes() {
  const types = useContainerTypes();
  const containers = useContainers();
  const items = useCatalogItems();

  const [filter, setFilter] = useState<TrackedFilter>("all");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialog, setDialog] = useState({ open: false, key: 0 });
  const openDialog = () => setDialog((d) => ({ open: true, key: d.key + 1 }));

  /** Containers per type, and how many service items point at each type. */
  const usage = useMemo(() => {
    const inUse = new Map<string, InUse>();
    for (const c of containers.data ?? []) {
      const u = inUse.get(c.containerTypeId) ?? {
        onSite: 0,
        inDepot: 0,
        total: 0,
      };
      u.total += 1;
      if (c.location === "on-site") u.onSite += 1;
      if (c.location === "in-depot") u.inDepot += 1;
      inUse.set(c.containerTypeId, u);
    }
    const itemCount = new Map<string, number>();
    for (const i of items.data ?? []) {
      if (!i.containerTypeId) continue;
      itemCount.set(
        i.containerTypeId,
        (itemCount.get(i.containerTypeId) ?? 0) + 1,
      );
    }
    return { inUse, itemCount };
  }, [containers.data, items.data]);

  const all = useMemo(() => types.data ?? [], [types.data]);
  const inScope = useMemo(
    () => all.filter((t) => showArchived || t.active),
    [all, showArchived],
  );

  const counts = useMemo(
    () =>
      new Map<TrackedFilter, number>([
        ["all", inScope.length],
        ["tagged", inScope.filter((t) => t.tracked).length],
        ["consumable", inScope.filter((t) => !t.tracked).length],
      ]),
    [inScope],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return inScope
      .filter(
        (t) =>
          filter === "all" || (filter === "tagged" ? t.tracked : !t.tracked),
      )
      .filter(
        (t) =>
          !term ||
          `${t.name} ${CONTAINER_KIND[t.kind]}`.toLowerCase().includes(term),
      );
  }, [inScope, filter, query]);

  const archivedCount = all.filter((t) => !t.active).length;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Settings" },
          { label: "Container types" },
        ]}
        title="Container types"
        description="Kinds and sizes of container that service items use, and how many are out in the field."
        actions={
          <Button size="sm" onClick={openDialog}>
            <PackagePlus data-icon="inline-start" />
            New container type
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => {
                const active = filter === f.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => setFilter(f.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {f.label}
                      <span className="font-mono text-[11px] tabular-nums opacity-70">
                        {counts.get(f.id) ?? 0}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2">
                <Switch
                  id="show-archived-types"
                  size="sm"
                  checked={showArchived}
                  onCheckedChange={setShowArchived}
                />
                <Label
                  htmlFor="show-archived-types"
                  className="text-muted-foreground font-normal"
                >
                  Show archived
                  {types.isSuccess ? (
                    <span className="font-mono text-[11px] tabular-nums">
                      {archivedCount}
                    </span>
                  ) : null}
                </Label>
              </span>
              <span className="relative flex w-64">
                <Search
                  className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or kind…"
                  aria-label="Search container types"
                  size="sm"
                  className="ps-9"
                />
              </span>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Tagged containers (bins, skips, ROROs, compactors, tanks) are
            tracked per service point. Bags, sharps boxes and drums are
            consumables: the service pro counts them on each work order.
          </p>

          {types.isPending || containers.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading container types"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : types.isError || containers.isError ? (
            <ErrorState
              error={types.error ?? containers.error}
              onRetry={() => {
                types.refetch();
                containers.refetch();
              }}
            />
          ) : all.length === 0 ? (
            <EmptyState
              icon={Container}
              title="No container types yet"
              description="Add the bins, skips and consumables your service items use."
              action={
                <Button size="sm" onClick={openDialog}>
                  <PackagePlus data-icon="inline-start" />
                  New container type
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No container types match"
              description="Try a different search or clear the filters."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
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
                  <TableHead>Container type</TableHead>
                  <TableHead className="text-right">Capacity</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Tracked</TableHead>
                  <TableHead>In use</TableHead>
                  <TableHead className="text-right">Service items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((type) => {
                  const inUse = usage.inUse.get(type.id);
                  const itemCount = usage.itemCount.get(type.id) ?? 0;
                  return (
                    <TableRow
                      key={type.id}
                      className={cn(!type.active && "text-muted-foreground")}
                    >
                      <TableCell className="text-sm">
                        <span className="block font-medium">{type.name}</span>
                        <span className="text-muted-foreground block text-xs">
                          {CONTAINER_KIND[type.kind]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {type.capacityLitres >= 1000 ? (
                          <>
                            <span className="block">
                              {cbm.format(type.capacityLitres / 1000)} CBM
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {litres.format(type.capacityLitres)} L
                            </span>
                          </>
                        ) : (
                          `${litres.format(type.capacityLitres)} L`
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {VEHICLE_CLASS[type.vehicleClass]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {type.tracked ? (
                          "Tagged asset"
                        ) : (
                          <span className="text-muted-foreground">
                            Consumable, counted per work order
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {!type.tracked ? (
                          <span className="text-muted-foreground">-</span>
                        ) : inUse ? (
                          <>
                            <span className="block font-mono tabular-nums">
                              {formatCount(inUse.total)}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {inUse.onSite} on site · {inUse.inDepot} in depot
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            None yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {itemCount}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={type.active ? "success" : "neutral"}
                          dot
                        >
                          {type.active ? "Active" : "Archived"}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContainerTypeDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
