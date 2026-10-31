import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isRouteDue, type RouteContext } from "@/features/field-service";
import { findUser, type Route, type RouteInstance } from "@/mocks";
import {
  dayKeyFromToday,
  formatDay,
  formatShortDay,
  InstanceStatusPill,
  TODAY_KEY,
} from "../../../components";
import { Fact } from "./fact";

const DISPOSAL_KIND = {
  landfill: "Landfill",
  transfer: "Transfer station",
  mrf: "MRF",
  organics: "Organics",
  cnd: "C&D facility",
  treatment: "Treatment",
  wastewater: "Wastewater plant",
};

/** Sidebar summary: who owns it, where it runs from and when it runs next. */
export function RouteFacts({
  route,
  ctx,
  instances,
}: {
  route: Route;
  ctx: RouteContext;
  instances: RouteInstance[];
}) {
  const m = ctx.masters;
  const owner = findUser(route.ownerId);
  const nextInstance = instances
    .filter((i) => i.date >= TODAY_KEY && i.status !== "completed")
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextDue = Array.from({ length: 30 }, (_, i) => dayKeyFromToday(i)).find(
    (d) => isRouteDue(route, d),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <Fact label="Owner">{owner?.name ?? "-"}</Fact>
          <Fact label="Entity">
            {m.entities.find((e) => e.code === route.entity)?.name ??
              route.entity}
          </Fact>
          <Fact label="City">
            {m.cities.find((c) => c.code === route.city)?.name ?? route.city}
            {route.zone ? (
              <span className="text-muted-foreground"> · {route.zone}</span>
            ) : null}
          </Fact>
          <Fact label="Start depot">
            {m.depots.find((d) => d.id === route.depotId)?.name ?? "-"}
          </Fact>
          <Fact label="Disposal sites">
            {route.disposalSiteIds.length ? (
              <ul className="space-y-1">
                {route.disposalSiteIds.map((id) => {
                  const site = m.disposalSites.find((d) => d.id === id);
                  return (
                    <li key={id}>
                      {site?.name ?? id}
                      {site ? (
                        <span className="text-muted-foreground block text-xs">
                          {DISPOSAL_KIND[site.kind]} ·{" "}
                          <span className="font-mono">
                            {site.wasteCodes
                              .filter((c) => route.wasteCodes.includes(c))
                              .join(", ")}
                          </span>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              "-"
            )}
          </Fact>
          <Fact label="Valid">
            {formatDay(route.validFrom)} –{" "}
            {route.validTo ? formatDay(route.validTo) : "open-ended"}
          </Fact>
          <Fact label="Next instance">
            {nextInstance ? (
              <span className="space-y-1">
                <span className="block">
                  {formatShortDay(nextInstance.date)}
                </span>
                <InstanceStatusPill status={nextInstance.status} />
              </span>
            ) : nextDue ? (
              <>
                {formatShortDay(nextDue)}
                <span className="text-muted-foreground block text-xs">
                  Due; not generated yet
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {route.status === "active"
                  ? "Not due in the next 30 days"
                  : "None while not active"}
              </span>
            )}
          </Fact>
        </dl>
      </CardContent>
    </Card>
  );
}
