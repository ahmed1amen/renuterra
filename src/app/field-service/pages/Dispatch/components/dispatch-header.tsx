"use client";

import { CalendarCog, Workflow } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateStrip } from "../../../components";

/**
 * Three-column bar: the day's totals on the left, the date control dead
 * centre, board-level links on the right. Per-route actions live in the
 * sidebar and map filters float on the map, so this stays one row.
 */
export function DispatchHeader({
  date,
  onDateChange,
  routes,
  stops,
  unstaffed,
  onGenerate,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  routes: number;
  stops: number;
  /** Instances on the day with an empty slot. */
  unstaffed: number;
  onGenerate: () => void;
}) {
  return (
    <header className="border-border bg-card relative z-20 flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-4">
      <dl className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
        <Stat label={routes === 1 ? "route" : "routes"} value={routes} />
        <Stat label={stops === 1 ? "stop" : "stops"} value={stops} />
        <Stat label="unstaffed" value={unstaffed} warn={unstaffed > 0} />
      </dl>

      <div className="order-3 flex w-full justify-center xl:order-none xl:w-auto">
        <DateStrip value={date} onChange={onDateChange} />
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-2 xl:justify-self-end">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/field-service/routes" />}
        >
          <Workflow data-icon="inline-start" />
          Manage routes
        </Button>
        <Button variant="outline" size="sm" onClick={onGenerate}>
          <CalendarCog data-icon="inline-start" />
          Generate
        </Button>
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-1 rounded-md border px-2 py-1 whitespace-nowrap",
        warn
          ? "border-warning/30 bg-warning-bg text-warning"
          : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {/* dt must precede dd in a <dl>; `order` puts the number first visually. */}
      <dt className="order-2">{label}</dt>
      <dd
        className={cn(
          "order-1 text-sm font-semibold tabular-nums",
          !warn && "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
