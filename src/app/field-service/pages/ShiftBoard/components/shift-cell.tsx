"use client";

import { AlertTriangle, Clock, Plus, Truck } from "lucide-react";
import { isWorkingShift } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Shift } from "@/mocks";
import {
  CREW_ROLE_LABEL,
  formatShiftWindow,
  SHIFT_TYPE,
} from "../../../components";
import { isOvertime, type RouteSeat, TONE_BLOCK } from "./board-meta";

/**
 * One pro on one day: the shift block, the routes they sit on, and a
 * destructive warning when they're on a route without a working shift.
 * The whole cell is the button that opens the shift dialog.
 */
export function ShiftCell({
  shift,
  seats,
  trainerName,
  label,
  onOpen,
}: {
  shift: Shift | undefined;
  seats: RouteSeat[];
  /** First name of the supervising pro on a training shift. */
  trainerName?: string;
  /** Accessible name, e.g. "Rashid Al Marri, Sun 30 Aug". */
  label: string;
  onOpen: () => void;
}) {
  const conflict = seats.length > 0 && !isWorkingShift(shift);
  const meta = shift ? SHIFT_TYPE[shift.type] : null;
  const Icon = meta?.icon;
  const note = shift?.note && !isOvertime(shift.note) ? shift.note : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${label}: ${shift ? `${meta?.label} shift, edit` : "add shift"}`}
      className="group/cell hover:bg-muted/60 focus-visible:ring-ring/50 flex h-full min-h-20 w-full flex-col gap-1 rounded-lg p-1 text-left transition-colors outline-none focus-visible:ring-3"
    >
      {shift && meta && Icon ? (
        <span
          className={cn(
            "flex flex-col gap-0.5 rounded-md px-2 py-1.5",
            TONE_BLOCK[meta.tone],
          )}
          title={note ?? undefined}
        >
          <span className="flex items-center gap-1 text-xs font-semibold">
            <Icon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{meta.label}</span>
            {isOvertime(shift.note) ? (
              <span
                className="bg-background/70 text-warning ml-auto inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-semibold"
                title="Overtime"
              >
                <Clock className="size-2.5" aria-hidden />
                OT
              </span>
            ) : null}
          </span>
          <span className="text-foreground/80 truncate text-[11px] tabular-nums">
            {shift.type === "leave"
              ? (note ?? "Not available")
              : formatShiftWindow(shift)}
          </span>
          {shift.type === "training" && trainerName ? (
            <span className="text-foreground/70 truncate text-[11px]">
              with {trainerName}
            </span>
          ) : null}
        </span>
      ) : (
        <span
          aria-hidden
          className="border-border text-muted-foreground flex flex-1 items-center justify-center rounded-md border border-dashed opacity-0 transition-opacity group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100"
        >
          <Plus className="size-4" />
        </span>
      )}

      {seats.map(({ route, role }) => (
        <span
          key={route.id}
          className="text-muted-foreground flex min-w-0 items-start gap-1 px-1 text-[11px] leading-tight"
          title={`${route.name} · ${CREW_ROLE_LABEL[role]}`}
        >
          <Truck className="mt-px size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">
            <span className="text-foreground font-medium">
              {CREW_ROLE_LABEL[role]}
            </span>{" "}
            · {route.name}
          </span>
        </span>
      ))}

      {conflict ? (
        <span className="bg-destructive-bg text-destructive flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight">
          <AlertTriangle className="size-3 shrink-0" aria-hidden />
          {shift?.type === "leave"
            ? "On route but on leave"
            : "On route, no shift"}
        </span>
      ) : null}
    </button>
  );
}
