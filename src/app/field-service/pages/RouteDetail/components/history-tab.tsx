"use client";

import { History } from "lucide-react";
import { EmptyState } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RouteContext } from "@/features/field-service";
import type { Route } from "@/mocks";
import {
  formatDay,
  type RouteEvent,
  useRouteHistory,
} from "../../../components";
import { ASSET_TYPE_LABEL, assetName } from "./asset-label";

const EMPTY: RouteEvent[] = [];

/**
 * A minimal audit trail (R19): this session's edits on top of what the
 * fixtures imply — the route going live and each assignment starting.
 */
export function HistoryTab({
  route,
  ctx,
}: {
  route: Route;
  ctx: RouteContext;
}) {
  const session = useRouteHistory((s) => s.events[route.id] ?? EMPTY);

  const known: RouteEvent[] = [
    {
      at: `${route.validFrom}T00:00:00Z`,
      title:
        route.status === "draft" ? "Planned start date" : "Route valid from",
      detail: `${route.code} v1`,
    },
    ...ctx.assignments
      .filter((a) => a.routeId === route.id && !a.id.startsWith("asg_s"))
      .map((a) => ({
        at: `${a.validFrom}T00:00:00Z`,
        title: `${ASSET_TYPE_LABEL[a.assetType]} assigned`,
        detail: `${assetName(a, ctx)} as ${a.role === "primary" ? "primary" : `backup rank ${a.rank}`}`,
      })),
  ];
  const events = [
    ...session,
    ...known.sort((a, b) => b.at.localeCompare(a.at)),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          Every route, assignment and attachment change is logged with user and
          time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={History} title="No history yet" className="py-8" />
        ) : (
          <ol className="border-border ms-1.5 space-y-4 border-s ps-5">
            {events.map((e, i) => (
              <li key={`${e.at}-${i}`} className="relative">
                <span
                  aria-hidden
                  className={
                    i < session.length
                      ? "bg-primary absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full"
                      : "bg-muted-foreground absolute -start-[1.6rem] top-1.5 size-2.5 rounded-full"
                  }
                />
                <p className="text-sm font-medium">{e.title}</p>
                {e.detail ? (
                  <p className="text-muted-foreground text-sm">{e.detail}</p>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  {formatDay(e.at.slice(0, 10))}
                  {i < session.length ? " · this session" : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
