"use client";

import { PencilLine } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/features/crm";
import type { Activity, ActivityType } from "@/mocks";
import { ActivityRow, CrmTabBar, Screen, ScreenBody } from "../components";
import { formatDayLabel } from "../utils/format";

const TYPE_FILTERS: { id: ActivityType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "call", label: "Calls" },
  { id: "email", label: "Emails" },
  { id: "meeting", label: "Meetings" },
  { id: "note", label: "Notes" },
  { id: "task", label: "Tasks" },
];

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export function ActivityFeed() {
  const activities = useActivities();
  const [type, setType] = useState<ActivityType | "all">("all");

  const days = useMemo(() => {
    const filtered = (activities.data ?? []).filter(
      (a) => type === "all" || a.type === type,
    );
    const byDay = new Map<string, Activity[]>();
    for (const a of filtered) {
      const label = formatDayLabel(a.occurredAt);
      byDay.set(label, [...(byDay.get(label) ?? []), a]);
    }
    return [...byDay.entries()];
  }, [activities.data, type]);

  return (
    <Screen>
      <div className="px-4 pt-2">
        <PageHeader
          title="Activity"
          actions={
            <Button size="icon" aria-label="Log activity">
              <PencilLine />
            </Button>
          }
        />
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {TYPE_FILTERS.map((f) => {
          const active = f.id === type;
          return (
            <Button
              key={f.id}
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => setType(f.id)}
              className="shrink-0 rounded-full"
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      <ScreenBody>
        {activities.isPending ? (
          <ul className="space-y-1" aria-busy aria-label="Loading activity">
            {SKELETON_ROWS.map((n) => (
              <li key={n} className="flex gap-3 py-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : activities.isError ? (
          <ErrorState
            title="Couldn't load activity"
            error={activities.error}
            onRetry={() => activities.refetch()}
          />
        ) : days.length === 0 ? (
          <EmptyState
            title={
              type === "all" ? "Nothing logged yet" : "No matching activity"
            }
            description={
              type === "all"
                ? "Calls, emails, meetings and notes across the team show up here."
                : "Try a different activity type."
            }
            action={
              type === "all" ? (
                <Button size="sm">
                  <PencilLine data-icon="inline-start" />
                  Log activity
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setType("all")}
                >
                  Show all
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {days.map(([label, items]) => (
              <section key={label}>
                <h2 className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
                  {label}
                </h2>
                <ul className="divide-border divide-y">
                  {items.map((a) => (
                    <li key={a.id}>
                      <ActivityRow activity={a} showRelated />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </ScreenBody>

      <CrmTabBar active="activity" />
    </Screen>
  );
}
