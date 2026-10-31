import { StreamTag } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatAmount,
  plannedUtilisation,
  type RouteContext,
  type RouteScore,
  routeCapacity,
} from "@/features/field-service";
import { findUser, type Route } from "@/mocks";
import {
  formatDay,
  formatDays,
  formatShortDay,
  SCHEDULE_PATTERN,
  scheduleLabel,
  UtilisationBar,
} from "../../../components";
import { Fact } from "./fact";
import { ScoreCard } from "./score-card";

const BASIS_LABEL = {
  volume: "Volume (loose m³)",
  visits: "Visits (lifts)",
  weight: "Weight (kg)",
};

/** Every Route attribute from spec §3 and §8.4, grouped the way planners think. */
export function DefinitionTab({
  route,
  ctx,
  score,
}: {
  route: Route;
  ctx: RouteContext;
  /** `null` while the scoring inputs load. */
  score: RouteScore | null;
}) {
  const m = ctx.masters;
  const entity = m.entities.find((e) => e.code === route.entity);
  const serviceType = m.serviceTypes.find((s) => s.code === route.serviceType);
  const city = m.cities.find((c) => c.code === route.city);
  const shift = m.shifts.find((s) => s.id === route.shiftId);
  const depot = m.depots.find((d) => d.id === route.depotId);
  const sites = route.disposalSiteIds
    .map((id) => m.disposalSites.find((d) => d.id === id))
    .filter((d) => d !== undefined);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            One entity and one service type per route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Route code">
              <span className="font-mono text-xs">{route.code}</span>
            </Fact>
            <Fact label="Route name">{route.name}</Fact>
            <Fact label="Entity">
              {route.entity} · {entity?.name}
            </Fact>
            <Fact label="Service type">
              {route.serviceType} · {serviceType?.name}
            </Fact>
            <Fact label="City / emirate">{city?.name ?? route.city}</Fact>
            <Fact label="Zone / area">{route.zone ?? "Whole city"}</Fact>
            <Fact label="Owner">{findUser(route.ownerId)?.name ?? "—"}</Fact>
            <Fact label="Valid">
              {formatDay(route.validFrom)} –{" "}
              {route.validTo ? formatDay(route.validTo) : "open-ended"}
            </Fact>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching attributes</CardTitle>
          <CardDescription>
            What a truck or driver must match. Changing one on an active route
            creates a new version.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-y-3">
            <Fact label="Truck type">
              <span className="flex flex-wrap items-center gap-1.5">
                {route.truckTypeIds.map((t, i) => (
                  <Badge
                    key={t}
                    variant={i === 0 ? "secondary" : "outline"}
                    className="font-mono"
                    title={m.truckTypes.find((x) => x.id === t)?.name}
                  >
                    {t}
                    {i === 0 ? " · required" : " · alternate"}
                  </Badge>
                ))}
              </span>
            </Fact>
            <Fact label="Required driver skills">
              <span className="flex flex-wrap gap-1.5">
                {route.requiredSkills.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="font-mono"
                    title={m.skillCodes.find((x) => x.code === s)?.name}
                  >
                    {s}
                  </Badge>
                ))}
              </span>
            </Fact>
            <Fact label="Shift">
              {shift?.name ?? route.shiftId}{" "}
              <span className="text-muted-foreground">
                (window {shift?.startTime}–{shift?.endTime})
              </span>{" "}
              · planned{" "}
              <span className="font-mono tabular-nums">
                {route.startTime}–{route.endTime}
              </span>
            </Fact>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waste streams & disposal</CardTitle>
          <CardDescription>
            {route.wasteCodes.length > 1
              ? route.coCollection
                ? "Co-collected: the streams share one body on the same trip."
                : "Separate trips: the streams never share a load."
              : "Single-stream route."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-border divide-y">
            {route.wasteCodes.map((code) => {
              const wc = m.wasteCodes.find((w) => w.code === code);
              const tip = sites.filter((s) => s.wasteCodes.includes(code));
              return (
                <li
                  key={code}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <span
                    className="flex min-w-0 items-center gap-2"
                    title={wc?.name}
                  >
                    {wc ? <StreamTag stream={wc.group} /> : null}
                    <span className="font-mono text-xs">{code}</span>
                  </span>
                  <span className="text-end text-sm">
                    {tip.length ? (
                      tip.map((s) => s.name).join(", ")
                    ) : (
                      <span className="text-destructive text-xs">
                        No disposal site
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
            {route.wasteCodes.length === 0 ? (
              <li className="text-muted-foreground text-sm">
                No streams declared yet.
              </li>
            ) : null}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule, depot & crew</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Fact label="Schedule pattern">
              {SCHEDULE_PATTERN[route.schedule.pattern]}
            </Fact>
            <Fact label="Schedule days">
              {route.schedule.pattern === "alternate"
                ? `Every 2nd day from ${formatDay(route.schedule.anchorDate ?? route.validFrom)}`
                : route.schedule.pattern === "weekly" ||
                    route.schedule.pattern === "custom"
                  ? formatDays(route.schedule.days) || "—"
                  : scheduleLabel(route)}
            </Fact>
            <Fact label="Start depot">{depot?.name ?? "—"}</Fact>
            <Fact label="Required helpers">
              {route.helpers}{" "}
              <span className="text-muted-foreground">
                ({route.serviceType} default{" "}
                {serviceType?.defaultHelpers ?? "—"})
              </span>
            </Fact>
          </dl>
        </CardContent>
      </Card>

      <CapacityCard route={route} ctx={ctx} />
      <ScoreCard score={score} />
    </div>
  );
}

function CapacityCard({ route, ctx }: { route: Route; ctx: RouteContext }) {
  const cap = routeCapacity(route, ctx.masters);
  const util = plannedUtilisation(route, ctx);
  const tt = ctx.masters.truckTypes.find((t) => t.id === route.truckTypeIds[0]);
  const alternates = route.truckTypeIds.slice(1).map((id) => ({
    id,
    cap: routeCapacity(route, ctx.masters, id),
    util: plannedUtilisation(route, ctx, undefined, id),
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Capacity</CardTitle>
        <CardDescription>
          Calculated from the required truck type and the planned trips.
          Utilisation is checked per due day, on the busiest one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-3 gap-4">
          <Fact label="Capacity basis">{BASIS_LABEL[cap.basis]}</Fact>
          <Fact label="Per-trip capacity">
            {formatAmount(cap.perTrip, cap.unit)}
            {cap.basis === "volume" && tt?.bodyM3 ? (
              <span className="text-muted-foreground block text-xs">
                {tt.bodyM3} m³ body × {tt.compressionRatio}
              </span>
            ) : null}
            {cap.basis === "weight" && tt?.containerSlots ? (
              <span className="text-muted-foreground block text-xs">
                {tt.containerSlots} container slots
              </span>
            ) : null}
          </Fact>
          <Fact
            label={cap.basis === "visits" ? "Visits / shift" : "Trips / shift"}
          >
            {cap.basis === "visits"
              ? (route.plannedVisits ?? 6)
              : route.plannedTrips}
          </Fact>
          <Fact label="Fill-rate assumption">
            {cap.basis === "volume"
              ? `${Math.round(route.fillRate * 100)}%`
              : "n/a"}
          </Fact>
          <Fact label="Capacity / shift">
            <span className="font-semibold">
              {formatAmount(cap.perShift, cap.unit)}
            </span>
          </Fact>
          <Fact label="Planned utilisation">
            <UtilisationBar pct={util.pct} />
            <span className="text-muted-foreground block text-xs">
              {util.consumed
                ? `${formatAmount(util.consumed, cap.unit)} on ${formatShortDay(util.day)}`
                : "Nothing due this week"}
            </span>
          </Fact>
        </dl>
        {alternates.length ? (
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
            <p className="text-muted-foreground mb-1 text-xs">
              If a backup of an alternate type is dispatched, capacity
              recalculates (flagged over 100%):
            </p>
            <ul className="space-y-1">
              {alternates.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span className="w-20 font-mono text-xs">{a.id}</span>
                  <span className="w-40 text-xs">
                    {formatAmount(a.cap.perShift, a.cap.unit)} / shift
                  </span>
                  <UtilisationBar pct={a.util.pct} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
