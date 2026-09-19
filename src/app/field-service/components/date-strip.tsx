"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatLongDate,
  formatMonthYear,
  formatWeekday,
  isSameDay,
  TODAY,
  toDayKey,
} from "../utils";
import { MonthCalendar } from "./month-calendar";

/**
 * The day the dispatch board is scoped to. One bordered surface with hairline
 * dividers grouping the step arrows, the week strip and the month picker, so
 * it reads as a single control rather than loose buttons.
 */
export function DateStrip({
  value,
  onChange,
}: {
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  // Seven days centred on the selection, so stepping a day slides the window
  // instead of jumping to the next calendar week.
  const days = Array.from({ length: 7 }, (_, i) => addDays(value, i - 3));

  return (
    <div className="border-border bg-card flex items-center gap-0.5 rounded-xl border p-1 shadow-sm">
      <StepButton
        label="Previous week"
        icon={ChevronsLeft}
        onClick={() => onChange(addDays(value, -7))}
      />
      <StepButton
        label="Previous day"
        icon={ChevronLeft}
        onClick={() => onChange(addDays(value, -1))}
      />

      <Divider />

      <ol className="flex items-center gap-0.5">
        {days.map((day) => {
          const selected = isSameDay(day, value);
          const today = isSameDay(day, TODAY);
          return (
            <li key={toDayKey(day)}>
              <button
                type="button"
                onClick={() => onChange(day)}
                aria-current={selected ? "date" : undefined}
                aria-label={formatLongDate(day)}
                title={formatLongDate(day)}
                className={cn(
                  "relative flex min-w-11 flex-col items-center rounded-lg px-2 py-1 transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-semibold tracking-wider uppercase",
                    selected
                      ? "text-primary-foreground/80"
                      : today
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {formatWeekday(day)}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm leading-tight font-semibold tabular-nums",
                    today && !selected && "text-primary",
                  )}
                >
                  {day.getUTCDate()}
                </span>
                {today && !selected ? (
                  <span
                    aria-hidden
                    className="bg-primary absolute bottom-0.5 size-1 rounded-full"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <Divider />

      <StepButton
        label="Next day"
        icon={ChevronRight}
        onClick={() => onChange(addDays(value, 1))}
      />
      <StepButton
        label="Next week"
        icon={ChevronsRight}
        onClick={() => onChange(addDays(value, 7))}
      />

      <Divider />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
            open ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          )}
        >
          <CalendarDays className="text-muted-foreground size-4" aria-hidden />
          {formatMonthYear(value)}
          <ChevronDown
            className={cn(
              "text-muted-foreground size-3.5 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto p-4"
          aria-label="Select date"
        >
          <MonthCalendar
            value={value}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Hairline separating logical groups inside the unified control. */
function Divider() {
  return <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />;
}

function StepButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof ChevronLeft;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
