"use client";

import { StreamTag } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ProjectedVisit, useDirectory } from "@/features/field-service";
import { dubaiDateTime, formatDate } from "../utils";
import { formatTimeWindow } from "./route-meta";

type Directory = ReturnType<typeof useDirectory>;

/** "Tue 8 Sep" for a Dubai day key (`2026-09-08`). */
export function formatDayKey(day: string) {
  return formatDate(dubaiDateTime(day, 12));
}

/** Site, service line and item behind a projected visit. */
export function describeProjection(visit: ProjectedVisit, dir: Directory) {
  const site = dir.servicePoint(visit.servicePointId);
  const line = site?.serviceLines.find((l) => l.id === visit.serviceLineId);
  const item = line ? dir.serviceItem(line.serviceItemId) : undefined;
  return {
    site,
    line,
    item,
    window: line ? formatTimeWindow(line.timeWindow) : "-",
  };
}

/** "Dispatched" once the day's instance exists, else "Scheduled by route". */
export function ProjectionBadge({ visit }: { visit: ProjectedVisit }) {
  return visit.instanceId ? (
    <Badge variant="info">Dispatched</Badge>
  ) : (
    <Badge variant="neutral">Scheduled by route</Badge>
  );
}

/**
 * Projected visits as muted, read-only rows: they aren't appointments yet,
 * so there's nothing to open. Mirrors `AppointmentsTable`'s columns.
 */
export function ProjectedVisitsTable({
  visits,
  showCustomer = true,
  showHeader = true,
}: {
  visits: ProjectedVisit[];
  showCustomer?: boolean;
  showHeader?: boolean;
}) {
  const directory = useDirectory();
  return (
    <Table>
      {showHeader ? (
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>{showCustomer ? "Customer" : "Service point"}</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
      ) : null}
      <TableBody>
        {visits.map((visit) => {
          const { site, item, window } = describeProjection(visit, directory);
          const customer = directory.customer(visit.customerId);
          return (
            <TableRow
              key={`${visit.date}-${visit.serviceLineId}`}
              className="text-muted-foreground hover:bg-transparent"
            >
              <TableCell className="whitespace-nowrap">
                <span className="block text-sm">
                  {formatDayKey(visit.date)}
                </span>
                <span className="block font-mono text-xs tabular-nums">
                  {window}
                </span>
              </TableCell>
              <TableCell className="max-w-64">
                {showCustomer ? (
                  <span className="block truncate text-sm">
                    {customer?.name ?? "-"}
                  </span>
                ) : null}
                <span
                  className={
                    showCustomer
                      ? "block truncate text-xs"
                      : "block truncate text-sm"
                  }
                >
                  {site?.location ?? "-"}
                  {site ? ` · ${site.area}` : ""}
                </span>
              </TableCell>
              <TableCell className="max-w-56">
                {item ? <StreamTag stream={item.stream} /> : null}
                <span className="mt-1 block truncate text-xs">
                  {item?.name ?? "-"}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {visit.routeCode}
              </TableCell>
              <TableCell>
                <span className="text-xs italic">Not dispatched yet</span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
