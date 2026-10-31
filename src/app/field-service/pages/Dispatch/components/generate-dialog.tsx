"use client";

import { ArrowRight, CalendarClock, Sparkles } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { StatusPill } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GRADE_LABEL,
  gradeOf,
  isRouteDue,
  useRouteInstances,
  useRouteScoring,
  useRoutes,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import { Field, GRADE_TONE } from "../../../components";
import { addDays, TODAY, toDayKey } from "../../../utils";
import type { GenerationResult } from "../hooks";

/** Spec section 6.2.6: D-1 by default, pre-generate up to 7 days ahead. */
export const HORIZON = Array.from({ length: 7 }, (_, i) =>
  toDayKey(addDays(TODAY, i + 1)),
);

const dayLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Sat 5 Sep" for a day key. */
export function formatDayKey(day: string) {
  return dayLabel.format(new Date(`${day}T00:00:00Z`));
}

const HORIZON_OPTIONS: ComboboxOption[] = HORIZON.map((day, i) => ({
  value: day,
  label: formatDayKey(day),
  description: i === 0 ? "Tomorrow" : undefined,
}));

/**
 * Pick the days to generate, run the engine, then read its summary. Stands in
 * for the nightly D-1 20:00 job: the dispatcher can run it early, ahead.
 */
export function GenerateDialog({
  open,
  onOpenChange,
  defaultDay,
  result,
  ready,
  onGenerate,
  onJump,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** First day picked when the dialog opens. */
  defaultDay: string;
  /** The last run's summary; shown instead of the picker when set. */
  result: GenerationResult | null;
  ready: boolean;
  onGenerate: (days: string[]) => void;
  onJump: (day: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {result ? (
          <ResultView
            result={result}
            onJump={onJump}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          // Keyed so each opening starts from the default day again.
          <PickDays
            key={`${open}-${defaultDay}`}
            defaultDay={defaultDay}
            ready={ready}
            onGenerate={onGenerate}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickDays({
  defaultDay,
  ready,
  onGenerate,
  onCancel,
}: {
  defaultDay: string;
  ready: boolean;
  onGenerate: (days: string[]) => void;
  onCancel: () => void;
}) {
  const fromId = useId();
  const toId = useId();
  const start = HORIZON.includes(defaultDay) ? defaultDay : HORIZON[0];
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(start);
  const routes = useRoutes();
  const instances = useRouteInstances();

  const days = HORIZON.filter((d) => d >= from && d <= to);
  const preview = days.map((day) => {
    const due = (routes.data ?? []).filter((r) => isRouteDue(r, day));
    const existing = (instances.data ?? []).filter((i) => i.date === day);
    return { day, due: due.length, existing: existing.length };
  });
  const toGenerate = preview.reduce(
    (sum, p) => sum + Math.max(0, p.due - p.existing),
    0,
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Generate route instances</DialogTitle>
        <DialogDescription>
          One instance per Active Route due that day and shift, staffed primary
          → backups → pool, with its due stops in window order.
        </DialogDescription>
      </DialogHeader>

      <p className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-xs">
        <CalendarClock className="size-4 shrink-0" aria-hidden />
        Runs automatically at 20:00 the day before. Generate early to plan up to
        7 days ahead.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="From" htmlFor={fromId}>
          <Combobox
            id={fromId}
            options={HORIZON_OPTIONS}
            value={from}
            searchable={false}
            onValueChange={(v) => {
              setFrom(v);
              if (v > to) setTo(v);
            }}
          />
        </Field>
        <Field label="Through" htmlFor={toId}>
          <Combobox
            id={toId}
            options={HORIZON_OPTIONS}
            value={to}
            searchable={false}
            onValueChange={(v) => {
              setTo(v);
              if (v < from) setFrom(v);
            }}
          />
        </Field>
      </div>

      <ul className="border-border divide-border/60 divide-y rounded-md border text-sm">
        {preview.map((p) => (
          <li key={p.day} className="flex items-center gap-3 px-3 py-2">
            <span className="w-24 font-medium tabular-nums">
              {formatDayKey(p.day)}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {p.due} {p.due === 1 ? "route" : "routes"} due
            </span>
            <span
              className={cn(
                "ml-auto text-xs",
                p.existing >= p.due && p.due > 0
                  ? "text-success"
                  : "text-muted-foreground",
              )}
            >
              {p.due === 0
                ? "Nothing due"
                : p.existing === 0
                  ? "Not generated"
                  : p.existing >= p.due
                    ? "Already generated"
                    : `${p.existing} of ${p.due} generated`}
            </span>
          </li>
        ))}
      </ul>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!ready} onClick={() => onGenerate(days)}>
          <Sparkles data-icon="inline-start" />
          {toGenerate > 0
            ? `Generate ${toGenerate} ${toGenerate === 1 ? "instance" : "instances"}`
            : days.length === 1
              ? "Generate day"
              : `Generate ${days.length} days`}
        </Button>
      </DialogFooter>
    </>
  );
}

function ResultView({
  result,
  onJump,
  onClose,
}: {
  result: GenerationResult;
  onJump: (day: string) => void;
  onClose: () => void;
}) {
  const range =
    result.days.length === 1
      ? formatDayKey(result.days[0])
      : `${formatDayKey(result.days[0])} – ${formatDayKey(result.days.at(-1) ?? result.days[0])}`;
  const attention =
    result.unstaffed +
    result.overCapacity +
    result.outsideWindow +
    result.contractsSkipped;

  const rows: {
    label: string;
    value: number;
    tone?: "destructive" | "warning";
    hint: string;
  }[] = [
    {
      label: "Generated",
      value: result.generated,
      hint: "New route instances",
    },
    {
      label: "Already generated",
      value: result.alreadyGenerated,
      hint: "Skipped: an instance existed",
    },
    {
      label: "Stops",
      value: result.stops,
      hint: "Due service lines copied in",
    },
    {
      label: "Unstaffed",
      value: result.unstaffed,
      tone: "destructive",
      hint: "Instances with an empty slot",
    },
    {
      label: "Substitutions",
      value: result.substitutions,
      hint: "Slots filled by a backup or the pool",
    },
    {
      label: "Over capacity",
      value: result.overCapacity,
      tone: "destructive",
      hint: "Resolve before confirming",
    },
    {
      label: "Outside window",
      value: result.outsideWindow,
      tone: "warning",
      hint: "Stops that miss their window",
    },
    {
      label: "Contracts skipped",
      value: result.contractsSkipped,
      tone: "warning",
      hint: "Expired, suspended or on credit hold",
    },
    {
      label: "Nothing due",
      value: result.nothingDue,
      hint: "Routes due with no service line due: no instance made",
    },
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {result.generated > 0
            ? `Generated ${result.generated} route ${result.generated === 1 ? "instance" : "instances"}`
            : "Nothing new to generate"}
        </DialogTitle>
        <DialogDescription>
          {range}.{" "}
          {attention > 0
            ? "Some instances need a dispatcher before they can be confirmed."
            : result.generated > 0
              ? "Every instance is staffed and inside capacity."
              : "Every due route already has an instance on these days."}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-border rounded-md border px-3 py-2"
          >
            <dt className="text-muted-foreground text-xs">{row.label}</dt>
            <dd
              className={cn(
                "text-lg font-semibold tabular-nums",
                row.value > 0 &&
                  row.tone === "destructive" &&
                  "text-destructive",
                row.value > 0 && row.tone === "warning" && "text-warning",
              )}
            >
              {row.value}
            </dd>
            <dd className="text-muted-foreground text-[11px]">{row.hint}</dd>
          </div>
        ))}
      </dl>

      <AverageScore days={result.days} />

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
        <Button onClick={() => onJump(result.firstAffectedDay)}>
          {attention > 0 ? "Review" : "Go to"}{" "}
          {formatDayKey(result.firstAffectedDay)}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </DialogFooter>
    </>
  );
}

/** Average instance score across the generated days, from live state. */
function AverageScore({ days }: { days: string[] }) {
  const instances = useRouteInstances();
  const { ready, instanceScore } = useRouteScoring();
  const scores = useMemo(
    () =>
      (instances.data ?? [])
        .filter((i) => days.includes(i.date) && i.status !== "cancelled")
        .map(instanceScore)
        .filter((s) => s !== null && s.stops > 0)
        .map((s) => s?.total ?? 0),
    [instances.data, days, instanceScore],
  );
  if (!ready || scores.length === 0) return null;
  const avg = Math.round(scores.reduce((n, s) => n + s, 0) / scores.length);
  const grade = gradeOf(avg);
  return (
    <p className="bg-muted/60 flex items-center gap-2 rounded-md px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        Average route score{days.length > 1 ? " across these days" : ""}
      </span>
      <StatusPill tone={GRADE_TONE[grade]} className="font-mono tabular-nums">
        {avg} <span className="font-sans">· {GRADE_LABEL[grade]}</span>
      </StatusPill>
      <span className="text-muted-foreground ml-auto text-xs tabular-nums">
        {scores.length} {scores.length === 1 ? "instance" : "instances"}
      </span>
    </p>
  );
}
