"use client";

import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EmptyState, StreamTag, WASTE_STREAMS } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDirectory } from "@/features/field-service";
import type {
  Appointment,
  HandlingMethod,
  WasteStreamId,
  WorkOrder,
  WorkOrderStatus,
} from "@/mocks";
import {
  formatCountUnit,
  HANDLING_METHOD,
  HANDLING_METHOD_ORDER,
  WEIGHT_SOURCE,
  WORK_ORDER_STATUS,
  WORK_ORDER_STATUS_ORDER,
  WorkOrderStatusPill,
} from "../../../components";
import { formatDate, formatKg } from "../../../utils";

const PAGE_SIZE = 25;

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All statuses" },
  ...WORK_ORDER_STATUS_ORDER.map((s) => ({
    value: s,
    label: WORK_ORDER_STATUS[s].label,
  })),
];

const METHOD_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All methods" },
  ...HANDLING_METHOD_ORDER.map((m) => ({
    value: m,
    label: HANDLING_METHOD[m].label,
  })),
];

const STREAM_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All streams" },
  ...WASTE_STREAMS.map((s) => ({ value: s.id, label: s.label })),
];

/**
 * Every work order across the given appointments: what was planned, done and
 * weighed. Rows open the appointment the work order belongs to.
 */
export function WorkOrdersList({
  appointments,
}: {
  /** Already narrowed to the selected period, in display order. */
  appointments: Appointment[];
}) {
  const router = useRouter();
  const directory = useDirectory();
  const [status, setStatus] = useState<WorkOrderStatus | "all">("all");
  const [method, setMethod] = useState<HandlingMethod | "all">("all");
  const [stream, setStream] = useState<WasteStreamId | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return appointments
      .flatMap((apt) => apt.workOrders.map((wo) => ({ wo, apt })))
      .filter(({ wo }) => status === "all" || wo.status === status)
      .filter(({ wo }) => method === "all" || wo.method === method)
      .filter(({ wo }) => stream === "all" || wo.stream === stream)
      .filter(({ wo, apt }) => {
        if (!term) return true;
        const customer = directory.customer(apt.customerId)?.name ?? "";
        return `${wo.ref} ${wo.itemCode} ${wo.itemName} ${apt.ref} ${customer}`
          .toLowerCase()
          .includes(term);
      });
  }, [appointments, status, method, stream, query, directory]);

  const totals = useMemo(
    () => ({
      kg: rows.reduce((sum, { wo }) => sum + (wo.weightKg ?? 0), 0),
      shortfall: rows.filter(
        ({ wo }) => wo.status === "partial" || wo.status === "not-done",
      ).length,
    }),
    [rows],
  );

  const filtered =
    status !== "all" || method !== "all" || stream !== "all" || query !== "";
  const clearFilters = () => {
    setStatus("all");
    setMethod("all");
    setStream("all");
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">{rows.length}</span>{" "}
          work orders ·{" "}
          <span className="text-foreground font-mono tabular-nums">
            {formatKg(totals.kg)}
          </span>{" "}
          recorded ·{" "}
          <span className="text-foreground font-medium">
            {totals.shortfall}
          </span>{" "}
          partial or not done
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Combobox
            size="sm"
            className="w-40"
            aria-label="Filter by work order status"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(v) => setStatus(v as WorkOrderStatus | "all")}
          />
          <Combobox
            size="sm"
            className="w-44"
            aria-label="Filter by handling method"
            options={METHOD_OPTIONS}
            value={method}
            onValueChange={(v) => setMethod(v as HandlingMethod | "all")}
          />
          <Combobox
            size="sm"
            className="w-40"
            aria-label="Filter by waste stream"
            options={STREAM_OPTIONS}
            value={stream}
            onValueChange={(v) => setStream(v as WasteStreamId | "all")}
          />
          <span className="relative flex w-56">
            <Search
              className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search work orders…"
              aria-label="Search work orders"
              size="sm"
              className="ps-9"
            />
          </span>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={filtered ? "No work orders match" : "No work orders here"}
          description={
            filtered
              ? "Try a different search or clear the filters."
              : "Work orders appear once a visit is booked."
          }
          action={
            filtered ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work order</TableHead>
                <TableHead>Service item</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Done / planned</TableHead>
                <TableHead className="text-right">Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, limit).map(({ wo, apt }) => (
                <WorkOrderTableRow
                  key={wo.id}
                  wo={wo}
                  apt={apt}
                  customer={directory.customer(apt.customerId)?.name}
                  location={
                    directory.servicePoint(apt.servicePointId)?.location
                  }
                  onOpen={() =>
                    router.push(`/field-service/appointments/${apt.id}`)
                  }
                />
              ))}
            </TableBody>
          </Table>
          {rows.length > limit ? (
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <p className="text-muted-foreground text-xs">
                Showing {limit} of {rows.length}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((n) => n + PAGE_SIZE)}
              >
                Show more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function WorkOrderTableRow({
  wo,
  apt,
  customer,
  location,
  onOpen,
}: {
  wo: WorkOrder;
  apt: Appointment;
  customer?: string;
  location?: string;
  onOpen: () => void;
}) {
  const method = HANDLING_METHOD[wo.method];
  const MethodIcon = method.icon;
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="whitespace-nowrap">
        <span className="block font-mono text-xs font-medium">{wo.ref}</span>
        <span className="text-muted-foreground block text-xs">
          <Link
            href={`/field-service/appointments/${apt.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono hover:underline"
          >
            {apt.ref}
          </Link>{" "}
          · {formatDate(apt.windowStart)}
        </span>
      </TableCell>
      <TableCell className="max-w-64">
        <span className="block truncate text-sm" title={wo.itemCode}>
          {wo.itemName}
        </span>
        <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
          <MethodIcon className="size-3.5" aria-hidden />
          {method.label}
          <StreamTag stream={wo.stream} />
        </span>
      </TableCell>
      <TableCell className="max-w-48">
        <span className="block truncate text-sm font-medium">
          {customer ?? "-"}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {location}
        </span>
      </TableCell>
      <TableCell>
        <WorkOrderStatusPill status={wo.status} />
      </TableCell>
      <TableCell className="text-right font-mono text-sm whitespace-nowrap tabular-nums">
        {wo.countDone ?? "-"} / {formatCountUnit(wo.countPlanned, wo.countUnit)}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <span className="block font-mono text-sm tabular-nums">
          {wo.weightKg === null
            ? `est. ${wo.weightEstKg ? formatKg(wo.weightEstKg) : "-"}`
            : formatKg(wo.weightKg)}
        </span>
        {wo.weightSource ? (
          <span className="text-muted-foreground block text-xs">
            {WEIGHT_SOURCE[wo.weightSource].label}
          </span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
