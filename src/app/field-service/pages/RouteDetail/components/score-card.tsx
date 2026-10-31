"use client";

import { Gauge } from "lucide-react";
import { EmptyState } from "@/components/shared";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouteScore } from "@/features/field-service";
import { RouteScoreBadge, RouteScoreBreakdown } from "../../../components";

/**
 * The route's design score with its full breakdown. Derived from the live
 * service lines, so it moves as lines are attached or detached.
 */
export function ScoreCard({ score }: { score: RouteScore | null }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Route score</CardTitle>
        <CardDescription>
          How well the route is designed, on its busiest day next week: how
          close its stops sit, drive overhead, capacity use and trips. Window
          fit is scored per day on Dispatch.
        </CardDescription>
        {score && score.stops > 0 ? (
          <CardAction>
            <RouteScoreBadge score={score} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {!score ? (
          <Skeleton className="h-48 w-full" />
        ) : score.stops === 0 ? (
          <EmptyState
            icon={Gauge}
            title="Nothing to score yet"
            description="No service line is due on this route next week. Attach service lines to see how well it's shaped."
            className="py-6"
          />
        ) : (
          <div className="max-w-xl">
            <RouteScoreBreakdown
              score={score}
              showHeader={false}
              showExplanations
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
