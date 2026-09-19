"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addMonths,
  formatLongDate,
  formatMonthLong,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
  TODAY,
  toDayKey,
  WEEKDAY_LABELS,
} from "../utils";

/**
 * Month grid behind the date bar's month button. Hand-rolled rather than
 * pulling in a datepicker dependency — it is a 6×7 grid and two buttons.
 */
export function MonthCalendar({
  value,
  onSelect,
}: {
  value: Date;
  onSelect: (date: Date) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(value));
  const days = monthGrid(month);

  return (
    <div className="w-[19rem]">
      <header className="mb-4 flex items-center justify-between gap-2 px-1">
        <StepButton
          label="Previous month"
          icon={ChevronLeft}
          onClick={() => setMonth(addMonths(month, -1))}
        />
        <h2 className="text-base font-semibold">{formatMonthLong(month)}</h2>
        <StepButton
          label="Next month"
          icon={ChevronRight}
          onClick={() => setMonth(addMonths(month, 1))}
        />
      </header>

      <div className="grid grid-cols-7 gap-y-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="text-muted-foreground mb-1 flex h-6 items-center justify-center text-[13px] font-medium"
          >
            {label}
          </span>
        ))}

        {days.map((day) => {
          const selected = isSameDay(day, value);
          const today = isSameDay(day, TODAY);
          const outside = !isSameMonth(day, month);

          return (
            <button
              key={toDayKey(day)}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={formatLongDate(day)}
              aria-current={selected ? "date" : undefined}
              className={cn(
                "mx-auto flex size-10 items-center justify-center rounded-lg text-sm transition-colors",
                selected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-muted",
                !selected && outside && "text-muted-foreground/60",
                !selected && today && "text-primary font-semibold",
              )}
            >
              {day.getUTCDate()}
            </button>
          );
        })}
      </div>

      <Button
        className="mt-4 w-full"
        onClick={() => {
          setMonth(startOfMonth(TODAY));
          onSelect(TODAY);
        }}
      >
        Today
      </Button>
    </div>
  );
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
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
