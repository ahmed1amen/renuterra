import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { RuleCheck } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { DayOfWeek, Route } from "@/mocks";
import { addDays, TODAY, toDayKey } from "../utils";
import { SCHEDULE_PATTERN } from "./route-meta";

/** Monday-first, the way planners read a week. */
export const DAY_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const TODAY_KEY = toDayKey(TODAY);

/** `2026-09-04` plus n days. */
export function dayKeyFromToday(n: number) {
  return toDayKey(addDays(TODAY, n));
}

export function formatDays(days: DayOfWeek[]) {
  return DAY_ORDER.filter((d) => days.includes(d))
    .map((d) => DAY_LABEL[d])
    .join(", ");
}

/** "Daily", "Mon–Sat", "Wed", "Wed, Sat", "Alternate days". */
export function scheduleLabel(route: Route) {
  const { pattern, days } = route.schedule;
  if (pattern === "weekly" || pattern === "custom")
    return days.length ? formatDays(days) : SCHEDULE_PATTERN[pattern];
  return SCHEDULE_PATTERN[pattern];
}

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const shortDayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "1 Jul 2026" for a calendar day key. */
export function formatDay(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

/** "Sat 5 Sep" for a calendar day key. */
export function formatShortDay(day: string) {
  return shortDayFormat.format(new Date(`${day}T00:00:00Z`)).replace(",", "");
}

/** Green under 90%, warning 90–100%, destructive above (R11). */
export function utilisationTone(pct: number) {
  if (pct > 100) return "destructive" as const;
  if (pct >= 90) return "warning" as const;
  return "success" as const;
}

const BAR_TONE = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};
const TEXT_TONE = {
  success: "text-foreground",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function UtilisationBar({
  pct,
  className,
}: {
  pct: number;
  className?: string;
}) {
  const tone = utilisationTone(pct);
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className="bg-muted relative h-1.5 w-20 overflow-hidden rounded-full"
        aria-hidden
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            BAR_TONE[tone],
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </span>
      <span
        className={cn(
          "font-mono text-xs tabular-nums",
          TEXT_TONE[tone],
          tone !== "success" && "font-semibold",
        )}
      >
        {pct}%
      </span>
    </span>
  );
}

export function isBlocked(checks: RuleCheck[]) {
  return checks.some((c) => !c.ok && c.severity === "block");
}

/** Each rule as pass / warn / block, naming the rule and why (spec section 9). */
export function RuleCheckList({
  checks,
  className,
}: {
  checks: RuleCheck[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-border divide-y rounded-lg border", className)}>
      {checks.map((check) => {
        const state = check.ok
          ? "pass"
          : check.severity === "block"
            ? "block"
            : "warn";
        const Icon =
          state === "pass"
            ? CircleCheck
            : state === "block"
              ? CircleX
              : CircleAlert;
        return (
          <li
            key={`${check.rule}-${check.label}`}
            className="flex items-start gap-2.5 px-3 py-2"
          >
            <Icon
              aria-hidden
              className={cn(
                "mt-0.5 size-4 shrink-0",
                state === "pass" && "text-success",
                state === "warn" && "text-warning",
                state === "block" && "text-destructive",
              )}
            />
            <span className="min-w-0 flex-1 text-sm">
              <span className="flex items-baseline gap-2">
                <span className="font-medium">{check.label}</span>
                <span className="sr-only">
                  {state === "pass"
                    ? "passed"
                    : state === "block"
                      ? "blocked"
                      : "warning"}
                </span>
              </span>
              {check.detail ? (
                <span
                  className={cn(
                    "block text-xs",
                    state === "block"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {check.detail}
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Toggle row for a set of weekdays. */
export function DayToggles({
  value,
  onChange,
  options = DAY_ORDER,
  label,
}: {
  value: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  options?: DayOfWeek[];
  label: string;
}) {
  return (
    <fieldset className="flex flex-wrap gap-1" aria-label={label}>
      {DAY_ORDER.filter((d) => options.includes(d)).map((day) => {
        const on = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? value.filter((d) => d !== day) : [...value, day])
            }
            className={cn(
              "w-11 rounded-lg border py-1 text-xs font-medium transition-colors",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {DAY_LABEL[day]}
          </button>
        );
      })}
    </fieldset>
  );
}

/** Multi-select pill row for codes (skills, waste codes, truck types). */
export function CodeChips({
  options,
  value,
  onChange,
  label,
  locked = [],
}: {
  options: { id: string; label: string; title?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  /** Selected and not removable here (e.g. the primary truck type). */
  locked?: string[];
}) {
  return (
    <fieldset className="flex flex-wrap gap-1.5" aria-label={label}>
      {options.map((option) => {
        const on = value.includes(option.id);
        const fixed = locked.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            title={option.title}
            aria-pressed={on}
            disabled={fixed}
            onClick={() =>
              onChange(
                on
                  ? value.filter((v) => v !== option.id)
                  : [...value, option.id],
              )
            }
            className={cn(
              "rounded-lg border px-2 py-0.5 font-mono text-xs font-medium transition-colors disabled:cursor-not-allowed",
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
              fixed && "opacity-70",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
