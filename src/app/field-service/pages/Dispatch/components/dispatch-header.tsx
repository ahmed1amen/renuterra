"use client";

import { ChevronDown, Filter, Plus, Sparkles, Wand2 } from "lucide-react";
import { StreamSwatch, WASTE_STREAMS } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  onAutoPlan,
  onOptimizeAll,
  onNewRoute,
}: {
  date: Date;
  onDateChange: (date: Date) => void;
  stream: WasteStreamId | null;
  onStreamChange: (stream: WasteStreamId | null) => void;
  routes: number;
  stops: number;
  backlog: number;
  onAutoPlan: () => void;
  onOptimizeAll: () => void;
  onNewRoute: () => void;
}) {
  const current = WASTE_STREAMS.find((s) => s.id === stream);

  return (
    <header className="border-border bg-background flex shrink-0 items-center gap-4 border-b px-4 py-2">
      <DateStrip value={date} onChange={onDateChange} />

      <dl className="text-muted-foreground flex items-center gap-4 text-xs">
        <Count label={routes === 1 ? "route" : "routes"} value={routes} />
        <Count label={stops === 1 ? "stop" : "stops"} value={stops} />
        <Count label="in backlog" value={backlog} warn={backlog > 0} />
      </dl>

      <div className="ml-auto flex items-center gap-2">
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

        <Button variant="outline" size="sm" onClick={onNewRoute}>
          <Plus data-icon="inline-start" />
          New route
        </Button>
        <Button variant="outline" size="sm" onClick={onOptimizeAll}>
          <Sparkles data-icon="inline-start" />
          Optimize all
        </Button>
        <Button size="sm" onClick={onAutoPlan} disabled={backlog === 0}>
          <Wand2 data-icon="inline-start" />
          Auto-Plan
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
