import { Scale } from "lucide-react";
import { EmptyState, findStream, StreamTag } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatShortDay, TODAY_KEY } from "../../../components";
import { formatKg } from "../../../utils";
import type { DayCount, StreamTotal } from "../hooks";

const SKELETON_ROWS = [0, 1, 2, 3];

function pct(value: number, max: number) {
  return `${Math.round((value / Math.max(1, max)) * 100)}%`;
}

export function StreamWeekCard({ streams }: { streams: StreamTotal[] | null }) {
  const max = Math.max(0, ...(streams ?? []).map((s) => s.kg));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collected this week by stream</CardTitle>
        <CardDescription>
          Recorded weight on completed work orders, Sunday to today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {streams === null ? (
          <output
            className="block space-y-3"
            aria-busy
            aria-label="Loading weights"
          >
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-6 w-full" />
            ))}
          </output>
        ) : streams.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nothing weighed yet"
            description="Weights appear once work orders are completed this week."
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {streams.map((s) => (
              <li key={s.stream} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <StreamTag stream={s.stream} />
                  <span className="font-mono text-xs tabular-nums">
                    {formatKg(s.kg)}
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      findStream(s.stream).swatchClass,
                    )}
                    style={{ width: pct(s.kg, max) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RunsWeekCard({ days }: { days: DayCount[] | null }) {
  const max = Math.max(0, ...(days ?? []).map((d) => d.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runs this week</CardTitle>
        <CardDescription>
          Route instances per day, Sunday first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {days === null ? (
          <output
            className="block space-y-2"
            aria-busy
            aria-label="Loading runs this week"
          >
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-5 w-full" />
            ))}
          </output>
        ) : (
          <ul className="space-y-2">
            {days.map((d) => (
              <li
                key={d.day}
                className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm"
              >
                <span
                  className={cn(
                    "text-xs",
                    d.isToday
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {formatShortDay(d.day)}
                </span>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.isToday ? "bg-primary" : "bg-info",
                    )}
                    style={{ width: pct(d.count, max) }}
                  />
                </div>
                <span className="text-end font-mono text-xs tabular-nums">
                  {d.count || (d.day > TODAY_KEY ? "—" : "0")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
