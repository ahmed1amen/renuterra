"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Route, Shift } from "@/mocks";
import { routeRoleOf, ShiftSummary } from "../../../components";
import { formatWeekday, isSameDay, parseDayKey, TODAY } from "../../../utils";

const dayNumber = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** Seven day cells, Sunday first: the shift and the route the pro is on. */
export function WeekSchedule({
  proId,
  days,
  shiftOf,
  routesOn,
  rangeLabel,
  onShiftWeek,
}: {
  proId: string;
  /** Day keys, Sunday to Saturday. */
  days: string[];
  shiftOf: (date: string) => Shift | undefined;
  routesOn: (date: string) => Route[];
  rangeLabel: string;
  /** -1 previous, +1 next, 0 back to this week. */
  onShiftWeek: (delta: -1 | 0 | 1) => void;
}) {
  const showingToday = days.some((d) => isSameDay(parseDayKey(d), TODAY));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Week</CardTitle>
        <CardDescription>{rangeLabel}</CardDescription>
        <CardAction className="flex items-center gap-1">
          {showingToday ? null : (
            <Button variant="outline" size="sm" onClick={() => onShiftWeek(0)}>
              This week
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous week"
            onClick={() => onShiftWeek(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next week"
            onClick={() => onShiftWeek(1)}
          >
            <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const date = parseDayKey(day);
            const today = isSameDay(date, TODAY);
            const shift = shiftOf(day);
            const routes = routesOn(day);
            return (
              <li
                key={day}
                className={cn(
                  "bg-muted/40 flex min-h-36 flex-col gap-2 rounded-lg border p-2.5",
                  today && "border-info bg-info-bg/40",
                )}
              >
                <p className="flex items-baseline justify-between gap-1">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wide",
                      today ? "text-info" : "text-muted-foreground",
                    )}
                  >
                    {formatWeekday(date)}
                  </span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {dayNumber.format(date)}
                  </span>
                </p>
                <ShiftSummary shift={shift} />
                {routes.length ? (
                  <ul className="mt-auto space-y-1.5">
                    {routes.map((route) => (
                      <li
                        key={route.id}
                        className="bg-card rounded-md border px-2 py-1.5"
                      >
                        <span className="line-clamp-2 text-xs font-medium">
                          {route.name}
                        </span>
                        <span className="text-muted-foreground block text-[11px]">
                          {routeRoleOf(route, proId)} ·{" "}
                          {route.appointmentIds.length}{" "}
                          {route.appointmentIds.length === 1 ? "stop" : "stops"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : shift && shift.type !== "leave" ? (
                  <p className="text-muted-foreground mt-auto text-xs">
                    No route
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
