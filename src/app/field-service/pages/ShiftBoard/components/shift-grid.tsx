"use client";

import { Fragment } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isWorkingShift } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Shift, Technician } from "@/mocks";
import { shiftHours } from "../../../components";
import { formatWeekday, parseDayKey } from "../../../utils";
import { firstName, type RouteSeat } from "./board-meta";
import { ShiftCell } from "./shift-cell";

export type DayCoverage = {
  day: string;
  driversOnShift: number;
  routes: number;
  stops: number;
};

export type ProGroup = { id: string; label: string; pros: Technician[] };

/**
 * Pros down the side (grouped Drivers / Helpers & trainees), the week's seven
 * days across, and a Coverage row that compares drivers on shift to routes.
 */
export function ShiftGrid({
  days,
  today,
  groups,
  shiftOf,
  seatsOf,
  proById,
  coverage,
  onOpen,
}: {
  days: string[];
  /** Day key of the mock today, highlighted when it's in view. */
  today: string;
  groups: ProGroup[];
  shiftOf: (proId: string, date: string) => Shift | undefined;
  seatsOf: (proId: string, date: string) => RouteSeat[];
  proById: (proId: string) => Technician | undefined;
  coverage: DayCoverage[];
  onOpen: (pro: Technician, date: string) => void;
}) {
  const todayCol = (day: string) => day === today && "bg-info-bg/40";

  return (
    <Table className="table-fixed border-separate border-spacing-0">
      <colgroup>
        <col className="w-48" />
        {days.map((day) => (
          <col key={day} />
        ))}
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="border-border border-b">Service pro</TableHead>
          {days.map((day) => {
            const date = parseDayKey(day);
            const isToday = day === today;
            return (
              <TableHead
                key={day}
                className={cn(
                  "border-border h-12 border-b text-center",
                  todayCol(day),
                )}
                aria-current={isToday ? "date" : undefined}
              >
                <span className="flex flex-col items-center leading-tight">
                  <span
                    className={cn(
                      "text-[11px] font-medium tracking-wide",
                      isToday ? "text-info" : "text-muted-foreground",
                    )}
                  >
                    {formatWeekday(date)}
                    {isToday ? " · Today" : ""}
                  </span>
                  <span
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      isToday && "text-info",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                </span>
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>

      <TableBody>
        {groups.map((group) =>
          group.pros.length ? (
            <Fragment key={group.id}>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={days.length + 1}
                  className="bg-muted/50 border-border text-muted-foreground border-b py-1.5 text-xs font-semibold tracking-wide uppercase"
                >
                  {group.label}
                  <span className="ml-1.5 font-mono tabular-nums opacity-70">
                    {group.pros.length}
                  </span>
                </TableCell>
              </TableRow>
              {group.pros.map((pro) => {
                const hours = days.reduce((sum, day) => {
                  const shift = shiftOf(pro.id, day);
                  return isWorkingShift(shift) && shift
                    ? sum + shiftHours(shift)
                    : sum;
                }, 0);
                return (
                  <TableRow key={pro.id} className="hover:bg-transparent">
                    <TableCell className="border-border border-b align-top whitespace-normal">
                      <div className="flex items-start gap-2.5">
                        <Avatar size="sm" className="size-8">
                          <AvatarFallback className="text-[11px] font-semibold">
                            {pro.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-sm font-medium">
                            {pro.name}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-xs">
                            {pro.skills.join(" · ")}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            <span className="text-foreground font-semibold tabular-nums">
                              {hours}h
                            </span>{" "}
                            this week
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    {days.map((day) => {
                      const shift = shiftOf(pro.id, day);
                      const trainer = shift?.trainerId
                        ? proById(shift.trainerId)
                        : undefined;
                      return (
                        <TableCell
                          key={day}
                          className={cn(
                            "border-border border-b border-l p-0.5 align-top whitespace-normal",
                            todayCol(day),
                          )}
                        >
                          <ShiftCell
                            shift={shift}
                            seats={seatsOf(pro.id, day)}
                            trainerName={
                              trainer ? firstName(trainer) : undefined
                            }
                            label={`${pro.name}, ${formatWeekday(parseDayKey(day))} ${parseDayKey(day).getUTCDate()}`}
                            onOpen={() => onOpen(pro, day)}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </Fragment>
          ) : null,
        )}
      </TableBody>

      <TableFooter className="bg-transparent">
        <TableRow className="hover:bg-transparent">
          <TableCell className="align-top">
            <p className="font-medium">Coverage</p>
            <p className="text-muted-foreground text-xs font-normal whitespace-normal">
              Drivers on shift vs routes, and stops booked. All service pros,
              whatever the filters.
            </p>
          </TableCell>
          {coverage.map((c) => {
            const short = c.routes > c.driversOnShift;
            return (
              <TableCell
                key={c.day}
                className={cn(
                  "border-border border-l align-top",
                  todayCol(c.day),
                )}
              >
                <div
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs",
                    short ? "bg-warning-bg text-warning" : "bg-muted/60",
                  )}
                  title={
                    short
                      ? `${c.routes - c.driversOnShift} more ${c.routes - c.driversOnShift === 1 ? "route" : "routes"} than drivers on shift`
                      : undefined
                  }
                >
                  <p className="font-semibold tabular-nums">
                    {c.driversOnShift}
                    <span className="font-normal opacity-80">
                      {" "}
                      / {c.routes} routes
                    </span>
                  </p>
                  <p className="text-muted-foreground font-normal">
                    drivers on shift
                  </p>
                  <p className="text-muted-foreground mt-1 font-normal tabular-nums">
                    {c.stops} {c.stops === 1 ? "stop" : "stops"}
                  </p>
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      </TableFooter>
    </Table>
  );
}
