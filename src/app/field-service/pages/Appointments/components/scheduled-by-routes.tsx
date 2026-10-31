"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ProjectedVisit } from "@/features/field-service";
import { cn } from "@/lib/utils";
import { formatDayKey, ProjectedVisitsTable } from "../../../components";

/**
 * Collapsed list of route-scheduled visits whose day hasn't been generated
 * on Dispatch: they become appointments only once it is.
 */
export function ScheduledByRoutes({ visits }: { visits: ProjectedVisit[] }) {
  const [open, setOpen] = useState(false);
  const days = [...new Set(visits.map((v) => v.date))];

  return (
    <section className="border-t pt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-muted flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-medium"
      >
        <ChevronRight
          className={cn(
            "text-muted-foreground size-4 transition-transform",
            open && "rotate-90",
          )}
          aria-hidden
        />
        Scheduled by routes: not generated yet
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          ({visits.length})
        </span>
      </button>
      {open ? (
        <div className="mt-2 space-y-4">
          <p className="text-muted-foreground px-2 text-xs">
            Generate the day on Dispatch to turn these into appointments.
          </p>
          {days.map((day) => {
            const rows = visits.filter((v) => v.date === day);
            return (
              <div key={day}>
                <div className="flex items-center justify-between gap-2 px-2">
                  <h3 className="text-muted-foreground text-xs font-medium">
                    {formatDayKey(day)} · {rows.length}{" "}
                    {rows.length === 1 ? "visit" : "visits"}
                  </h3>
                  <Link
                    href={`/field-service/dispatch?date=${day}`}
                    className="text-info flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    Generate on Dispatch
                    <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </div>
                <ProjectedVisitsTable visits={rows} showHeader={false} />
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
