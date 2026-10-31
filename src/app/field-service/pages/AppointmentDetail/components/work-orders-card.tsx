"use client";

import {
  ChevronDown,
  ClipboardCheck,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { StreamTag } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { isWorkOrderClosed, useDirectory } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { WorkOrder } from "@/mocks";
import {
  formatCountUnit,
  HANDLING_METHOD,
  SHORTFALL_REASON,
  WEIGHT_SOURCE,
  WorkOrderStatusPill,
} from "../../../components";
import { formatKg, formatTime } from "../../../utils";

/**
 * Every work order on the visit with its count and weight against plan.
 * While the service pro is on site each open order can be recorded on its own.
 */
export function WorkOrdersCard({
  workOrders,
  onSite,
  editable,
  onRecord,
  onDefer,
  onCancel,
  onAdd,
}: {
  workOrders: WorkOrder[];
  /** The visit is in progress: work orders can be recorded. */
  onSite: boolean;
  /** The visit isn't closed: work orders can be added, deferred or cancelled. */
  editable: boolean;
  onRecord: (wo: WorkOrder) => void;
  onDefer: (wo: WorkOrder) => void;
  onCancel: (wo: WorkOrder) => void;
  onAdd: () => void;
}) {
  const closed = workOrders.filter(isWorkOrderClosed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work orders</CardTitle>
        <CardDescription>
          {closed} of {workOrders.length} closed
          {onSite && closed < workOrders.length
            ? ": record each one to complete the visit."
            : "."}
        </CardDescription>
        {editable ? (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus data-icon="inline-start" />
              Add work order
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {workOrders.map((wo) => (
          <WorkOrderRow
            key={wo.id}
            wo={wo}
            canRecord={onSite && !isWorkOrderClosed(wo)}
            canChange={editable && !isWorkOrderClosed(wo)}
            onRecord={() => onRecord(wo)}
            onDefer={() => onDefer(wo)}
            onCancel={() => onCancel(wo)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function WorkOrderRow({
  wo,
  canRecord,
  canChange,
  onRecord,
  onDefer,
  onCancel,
}: {
  wo: WorkOrder;
  canRecord: boolean;
  canChange: boolean;
  onRecord: () => void;
  onDefer: () => void;
  onCancel: () => void;
}) {
  const [open, setOpen] = useState(false);
  const method = HANDLING_METHOD[wo.method];
  const MethodIcon = method.icon;
  const countPct =
    wo.countDone === null
      ? 0
      : Math.min(100, (wo.countDone / Math.max(1, wo.countPlanned)) * 100);
  const hasDetails =
    wo.containerIds.length > 0 || Object.keys(wo.evidence).length > 0;

  return (
    <section
      className={cn(
        "rounded-lg border",
        wo.status === "cancelled" && "opacity-70",
      )}
      aria-label={`${wo.ref} ${wo.itemName}`}
    >
      <div className="flex items-start gap-3 p-3">
        <span className="bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md">
          <MethodIcon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{wo.itemName}</p>
            <WorkOrderStatusPill status={wo.status} />
            {wo.origin === "added-on-site" ? (
              <Badge variant="outline">Added on site</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="font-mono">{wo.ref}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{wo.itemCode}</span>
            <span aria-hidden>·</span>
            <span>{method.label}</span>
            <StreamTag stream={wo.stream} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canRecord ? (
            <Button size="sm" onClick={onRecord}>
              <ClipboardCheck data-icon="inline-start" />
              Record
            </Button>
          ) : null}
          {canChange ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`More actions for ${wo.ref}`}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onDefer}>
                  Defer to next visit
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={onCancel}>
                  Cancel work order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t px-3 py-3 text-sm lg:grid-cols-4">
        <div className="space-y-1.5">
          <dt className="text-muted-foreground text-xs">Done / planned</dt>
          <dd className="font-mono tabular-nums">
            {wo.countDone ?? "-"} /{" "}
            {formatCountUnit(wo.countPlanned, wo.countUnit)}
          </dd>
          {wo.countDone !== null ? (
            <Progress
              value={countPct}
              aria-label={`${wo.ref} done against plan`}
            />
          ) : null}
        </div>
        <div className="space-y-0.5">
          <dt className="text-muted-foreground text-xs">Weight / estimate</dt>
          <dd className="font-mono tabular-nums">
            {wo.weightKg === null ? "-" : formatKg(wo.weightKg)} /{" "}
            {wo.weightEstKg ? formatKg(wo.weightEstKg) : "-"}
          </dd>
          {wo.weightSource ? (
            <dd
              className="text-muted-foreground text-xs"
              title={WEIGHT_SOURCE[wo.weightSource].description}
            >
              {WEIGHT_SOURCE[wo.weightSource].label}
            </dd>
          ) : null}
        </div>
        <div className="space-y-0.5">
          <dt className="text-muted-foreground text-xs">Start – end</dt>
          <dd className="font-mono tabular-nums">
            {wo.startedAt ? formatTime(wo.startedAt) : "-"} –{" "}
            {wo.completedAt ? formatTime(wo.completedAt) : "-"}
          </dd>
        </div>
        <div className="space-y-0.5">
          <dt className="text-muted-foreground text-xs">
            {wo.reason ? "Reason" : "Evidence"}
          </dt>
          <dd>
            {wo.reason ? (
              SHORTFALL_REASON[wo.reason]
            ) : hasDetails ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? "Hide details" : "Show details"}
                <ChevronDown
                  data-icon="inline-end"
                  className={cn("transition-transform", open && "rotate-180")}
                />
              </Button>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </dd>
        </div>
      </dl>

      {open || (wo.reason && hasDetails) ? <WorkOrderEvidence wo={wo} /> : null}
    </section>
  );
}

const MAX_SEALS = 8;

function WorkOrderEvidence({ wo }: { wo: WorkOrder }) {
  const directory = useDirectory();
  const ev = wo.evidence;
  const facts: [string, React.ReactNode][] = [];

  if (ev.fillLevelPct !== undefined)
    facts.push(["Fill level", `${ev.fillLevelPct}%`]);
  if (ev.contamination !== undefined)
    facts.push([
      "Contamination",
      ev.contamination ? (
        <Badge key="contamination" variant="warning">
          Reported
        </Badge>
      ) : (
        "None"
      ),
    ]);
  if (ev.containerOut)
    facts.push(["Container taken", <Mono key="out">{ev.containerOut}</Mono>]);
  if (ev.containerIn)
    facts.push([
      "Container left",
      ev.containerIn === ev.containerOut ? (
        "Same, tipped and returned"
      ) : (
        <Mono key="in">{ev.containerIn}</Mono>
      ),
    ]);
  if (ev.weighbridgeTicket)
    facts.push([
      "Weighbridge ticket",
      <Mono key="wb">{ev.weighbridgeTicket}</Mono>,
    ]);
  if (ev.facility) facts.push(["Facility", ev.facility]);
  if (ev.consignmentNote)
    facts.push([
      wo.method === "pump-out" ? "Manifest" : "Consignment note",
      <Mono key="cn">{ev.consignmentNote}</Mono>,
    ]);
  if (ev.consumablesLeft !== undefined)
    facts.push(["Empties left", String(ev.consumablesLeft)]);
  if (ev.photos) facts.push(["Photos", `${ev.photos} from the app`]);

  return (
    <div className="bg-muted/40 space-y-3 border-t px-3 py-3 text-sm">
      {wo.containerIds.length ? (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">Containers</p>
          <ul className="flex flex-wrap gap-1">
            {wo.containerIds.map((id) => (
              <li key={id}>
                <Badge variant="outline" className="font-mono">
                  {directory.container(id)?.tag ?? id}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {ev.seals?.length ? (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">
            Seals ({ev.seals.length})
          </p>
          <ul className="flex flex-wrap gap-1">
            {ev.seals.slice(0, MAX_SEALS).map((seal) => (
              <li key={seal}>
                <Badge variant="outline" className="font-mono">
                  {seal}
                </Badge>
              </li>
            ))}
            {ev.seals.length > MAX_SEALS ? (
              <li className="text-muted-foreground self-center text-xs">
                +{ev.seals.length - MAX_SEALS} more
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
      {facts.length ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs">{children}</span>;
}
