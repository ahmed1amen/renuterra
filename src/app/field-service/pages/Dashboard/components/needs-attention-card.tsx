import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CircleCheck,
  FileWarning,
  HardHat,
  Truck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { EmptyState, StatusPill } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttentionItem, AttentionKind } from "../hooks";

const SKELETON_ROWS = [0, 1, 2, 3];

const GROUPS: { kind: AttentionKind; label: string; icon: LucideIcon }[] = [
  { kind: "unstaffed", label: "Unstaffed runs, next 7 days", icon: UserX },
  { kind: "skill", label: "Skill codes expiring", icon: HardHat },
  { kind: "vehicle", label: "Truck documents expiring", icon: Truck },
  { kind: "contract", label: "Inactive contracts", icon: FileWarning },
  {
    kind: "backlog",
    label: "Backlog waiting since before today",
    icon: CalendarClock,
  },
];

export function NeedsAttentionCard({
  items,
}: {
  items: AttentionItem[] | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
        <CardDescription>
          Gaps that will stop a run or a stop if nobody acts. Expiries look 30
          days ahead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <output
            className="block space-y-3"
            aria-busy
            aria-label="Loading items that need attention"
          >
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-10 w-full" />
            ))}
          </output>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title="Nothing needs attention"
            description="Every run in the next 7 days is staffed, no skills or permits expire within 30 days, and the backlog is current."
            className="py-10"
          />
        ) : (
          <div className="space-y-4">
            {GROUPS.map((group) => {
              const rows = items.filter((i) => i.kind === group.kind);
              if (!rows.length) return null;
              const Icon = group.icon;
              return (
                <section key={group.kind} className="space-y-1">
                  <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Icon className="size-3.5" aria-hidden />
                    {group.label}
                    <span className="font-mono tabular-nums">
                      {rows.length}
                    </span>
                  </h3>
                  <ul className="divide-border divide-y">
                    {rows.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="hover:bg-muted -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.title}
                            </span>
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.detail}
                            </span>
                          </span>
                          <StatusPill tone={item.tone} dot>
                            {item.state}
                          </StatusPill>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
