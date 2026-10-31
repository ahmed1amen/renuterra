"use client";

import { ListPlus, PackageOpen, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusPill,
  StreamTag,
  WASTE_STREAMS,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
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
import { useCatalogItems, useContainerTypes } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { HandlingMethod, ServiceItem, WasteStreamId } from "@/mocks";
import {
  HANDLING_METHOD,
  HANDLING_METHOD_ORDER,
  unitLabel,
  VEHICLE_CLASS,
  WEIGHT_SOURCE,
} from "../../components";
import { formatKg } from "../../utils";
import { ServiceItemDialog } from "./components/service-item-dialog";

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const STREAM_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All streams" },
  ...WASTE_STREAMS.map((s) => ({ value: s.id, label: s.label })),
];

type MethodFilter = HandlingMethod | "all";

export default function ServiceItems() {
  const items = useCatalogItems();
  const containerTypes = useContainerTypes();
  const typeName = useMemo(
    () => new Map((containerTypes.data ?? []).map((t) => [t.id, t.name])),
    [containerTypes.data],
  );

  const [method, setMethod] = useState<MethodFilter>("all");
  const [stream, setStream] = useState<WasteStreamId | "all">("all");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // `key` bumps on every open so the form starts fresh each time.
  const [dialog, setDialog] = useState<{
    open: boolean;
    item: ServiceItem | null;
    key: number;
  }>({ open: false, item: null, key: 0 });
  const openDialog = (item: ServiceItem | null) =>
    setDialog((d) => ({ open: true, item, key: d.key + 1 }));

  const all = useMemo(() => items.data ?? [], [items.data]);
  const inScope = useMemo(
    () => all.filter((i) => showArchived || i.active),
    [all, showArchived],
  );

  const counts = useMemo(() => {
    const map = new Map<MethodFilter, number>([["all", inScope.length]]);
    for (const i of inScope) map.set(i.method, (map.get(i.method) ?? 0) + 1);
    return map;
  }, [inScope]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return inScope
      .filter((i) => method === "all" || i.method === method)
      .filter((i) => stream === "all" || i.stream === stream)
      .filter(
        (i) => !term || `${i.code} ${i.name}`.toLowerCase().includes(term),
      );
  }, [inScope, method, stream, query]);

  const archivedCount = all.length - all.filter((i) => i.active).length;

  function clearFilters() {
    setMethod("all");
    setStream("all");
    setQuery("");
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Settings" },
          { label: "Service items" },
        ]}
        title="Service items"
        description="The service catalogue: what contract lines sell and work orders perform, how each is handled, counted and weighed."
        actions={
          <Button size="sm" onClick={() => openDialog(null)}>
            <ListPlus data-icon="inline-start" />
            New service item
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <ul className="flex flex-wrap items-center gap-1.5">
            {(["all", ...HANDLING_METHOD_ORDER] as MethodFilter[]).map((id) => {
              const active = method === id;
              const Icon = id === "all" ? null : HANDLING_METHOD[id].icon;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setMethod(id)}
                    aria-pressed={active}
                    title={
                      id === "all" ? undefined : HANDLING_METHOD[id].description
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground",
                    )}
                  >
                    {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                    {id === "all" ? "All" : HANDLING_METHOD[id].label}
                    <span className="font-mono text-[11px] tabular-nums opacity-70">
                      {counts.get(id) ?? 0}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            <Combobox
              size="sm"
              className="w-40"
              aria-label="Filter by stream"
              options={STREAM_OPTIONS}
              value={stream}
              onValueChange={(v) => setStream(v as WasteStreamId | "all")}
            />
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
                aria-label="Search service items"
                size="sm"
                className="ps-9"
              />
            </span>
            <span className="ms-auto flex items-center gap-2">
              <Switch
                id="show-archived"
                size="sm"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label
                htmlFor="show-archived"
                className="text-muted-foreground font-normal"
              >
                Show archived
                {items.isSuccess ? (
                  <span className="font-mono text-[11px] tabular-nums">
                    {archivedCount}
                  </span>
                ) : null}
              </Label>
            </span>
          </div>

          {items.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading service items"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : items.isError ? (
            <ErrorState error={items.error} onRetry={() => items.refetch()} />
          ) : all.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No service items yet"
              description="Add the services Renuterra sells so contract lines and work orders can point at them."
              action={
                <Button size="sm" onClick={() => openDialog(null)}>
                  <ListPlus data-icon="inline-start" />
                  New service item
                </Button>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No service items match"
              description={
                showArchived
                  ? "Try a different search or clear the filters."
                  : "Try a different search, clear the filters or show archived items."
              }
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
                  <TableHead>Service item</TableHead>
                  <TableHead>Handling method</TableHead>
                  <TableHead>Counted in</TableHead>
                  <TableHead>Weight from</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => {
                  const m = HANDLING_METHOD[item.method];
                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "cursor-pointer",
                        !item.active && "text-muted-foreground",
                      )}
                      onClick={() => openDialog(item)}
                    >
                      <TableCell className="max-w-72">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(item);
                          }}
                          className="block font-mono text-xs font-medium hover:underline"
                        >
                          {item.code}
                        </button>
                        <span className="block truncate text-sm">
                          {item.name}
                        </span>
                        <StreamTag stream={item.stream} className="mt-1" />
                      </TableCell>
                      <TableCell>
                        <span
                          className="flex items-center gap-1.5 text-sm"
                          title={m.description}
                        >
                          <m.icon
                            className="text-muted-foreground size-4 shrink-0"
                            aria-hidden
                          />
                          {m.label}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {VEHICLE_CLASS[item.vehicleClass]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {unitLabel(item.countUnit)}
                        {item.estKgPerUnit ? (
                          <span className="text-muted-foreground font-mono text-xs tabular-nums">
                            {" "}
                            · {formatKg(item.estKgPerUnit)} each
                          </span>
                        ) : null}
                        <span className="text-muted-foreground block text-xs">
                          {item.containerTypeId
                            ? (typeName.get(item.containerTypeId) ??
                              item.containerTypeId)
                            : "No container"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.weightSource ? (
                          <span
                            title={WEIGHT_SOURCE[item.weightSource].description}
                          >
                            {WEIGHT_SOURCE[item.weightSource].label}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {item.requiresSeals ? (
                            <Badge variant="outline">Seals</Badge>
                          ) : null}
                          {item.requiresConsignmentNote ? (
                            <Badge variant="outline">Consignment note</Badge>
                          ) : null}
                          {!item.requiresSeals &&
                          !item.requiresConsignmentNote ? (
                            <span className="text-muted-foreground text-sm">
                              -
                            </span>
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={item.active ? "success" : "neutral"}
                          dot
                        >
                          {item.active ? "Active" : "Archived"}
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

      <ServiceItemDialog
        key={dialog.key}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        item={dialog.item}
      />
    </>
  );
}
