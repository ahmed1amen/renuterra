"use client";

import { CalendarPlus, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState, StatusPill, StreamTag } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ProjectedVisit,
  useContainers,
  useDirectory,
  useRoutes,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { ServicePoint, WasteStreamId } from "@/mocks";
import { useBookAppointmentModal } from "@/stores/book-appointment-modal";
import {
  CONTAINER_LOCATION,
  FREQUENCY_LABEL,
  formatCountUnit,
  formatDayKey,
  formatTimeWindow,
  HANDLING_METHOD,
  ServicePointMap,
} from "../../../components";
import { formatDate } from "../../../utils";

const DAY_LABEL: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** Sites on the left, the selected site's containers and services on the right. */
export function ServicePointsTab({
  servicePoints,
  projected,
  bookable,
}: {
  servicePoints: ServicePoint[];
  /** The customer's projected visits, soonest first. */
  projected: ProjectedVisit[];
  /** False when the customer is on hold — booking is hidden. */
  bookable: boolean;
}) {
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  const directory = useDirectory();
  const routes = useRoutes();
  /** The active Route a service line is attached to (each line has one). */
  const routeOf = (lineId: string) =>
    routes.data?.find(
      (r) => r.status !== "retired" && r.serviceLineIds.includes(lineId),
    );
  /** Next projected visit per service line. */
  const nextOf = (lineId: string) =>
    projected.find((v) => v.serviceLineId === lineId);
  const containers = useContainers();
  const [selectedId, setSelectedId] = useState(servicePoints[0]?.id ?? null);
  const selected = servicePoints.find((sp) => sp.id === selectedId);
  const containersOnSite = (containers.data ?? []).filter(
    (c) => c.servicePointId === selectedId,
  );
  const streamsAt = (sp: ServicePoint) => [
    ...new Set(
      sp.serviceLines.flatMap((l): WasteStreamId[] => {
        const stream = directory.serviceItem(l.serviceItemId)?.stream;
        return stream ? [stream] : [];
      }),
    ),
  ];

  if (!servicePoints.length) {
    return (
      <EmptyState
        icon={MapPin}
        title="No service points yet"
        description="Service points are created when a contract is signed."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <ul className="space-y-2" aria-label="Service points">
        {servicePoints.map((sp) => {
          const active = sp.id === selectedId;
          const streams = streamsAt(sp);
          return (
            <li key={sp.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(sp.id)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-accent/60"
                    : "border-border bg-card hover:bg-muted/60",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {sp.location}
                    </span>
                    <span className="text-muted-foreground block text-xs">
                      {sp.area}, {sp.emirate}
                    </span>
                  </span>
                  {sp.status === "inactive" ? (
                    <StatusPill tone="neutral">Inactive</StatusPill>
                  ) : null}
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  {streams.map((s) => (
                    <StreamTag key={s} stream={s} />
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{selected.name}</CardTitle>
              <CardDescription className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  {selected.address}
                  <span className="ml-2 font-mono text-xs">
                    {selected.number}
                  </span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ServicePointMap
                points={servicePoints}
                selectedId={selected.id}
                onSelect={setSelectedId}
                className="h-56"
              />
              {selected.accessNotes ? (
                <div className="bg-muted rounded-md p-3 text-sm">
                  <p className="text-muted-foreground mb-0.5 text-xs font-medium">
                    Access notes
                  </p>
                  {selected.accessNotes}
                </div>
              ) : null}
              {selected.attributes.length ? (
                <div className="flex flex-wrap gap-1">
                  {selected.attributes.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>
                Contracted collections — recurring visits are generated from
                these.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected.serviceLines.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service item</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.serviceLines.map((line) => {
                      const item = directory.serviceItem(line.serviceItemId);
                      const next = nextOf(line.id);
                      return (
                        <TableRow key={line.id}>
                          <TableCell className="text-sm">
                            {item?.name ?? line.serviceItemId}
                            <span className="text-muted-foreground block text-xs">
                              <span className="font-mono">{item?.code}</span>
                              {item
                                ? ` · ${formatCountUnit(line.quantity, item.countUnit)} per visit · ${HANDLING_METHOD[item.method].label}`
                                : null}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item ? <StreamTag stream={item.stream} /> : null}
                          </TableCell>
                          <TableCell className="text-sm">
                            {FREQUENCY_LABEL[line.frequency]}
                            {line.frequency === "weekly" ? (
                              <span className="text-muted-foreground block text-xs">
                                {line.days.map((d) => DAY_LABEL[d]).join(", ")}
                              </span>
                            ) : null}
                            {next ? (
                              <span className="text-muted-foreground block text-xs">
                                Next: {formatDayKey(next.date)}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatTimeWindow(line.timeWindow)}
                            <span className="text-muted-foreground block text-xs">
                              {line.entity}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {routeOf(line.id) ? (
                              <Link
                                href={`/field-service/routes/${routeOf(line.id)?.id}`}
                                className="font-mono text-xs hover:underline"
                              >
                                {routeOf(line.id)?.code}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Not on a route
                              </span>
                            )}
                            {line.contractStatus !== "active" ? (
                              <Badge
                                variant="warning"
                                className="mt-1 block w-fit"
                              >
                                Contract {line.contractStatus.replace("-", " ")}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right">
                            {bookable && selected.status === "active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openBooking({
                                    customerId: selected.customerId,
                                    servicePointId: selected.id,
                                    serviceLineId: line.id,
                                  })
                                }
                              >
                                <CalendarPlus data-icon="inline-start" />
                                Book
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No active services at this site.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Containers on site</CardTitle>
              <CardDescription>
                Tagged containers placed here. Bags, sharps boxes and drums are
                counted on each work order instead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {containersOnSite.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Stream</TableHead>
                      <TableHead>Owned by</TableHead>
                      <TableHead>Where</TableHead>
                      <TableHead>Last serviced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {containersOnSite.map((c) => {
                      const location = CONTAINER_LOCATION[c.location];
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">
                            {c.tag}
                          </TableCell>
                          <TableCell className="text-sm">
                            {directory.containerType(c.containerTypeId)?.name}
                          </TableCell>
                          <TableCell>
                            <StreamTag stream={c.stream} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {c.ownership === "renuterra"
                              ? "Renuterra (rental)"
                              : "Customer"}
                          </TableCell>
                          <TableCell>
                            <StatusPill tone={location.tone} dot>
                              {location.label}
                            </StatusPill>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {c.lastServicedAt
                              ? formatDate(c.lastServicedAt)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No tagged containers at this site.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
