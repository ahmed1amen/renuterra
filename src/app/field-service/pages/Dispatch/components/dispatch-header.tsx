"use client";

import {
  CalendarCog,
  CheckCheck,
  ChevronDown,
  Filter,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { StreamSwatch, WASTE_STREAMS } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WasteStreamId } from "@/mocks";
import { DateStrip } from "../../../components";

const ALL = "all";

/** Date, stream filter, the day's totals and the board-wide actions. */
export function DispatchHeader({
  date,
  onDateChange,
  stream,
  onStreamChange,
  routes,
  stops,
  backlog,
  unstaffed,
  ready,
  optimizable,
  onGenerate,
  onConfirmAllReady,
  onPlaceBacklog,
  onOptimizeAll,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  stream: WasteStreamId | null;
  onStreamChange: (stream: WasteStreamId | null) => void;
  routes: number;
  stops: number;
  backlog: number;
  /** Instances on the day with an empty slot. */
  unstaffed: number;
  /** Instances with nothing blocking Confirm. */
  ready: number;
  /** Unconfirmed, open instances Optimize all would re-sequence. */
  optimizable: number;
  onGenerate: () => void;
  onConfirmAllReady: () => void;
  onPlaceBacklog: () => void;
  onOptimizeAll: () => void;
}) {
  const current = WASTE_STREAMS.find((s) => s.id === stream);

  return (
    <header className="border-border bg-background flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-2">
      <DateStrip value={date} onChange={onDateChange} />

      {/* Two rows beside the date strip, so the actions keep their labels. */}
      <dl className="text-muted-foreground grid shrink-0 grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <Count label={routes === 1 ? "route" : "routes"} value={routes} />
        <Count label={stops === 1 ? "stop" : "stops"} value={stops} />
        <Count label="unstaffed" value={unstaffed} warn={unstaffed > 0} />
        <Count label="in backlog" value={backlog} warn={backlog > 0} />
      </dl>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            {current ? (
              <StreamSwatch stream={current.id} className="size-2.5" />
            ) : (
              <Filter data-icon="inline-start" />
            )}
            {current?.label ?? "All streams"}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Waste stream</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={stream ?? ALL}
                onValueChange={(value) =>
                  onStreamChange(
                    value === ALL ? null : (value as WasteStreamId),
                  )
                }
              >
                <DropdownMenuRadioItem value={ALL}>
                  All streams
                </DropdownMenuRadioItem>
                {WASTE_STREAMS.map((s) => (
                  <DropdownMenuRadioItem key={s.id} value={s.id}>
                    <StreamSwatch stream={s.id} className="size-2.5" />
                    {s.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/field-service/routes" />}
        >
          <Workflow data-icon="inline-start" />
          Manage routes
        </Button>
        {/* The old Auto-Plan: place the backlog, or re-sequence every route. */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Wand2 data-icon="inline-start" />
            Auto-Plan
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem
              disabled={backlog === 0}
              onClick={onPlaceBacklog}
              className="items-start"
            >
              <Wand2 className="mt-0.5" aria-hidden />
              <span className="min-w-0">
                <span className="block">
                  Place backlog{backlog > 0 ? ` (${backlog})` : ""}
                </span>
                <span className="text-muted-foreground block text-xs">
                  Default route's instance first, else a compatible one
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={optimizable === 0}
              onClick={onOptimizeAll}
              className="items-start"
            >
              <Sparkles className="mt-0.5" aria-hidden />
              <span className="min-w-0">
                <span className="block">
                  Optimize all{optimizable > 0 ? ` (${optimizable})` : ""}
                </span>
                <span className="text-muted-foreground block text-xs">
                  Re-sequence every unconfirmed instance by window, then nearest
                  stop. Confirmed ones are skipped.
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={onConfirmAllReady}
          disabled={ready === 0}
          title="Confirm every staffed instance inside capacity"
        >
          <CheckCheck data-icon="inline-start" />
          Confirm all ready
          {ready > 0 ? (
            <span className="text-muted-foreground tabular-nums">{ready}</span>
          ) : null}
        </Button>
        <Button size="sm" onClick={onGenerate}>
          <CalendarCog data-icon="inline-start" />
          Generate
        </Button>
      </div>
    </header>
  );
}

function Count({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1 whitespace-nowrap">
      <dt className="sr-only">{label}</dt>
      <dd
        className={
          warn
            ? "text-warning text-sm font-semibold tabular-nums"
            : "text-foreground text-sm font-semibold tabular-nums"
        }
      >
        {value}
      </dd>
      <span aria-hidden>{label}</span>
    </div>
  );
}
