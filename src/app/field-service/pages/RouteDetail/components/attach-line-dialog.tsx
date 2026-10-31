"use client";

import { Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { StreamSwatch } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  attachChecks,
  attachServiceLine,
  CITY_OF_EMIRATE,
  type RouteContext,
  serviceTypesFor,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { Route } from "@/mocks";
import {
  Field,
  FREQUENCY_LABEL,
  formatDays,
  formatTimeWindow,
  logRouteEvent,
  RuleCheckList,
} from "../../../components";

/**
 * Attach a contracted service line to the route. Only lines at sites in the
 * route's city are offered (R7); R8–R11 run live. A line already on another
 * active route moves here (R10 transfer). R11's capacity block can be
 * overridden by the route owner with a reason (section 8.5 rule 1).
 */
export function AttachLineDialog({
  open,
  onOpenChange,
  route,
  ctx,
  customerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route;
  ctx: RouteContext;
  customerName: (id: string) => string | undefined;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [override, setOverride] = useState(false);
  const [reason, setReason] = useState("");

  const candidates = useMemo(
    () =>
      ctx.servicePoints
        .filter((sp) => CITY_OF_EMIRATE[sp.emirate] === route.city)
        .flatMap((sp) =>
          sp.serviceLines
            .filter((l) => !route.serviceLineIds.includes(l.id))
            .map((line) => ({
              line,
              servicePoint: sp,
              item: ctx.items.find((i) => i.id === line.serviceItemId),
              owner: ctx.routes.find(
                (r) =>
                  r.id !== route.id &&
                  r.status === "active" &&
                  r.serviceLineIds.includes(line.id),
              ),
            })),
        ),
    [ctx, route],
  );

  const term = query.trim().toLowerCase();
  const visible = candidates.filter(
    (c) =>
      !term ||
      `${customerName(c.servicePoint.customerId) ?? ""} ${c.servicePoint.name} ${c.servicePoint.area} ${c.item?.code ?? ""} ${c.item?.wasteCode ?? ""}`
        .toLowerCase()
        .includes(term),
  );
  // Lines that pass R8 (stream and service type) first.
  const fits = (item: (typeof candidates)[number]["item"]) =>
    Boolean(
      item &&
        route.wasteCodes.includes(item.wasteCode ?? "") &&
        serviceTypesFor(item).includes(route.serviceType),
    );
  visible.sort((a, b) => Number(!fits(a.item)) - Number(!fits(b.item)));

  const pick = candidates.find((c) => c.line.id === selected);
  const checks = pick
    ? attachChecks(route, pick.line, pick.servicePoint, ctx)
    : [];
  const blocks = checks.filter((c) => !c.ok && c.severity === "block");
  const onlyCapacity = blocks.length === 1 && blocks[0].rule === "R11";
  const overridden = onlyCapacity && override && reason.trim() !== "";
  const blocked = blocks.length > 0 && !overridden;

  function save() {
    if (!pick) return;
    attachServiceLine(ctx.routes, route.id, pick.line.id);
    const label = `${pick.servicePoint.name} · ${pick.item?.code ?? ""}`;
    logRouteEvent(
      route.id,
      pick.owner ? "Service line transferred in" : "Service line attached",
      `${label}${pick.owner ? ` from ${pick.owner.code}` : ""}${overridden ? `. Capacity override: ${reason.trim()}` : ""}`,
    );
    if (pick.owner)
      logRouteEvent(
        pick.owner.id,
        "Service line transferred out",
        `${label} to ${route.code}`,
      );
    toast.success(
      pick.owner
        ? `Transferred from ${pick.owner.code}`
        : "Service line attached",
      { description: label },
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Attach service line</DialogTitle>
          <DialogDescription>
            Contracted services at{" "}
            {ctx.masters.cities.find((c) => c.code === route.city)?.name} sites
            that aren't on this route yet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,1fr)_20rem] gap-4">
          <div className="min-w-0 space-y-2">
            <span className="relative flex">
              <Search
                className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Customer, site, item or waste code…"
                aria-label="Search service lines"
                size="sm"
                className="ps-9"
              />
            </span>
            {visible.length === 0 ? (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-10 text-center text-sm">
                {candidates.length
                  ? "No service lines match."
                  : "Every service line in this city is already on the route."}
              </p>
            ) : (
              <ul
                className="divide-border max-h-[50vh] divide-y overflow-y-auto rounded-lg border"
                aria-label="Service lines"
              >
                {visible.map(({ line, servicePoint, item, owner }) => {
                  const on = selected === line.id;
                  return (
                    <li key={line.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setSelected(line.id);
                          setOverride(false);
                        }}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-3 py-2 text-start transition-colors",
                          on ? "bg-muted" : "hover:bg-muted/50",
                        )}
                      >
                        {item ? (
                          <StreamSwatch
                            stream={item.stream}
                            className="mt-1.5"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {customerName(servicePoint.customerId) ??
                              servicePoint.name}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {servicePoint.location} · {servicePoint.area}
                          </span>
                          <span className="block text-xs">
                            <span className="font-mono">{item?.code}</span> ×{" "}
                            {line.quantity} · {FREQUENCY_LABEL[line.frequency]}
                            {line.frequency !== "on-call" &&
                            line.days.length < 7
                              ? ` ${formatDays(line.days)}`
                              : ""}{" "}
                            · {formatTimeWindow(line.timeWindow)}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px]">
                          {owner ? (
                            <span className="text-info font-mono">
                              On {owner.code}
                            </span>
                          ) : null}
                          {!fits(item) ? (
                            <span className="text-muted-foreground">
                              Doesn't fit
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            {pick ? (
              <>
                <p className="text-sm font-medium">Checks</p>
                <RuleCheckList checks={checks} />
                {onlyCapacity ? (
                  <div className="space-y-2 rounded-lg border px-3 py-2">
                    <label
                      htmlFor={`${id}-override`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`${id}-override`}
                        checked={override}
                        onCheckedChange={(v) => setOverride(Boolean(v))}
                      />
                      Override as route owner
                    </label>
                    {override ? (
                      <Field label="Reason" htmlFor={`${id}-reason`}>
                        <Textarea
                          id={`${id}-reason`}
                          rows={2}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Second trip agreed with the depot"
                        />
                      </Field>
                    ) : null}
                  </div>
                ) : null}
                {pick.owner ? (
                  <p className="text-muted-foreground text-xs">
                    Saving is a dated transfer: the line leaves{" "}
                    <span className="font-mono">{pick.owner.code}</span> from
                    today.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-10 text-center text-sm">
                Pick a service line to check whether it fits this route.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          {pick && blocked ? (
            <p className="text-destructive me-auto self-center text-xs">
              Blocked: {blocks.map((c) => c.label.toLowerCase()).join(", ")}
            </p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!pick || blocked}>
            {pick?.owner ? "Transfer here" : "Attach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
