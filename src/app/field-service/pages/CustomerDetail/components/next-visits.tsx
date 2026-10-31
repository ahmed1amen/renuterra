"use client";

import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { EmptyState, StreamTag } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { type ProjectedVisit, useDirectory } from "@/features/field-service";
import type { Appointment } from "@/mocks";
import {
  describeProjection,
  formatDayKey,
  ProjectionBadge,
  SERVICE_TYPE_LABEL,
} from "../../../components";
import { formatWindowRange, toDubaiDayKey } from "../../../utils";

type DayGroup = {
  day: string;
  projections: ProjectedVisit[];
  appointments: Appointment[];
};

/**
 * The customer's next visits by day: what the route schedule will collect
 * (dispatched or not yet) plus any open ad-hoc appointments.
 */
export function NextVisits({
  projections,
  adHoc,
}: {
  /** Projected visits, already limited to the window to show. */
  projections: ProjectedVisit[];
  /** Open customer-request appointments. */
  adHoc: Appointment[];
}) {
  const directory = useDirectory();

  const groups = new Map<string, DayGroup>();
  const groupOf = (day: string) => {
    let g = groups.get(day);
    if (!g) {
      g = { day, projections: [], appointments: [] };
      groups.set(day, g);
    }
    return g;
  };
  for (const v of projections) groupOf(v.date).projections.push(v);
  for (const a of adHoc)
    groupOf(toDubaiDayKey(a.windowStart)).appointments.push(a);
  const days = [...groups.values()].sort((a, b) => a.day.localeCompare(b.day));

  if (!days.length) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No visits in the next 7 days"
        description="Recurring visits appear here once a service line sits on a route."
        className="py-8"
      />
    );
  }

  return (
    <ol className="space-y-4">
      {days.map((g) => (
        <li key={g.day}>
          <h3 className="text-muted-foreground mb-1.5 text-xs font-medium">
            {formatDayKey(g.day)}
          </h3>
          <ul className="divide-border divide-y rounded-lg border">
            {g.appointments.map((apt) => {
              const site = directory.servicePoint(apt.servicePointId);
              return (
                <li
                  key={apt.id}
                  className="grid grid-cols-[1fr_8rem_12rem_9rem] items-center gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {site?.location ?? "—"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <StreamTag stream={apt.stream} />
                      {SERVICE_TYPE_LABEL[apt.serviceType]}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatWindowRange(apt.windowStart, apt.windowEnd)}
                  </span>
                  <Link
                    href={`/field-service/appointments/${apt.id}`}
                    className="text-info font-mono text-xs hover:underline"
                  >
                    {apt.ref}
                  </Link>
                  <span>
                    <Badge variant="warning">Ad-hoc</Badge>
                  </span>
                </li>
              );
            })}
            {g.projections.map((v) => {
              const { site, item, window } = describeProjection(v, directory);
              return (
                <li
                  key={v.serviceLineId}
                  className="grid grid-cols-[1fr_8rem_12rem_9rem] items-center gap-3 px-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {site?.location ?? "—"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      {item ? <StreamTag stream={item.stream} /> : null}
                      <span className="truncate">{item?.name ?? "—"}</span>
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums">
                    {window}
                  </span>
                  <Link
                    href={`/field-service/routes/${v.routeId}`}
                    className="text-muted-foreground font-mono text-xs hover:underline"
                  >
                    {v.routeCode}
                  </Link>
                  <span>
                    <ProjectionBadge visit={v} />
                  </span>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
