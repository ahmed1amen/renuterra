"use client";

import { CalendarPlus, MapPin } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { ServicePoint } from "@/mocks";
import { useBookAppointmentModal } from "@/stores/book-appointment-modal";
import {
  CONTAINER_TYPE,
  FREQUENCY_LABEL,
  ServicePointMap,
  WINDOW_LABEL,
} from "../../../components";

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
  bookable,
}: {
  servicePoints: ServicePoint[];
  /** False when the customer is on hold — booking is hidden. */
  bookable: boolean;
}) {
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  const [selectedId, setSelectedId] = useState(servicePoints[0]?.id ?? null);
  const selected = servicePoints.find((sp) => sp.id === selectedId);

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
          const streams = [...new Set(sp.containers.map((c) => c.stream))];
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
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.serviceLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-mono text-xs">
                          {line.serviceItem}
                          <span className="text-muted-foreground block font-sans">
                            {line.quantity} {line.uom} per visit
                          </span>
                        </TableCell>
                        <TableCell>
                          <StreamTag stream={line.stream} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {FREQUENCY_LABEL[line.frequency]}
                          {line.frequency === "weekly" ? (
                            <span className="text-muted-foreground block text-xs">
                              {line.days.map((d) => DAY_LABEL[d]).join(", ")}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          {WINDOW_LABEL[line.window]}
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
                    ))}
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
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Owned by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.containers.map((c) => (
                    <TableRow key={`${c.type}-${c.size}-${c.stream}`}>
                      <TableCell className="text-sm">
                        {c.size} {CONTAINER_TYPE[c.type].toLowerCase()}
                      </TableCell>
                      <TableCell>
                        <StreamTag stream={c.stream} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {c.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.ownership === "renuterra" ? "Renuterra" : "Customer"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
