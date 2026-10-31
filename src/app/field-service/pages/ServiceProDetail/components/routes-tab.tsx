"use client";

import { Route as RouteIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/shared";
import {
  Card,
  CardAction,
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
import type { RouteInstance, Vehicle } from "@/mocks";
import { routeRoleOf, VEHICLE_CLASS } from "../../../components";
import { formatDate, TODAY, toDayKey } from "../../../utils";

type Period = "upcoming" | "recent";

/** Routes the pro drives or rides on; rows open the Dispatch board. */
export function RoutesTab({
  proId,
  routes,
  vehicleOf,
}: {
  proId: string;
  /** Sorted by date, oldest first. */
  routes: RouteInstance[];
  vehicleOf: (id: string | null) => Vehicle | undefined;
}) {
  const router = useRouter();
  const today = toDayKey(TODAY);
  const [period, setPeriod] = useState<Period>("upcoming");
  const rows =
    period === "upcoming"
      ? routes.filter((r) => r.date >= today)
      : routes.filter((r) => r.date < today).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routes</CardTitle>
        <CardDescription>
          As primary or crew. Open one to plan it on the Dispatch board.
        </CardDescription>
        <CardAction>
          <fieldset
            className="flex gap-1"
            aria-label="Upcoming or recent routes"
          >
            {(["upcoming", "recent"] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-sm font-medium capitalize transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {p}
              </button>
            ))}
          </fieldset>
        </CardAction>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="text-right">Stops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((route) => {
                const vehicle = vehicleOf(route.vehicleId);
                return (
                  <TableRow
                    key={route.id}
                    className="cursor-pointer"
                    onClick={() => router.push("/field-service/dispatch")}
                  >
                    <TableCell className="text-sm whitespace-nowrap">
                      {formatDate(`${route.date}T08:00:00Z`)}
                      {route.date === today ? (
                        <span className="text-info ms-1.5 text-xs font-medium">
                          Today
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="block font-medium">{route.name}</span>
                      <span className="text-muted-foreground block font-mono text-xs tabular-nums">
                        {route.startTime}–{route.endTime}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {routeRoleOf(route, proId)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {vehicle ? (
                        <>
                          <span className="block font-mono">
                            {vehicle.plate}
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {VEHICLE_CLASS[vehicle.vehicleClass]}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {route.appointmentIds.length}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={RouteIcon}
            title={
              period === "upcoming" ? "No upcoming routes" : "No recent routes"
            }
            description="Routes appear here once Dispatch puts this service pro on one."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
