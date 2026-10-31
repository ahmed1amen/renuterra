"use client";

import { ArrowDown, ArrowUp, ListPlus, Unlink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, StatusPill, StreamTag } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  detachServiceLine,
  type FillSuggestion,
  fillObservations,
  fillRateOf,
  findLine,
  formatAmount,
  limitLabel,
  lineConsumption,
  plannedUtilisation,
  type RouteContext,
  suggestFillRate,
  useAppointments,
  useCustomers,
  useRouteStore,
  useServiceLineStore,
  useVisitHistory,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Route, ServiceLine } from "@/mocks";
import {
  FREQUENCY_LABEL,
  formatDays,
  formatShortDay,
  formatTimeWindow,
  logRouteEvent,
  UtilisationBar,
} from "../../../components";
import { AttachLineDialog } from "./attach-line-dialog";

export const CONTRACT_STATUS: Record<
  ServiceLine["contractStatus"],
  { label: string; tone: "success" | "warning" | "destructive" }
> = {
  active: { label: "Active", tone: "success" },
  expired: { label: "Expired", tone: "destructive" },
  suspended: { label: "Suspended", tone: "warning" },
  "credit-hold": { label: "Credit hold", tone: "destructive" },
};

/** The route's stops: attached service lines in stop order. */
export function ServiceLinesTab({
  route,
  ctx,
}: {
  route: Route;
  ctx: RouteContext;
}) {
  const patchRoute = useRouteStore((s) => s.patchRoute);
  const customers = useCustomers();
  const history = useVisitHistory();
  const appointments = useAppointments();
  const [attaching, setAttaching] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const readOnly = route.status === "retired";

  const util = plannedUtilisation(route, ctx);
  const unit = util.capacity.unit;
  const stops = route.serviceLineIds
    .map((id) => ({ id, found: findLine(ctx.servicePoints, id) }))
    .filter((s) => s.found !== undefined);
  const skipped = stops.filter(
    (s) => s.found?.line.contractStatus !== "active",
  ).length;

  const move = (lineId: string, delta: number) => {
    const ids = [...route.serviceLineIds];
    const index = ids.indexOf(lineId);
    const [id] = ids.splice(index, 1);
    ids.splice(index + delta, 0, id);
    patchRoute(route.id, { serviceLineIds: ids });
  };

  const detach = (lineId: string, label: string) => {
    const before = route.serviceLineIds;
    detachServiceLine(route, lineId);
    logRouteEvent(route.id, "Service line detached", label);
    toast.success("Service line detached", {
      description: label,
      action: {
        label: "Undo",
        onClick: () => patchRoute(route.id, { serviceLineIds: before }),
      },
    });
  };

  const openAttach = () => {
    setDialogKey((k) => k + 1);
    setAttaching(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service lines</CardTitle>
        <CardDescription>
          Contracted services this route performs, in stop order. Phase 1 orders
          by time window; reorder with the arrows to override it.
          {skipped
            ? ` ${skipped} ${skipped === 1 ? "line is" : "lines are"} skipped at generation.`
            : ""}
        </CardDescription>
        <CardAction className="flex items-center gap-3">
          <span className="text-end">
            <UtilisationBar pct={util.pct} />
            <span className="text-muted-foreground block text-[11px]">
              {util.pct
                ? `${limitLabel(util.binding)}, ${formatShortDay(util.day)}`
                : "Nothing due this week"}
            </span>
          </span>
          {readOnly ? null : (
            <Button size="sm" onClick={openAttach}>
              <ListPlus data-icon="inline-start" />
              Attach service line
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent>
        {stops.length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title="No service lines yet"
            description={`Attach contracted services from ${ctx.masters.cities.find((c) => c.code === route.city)?.name ?? route.city} sites. Each line sits on one active route at a time.`}
            action={
              readOnly ? undefined : (
                <Button size="sm" variant="outline" onClick={openAttach}>
                  Attach service line
                </Button>
              )
            }
            className="py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Customer & site</TableHead>
                <TableHead>Service item × qty / visit</TableHead>
                <TableHead>Frequency & window</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead className="text-end">Consumes</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stops.map(({ id, found }, index) => {
                if (!found) return null;
                const { line, servicePoint } = found;
                const item = ctx.items.find((i) => i.id === line.serviceItemId);
                const customer = customers.data?.find(
                  (c) => c.id === servicePoint.customerId,
                );
                const contract = CONTRACT_STATUS[line.contractStatus];
                const label = `${servicePoint.name} · ${item?.code ?? line.serviceItemId}`;
                return (
                  <TableRow key={id}>
                    <TableCell className="text-muted-foreground font-mono text-xs tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="max-w-44">
                      <span className="block truncate text-sm font-medium">
                        {customer?.name ?? servicePoint.name}
                      </span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {servicePoint.location} · {servicePoint.area}
                      </span>
                    </TableCell>
                    <TableCell title={item?.name}>
                      <span className="block font-mono text-xs">
                        {item?.code}{" "}
                        <span className="text-muted-foreground">×</span>{" "}
                        <span className="font-semibold">{line.quantity}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        {item ? (
                          <StreamTag
                            stream={item.stream}
                            className="h-5 px-2"
                          />
                        ) : null}
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {item?.wasteCode}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {FREQUENCY_LABEL[line.frequency]}
                      <span className="text-muted-foreground">
                        {" · "}
                        {line.frequency === "on-call"
                          ? "Ad hoc"
                          : line.days.length === 7
                            ? "Every day"
                            : formatDays(line.days)}
                      </span>
                      <span className="block font-mono text-xs tabular-nums">
                        {formatTimeWindow(line.timeWindow)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={contract.tone}>
                        {contract.label}
                      </StatusPill>
                      {line.contractStatus !== "active" ? (
                        <span className="text-muted-foreground block text-[11px]">
                          Skipped at generation
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-end">
                      <span className="block font-mono text-xs tabular-nums">
                        {formatAmount(lineConsumption(route, line, ctx), unit)}
                      </span>
                      {item?.method === "empty-on-site" ? (
                        <FillRateCell
                          route={route}
                          line={line}
                          label={label}
                          readOnly={readOnly}
                          suggestion={suggestFillRate(
                            fillObservations(
                              line.id,
                              history.data ?? [],
                              appointments.data ?? [],
                            ),
                          )}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {readOnly ? null : (
                        <span className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={index === 0}
                            onClick={() => move(id, -1)}
                            aria-label={`Move ${label} up`}
                          >
                            <ArrowUp aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={index === stops.length - 1}
                            onClick={() => move(id, 1)}
                            aria-label={`Move ${label} down`}
                          >
                            <ArrowDown aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => detach(id, label)}
                            aria-label={`Detach ${label}`}
                          >
                            <Unlink aria-hidden />
                          </Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {attaching ? (
        <AttachLineDialog
          key={dialogKey}
          open={attaching}
          onOpenChange={setAttaching}
          route={route}
          ctx={ctx}
          customerName={(id) => customers.data?.find((c) => c.id === id)?.name}
        />
      ) : null}
    </Card>
  );
}

const asPct = (rate: number) => `${Math.round(rate * 100)}%`;

/**
 * The line's planned fill rate and, once it has history, the suggested one
 * with Accept (spec section 8.2): the dispatcher decides, nothing changes by
 * itself.
 */
function FillRateCell({
  route,
  line,
  label,
  readOnly,
  suggestion,
}: {
  route: Route;
  line: ServiceLine;
  label: string;
  readOnly: boolean;
  suggestion: FillSuggestion | null;
}) {
  const setFillRate = useServiceLineStore((s) => s.setFillRate);
  const current = fillRateOf(route, line);
  const differs =
    suggestion !== null && Math.abs(suggestion.rate - current.rate) >= 0.05;

  const accept = () => {
    if (!suggestion) return;
    const before = line.fillRate;
    setFillRate(line.id, suggestion.rate);
    toast.success(`Fill rate set to ${asPct(suggestion.rate)}`, {
      description: label,
      action: { label: "Undo", onClick: () => setFillRate(line.id, before) },
    });
  };

  return (
    <span className="text-muted-foreground mt-0.5 flex flex-col items-end gap-1 text-[11px]">
      <span>
        at {asPct(current.rate)}{" "}
        {current.source === "override" ? "override" : "standard"}
      </span>
      {suggestion ? (
        <span
          className="flex flex-col items-end gap-1"
          title={`From the last ${suggestion.visits} visits, recent ones weighted more. Range ${asPct(suggestion.min)} to ${asPct(suggestion.max)}.`}
        >
          {differs ? (
            <>
              <span
                className={cn(suggestion.rate > current.rate && "text-warning")}
              >
                History {asPct(suggestion.rate)}
              </span>
              {readOnly ? null : (
                <Button size="xs" variant="outline" onClick={accept}>
                  Accept
                </Button>
              )}
            </>
          ) : (
            <span>Matches history</span>
          )}
        </span>
      ) : (
        <span>Not enough visits yet</span>
      )}
    </span>
  );
}
