"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/shared";
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
  findLine,
  isLineDue,
  isRouteDue,
  type RouteContext,
} from "@/features/field-service";
import type { Route, RouteInstance } from "@/mocks";
import {
  dayKeyFromToday,
  formatShortDay,
  InstanceStatusPill,
  TODAY_KEY,
} from "../../../components";

const HORIZON = Array.from({ length: 14 }, (_, i) => i);

/** The next 14 days: due or not, and the instance if one is generated. */
export function ScheduleTab({
  route,
  ctx,
  instances,
}: {
  route: Route;
  ctx: RouteContext;
  instances: RouteInstance[];
}) {
  const lines = route.serviceLineIds
    .map((id) => findLine(ctx.servicePoints, id)?.line)
    .filter((l) => l !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Next 14 days</CardTitle>
        <CardDescription>
          {route.status === "active"
            ? "Instances are generated the evening before (D-1), or up to 7 days ahead for planning."
            : "Only active routes inside their valid dates generate instances."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-end">Stops</TableHead>
              <TableHead>Instance</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Truck</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Open in dispatch</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {HORIZON.map((n) => {
              const day = dayKeyFromToday(n);
              const due = isRouteDue(route, day);
              const instance = instances.find((i) => i.date === day);
              const dueLines = lines.filter((l) => isLineDue(l, day));
              const active = dueLines.filter(
                (l) => l.contractStatus === "active",
              ).length;
              const driver = ctx.pros.find(
                (p) => p.id === instance?.primaryServiceProId,
              );
              const truck = ctx.vehicles.find(
                (v) => v.id === instance?.vehicleId,
              );
              return (
                <TableRow
                  key={day}
                  className={
                    !due && !instance ? "text-muted-foreground" : undefined
                  }
                >
                  <TableCell className="text-sm">
                    {formatShortDay(day)}
                    {day === TODAY_KEY ? (
                      <span className="text-info ms-1.5 text-xs font-medium">
                        Today
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {due ? (
                      <StatusPill tone="info">Due</StatusPill>
                    ) : (
                      <span className="text-xs">Not due</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-mono text-sm tabular-nums">
                    {due ? (
                      <>
                        {active}
                        {dueLines.length > active ? (
                          <span className="text-warning ms-1 text-xs">
                            +{dueLines.length - active} skipped
                          </span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {instance ? (
                      <span className="flex items-center gap-2">
                        <InstanceStatusPill status={instance.status} />
                        <span className="text-muted-foreground font-mono text-[11px]">
                          v{instance.routeVersion}
                        </span>
                      </span>
                    ) : due ? (
                      <span className="text-muted-foreground text-xs">
                        Not generated yet
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">
                    {instance
                      ? (driver?.name ?? (
                          <span className="text-destructive text-xs">
                            Unstaffed
                          </span>
                        ))
                      : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {instance ? (truck?.plate ?? "—") : null}
                  </TableCell>
                  <TableCell>
                    {instance ? (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        nativeButton={false}
                        render={<Link href="/field-service/dispatch" />}
                        aria-label={`Open ${instance.id} in dispatch`}
                      >
                        <ExternalLink aria-hidden />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
