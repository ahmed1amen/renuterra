import { CalendarClock } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDay, INSTANCE_STATUS } from "../../../components";
import { type StatusCount, TOMORROW_KEY } from "../hooks";

type Tomorrow = {
  runs: number;
  byStatus: StatusCount[];
  stops: number;
  unstaffed: number;
  backlogDue: number;
};

const DISPATCH_TOMORROW = `/field-service/dispatch?date=${TOMORROW_KEY}`;

export function TomorrowCard({ tomorrow }: { tomorrow: Tomorrow | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomorrow</CardTitle>
        <CardDescription>{formatShortDay(TOMORROW_KEY)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tomorrow === null ? (
          <output
            className="block space-y-2"
            aria-busy
            aria-label="Loading tomorrow"
          >
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </output>
        ) : tomorrow.runs === 0 ? (
          <div className="flex items-start gap-3">
            <CalendarClock
              className="text-muted-foreground mt-0.5 size-5 shrink-0"
              aria-hidden
            />
            <div className="space-y-1">
              <p className="text-sm font-medium">Not generated yet</p>
              <p className="text-muted-foreground text-xs">
                Route instances are generated at 20:00 the day before. Generate
                early from Dispatch.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-mono text-lg font-bold tabular-nums">
                {tomorrow.runs}
              </span>{" "}
              runs generated ·{" "}
              <span className="font-mono tabular-nums">{tomorrow.stops}</span>{" "}
              stops
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tomorrow.byStatus.map((s) => (
                <StatusPill
                  key={s.status}
                  tone={INSTANCE_STATUS[s.status].tone}
                >
                  {s.count} {INSTANCE_STATUS[s.status].label.toLowerCase()}
                </StatusPill>
              ))}
            </div>
          </div>
        )}
        {tomorrow && tomorrow.backlogDue > 0 ? (
          <p className="text-muted-foreground text-xs">
            {tomorrow.backlogDue} backlog{" "}
            {tomorrow.backlogDue === 1 ? "job is" : "jobs are"} due tomorrow and
            not on a run yet.
          </p>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={DISPATCH_TOMORROW} />}
        >
          Open tomorrow on Dispatch
        </Button>
      </CardContent>
    </Card>
  );
}
