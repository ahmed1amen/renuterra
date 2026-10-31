"use client";

import { StatusPill, type StatusTone } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GRADE_LABEL,
  type RouteScore,
  type ScoreGrade,
  type ScoreMetric,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import { formatDuration } from "../utils";

export const GRADE_TONE: Record<ScoreGrade, StatusTone> = {
  excellent: "success",
  good: "info",
  fair: "warning",
  poor: "destructive",
};

/** Indicator colour per metric score, so a weak metric stands out. */
const BAR_TONE: Record<StatusTone, string> = {
  success: "[&_[data-slot=progress-indicator]]:bg-success",
  info: "[&_[data-slot=progress-indicator]]:bg-info",
  warning: "[&_[data-slot=progress-indicator]]:bg-warning",
  destructive: "[&_[data-slot=progress-indicator]]:bg-destructive",
  neutral: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
};

function metricTone(score: number): StatusTone {
  return score >= 0.8
    ? "success"
    : score >= 0.65
      ? "info"
      : score >= 0.5
        ? "warning"
        : "destructive";
}

/** "2.4 km", "38%", "2 trips"; "—" when there was nothing to measure. */
export function formatMetricValue(metric: ScoreMetric) {
  const { value, unit } = metric;
  if (value === null) return "—";
  if (unit === "km") return `${value.toFixed(1)} km`;
  if (unit === "ratio") return `${Math.round(value * 100)}%`;
  return `${value} ${value === 1 ? "trip" : "trips"}`;
}

/** "~1h 20m drive (38.2 km)". */
function driveSummary(score: RouteScore) {
  return `${score.stops} ${score.stops === 1 ? "stop" : "stops"} · ~${formatDuration(score.driveMinutes)} drive (${score.driveKm} km)`;
}

/**
 * A route or instance score as a pill: "77 · Good", tinted by grade. Hover or
 * focus opens the breakdown. `compact` shows the number only (timeline lanes).
 * `null` while the scoring inputs load.
 */
export function RouteScoreBadge({
  score,
  compact = false,
  className,
}: {
  score: RouteScore | null | undefined;
  compact?: boolean;
  className?: string;
}) {
  if (!score)
    return (
      <Skeleton
        className={cn("h-5 rounded-4xl", compact ? "w-7" : "w-16", className)}
      />
    );
  if (score.stops === 0)
    return (
      <Badge
        variant="neutral"
        className={className}
        title="Nothing to score: no stops"
      >
        {compact ? "—" : "No stops"}
      </Badge>
    );

  const tone = GRADE_TONE[score.grade];
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label={`Route score ${score.total}, ${GRADE_LABEL[score.grade]}`}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "focus-visible:ring-ring/50 rounded-4xl outline-none focus-visible:ring-[3px]",
          className,
        )}
      >
        <StatusPill tone={tone} className="font-mono tabular-nums">
          {score.total}
          {compact ? null : (
            <span className="font-sans">· {GRADE_LABEL[score.grade]}</span>
          )}
        </StatusPill>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-80">
        <RouteScoreBreakdown score={score} />
      </PopoverContent>
    </Popover>
  );
}

/**
 * The full breakdown: grade, each metric with a bar and its raw value, the
 * penalties, then stops and drive. Shared by the badge's popover and the
 * Score card on a Route's Definition tab.
 */
export function RouteScoreBreakdown({
  score,
  showHeader = true,
  showExplanations = false,
}: {
  score: RouteScore;
  showHeader?: boolean;
  /** Each metric's one-line explanation under it (the card has the room). */
  showExplanations?: boolean;
}) {
  const tone = GRADE_TONE[score.grade];
  return (
    <div className="flex flex-col gap-3 text-sm">
      {showHeader ? (
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">Route score</span>
          <StatusPill tone={tone} className="font-mono tabular-nums">
            {score.total}
            <span className="font-sans">· {GRADE_LABEL[score.grade]}</span>
          </StatusPill>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {score.metrics.map((metric) => {
          const measured = metric.value !== null;
          return (
            <li key={metric.key} title={metric.explanation}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className={cn(!measured && "text-muted-foreground")}>
                  {metric.label}
                </span>
                <span className="text-muted-foreground font-mono tabular-nums">
                  {formatMetricValue(metric)}
                </span>
              </div>
              <Progress
                value={measured ? Math.round(metric.score * 100) : 0}
                aria-label={`${metric.label} ${measured ? `${Math.round(metric.score * 100)} of 100` : "not measured"}`}
                className={cn(
                  "mt-1",
                  measured ? BAR_TONE[metricTone(metric.score)] : "opacity-50",
                )}
              />
              {showExplanations ? (
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {measured
                    ? metric.explanation
                    : `${metric.explanation} Not measured, left out of the score.`}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {score.penalties.length ? (
        <>
          <Separator />
          <ul className="flex flex-col gap-1">
            {score.penalties.map((p) => (
              <li
                key={p.key}
                className="flex items-baseline justify-between gap-2 text-xs"
                title={p.explanation}
              >
                <span className="min-w-0">
                  {p.label}
                  {showExplanations ? (
                    <span className="text-muted-foreground block text-[11px]">
                      {p.explanation}
                    </span>
                  ) : null}
                </span>
                <span className="text-destructive shrink-0 font-mono tabular-nums">
                  −{p.points} pts
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <Separator />
      <p className="text-muted-foreground text-xs tabular-nums">
        {driveSummary(score)}
        {score.penaltyPoints ? (
          <span className="block">
            Base {score.base} − {score.penaltyPoints} penalty pts
          </span>
        ) : null}
      </p>
    </div>
  );
}
