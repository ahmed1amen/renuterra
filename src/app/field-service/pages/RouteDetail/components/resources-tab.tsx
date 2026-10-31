"use client";

import {
  ArrowUpToLine,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/shared";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  assignmentChecks,
  type RouteContext,
  useRouteStore,
} from "@/features/field-service";
import type { Route, RouteAssignment } from "@/mocks";
import {
  formatDay,
  formatDays,
  logRouteEvent,
  TechnicianIdentity,
} from "../../../components";
import { AddAssignmentDialog } from "./add-assignment-dialog";
import { ASSET_TYPE_LABEL, assetName } from "./asset-label";

type AssetType = RouteAssignment["assetType"];

const SECTIONS: { type: AssetType; title: string; icon: typeof Truck }[] = [
  { type: "truck", title: "Trucks", icon: Truck },
  { type: "driver", title: "Drivers", icon: UserRound },
  { type: "helper", title: "Helpers", icon: Users },
];

/** Primary first, then backups by rank; suspended rows sink to the bottom. */
function sortAssignments(a: RouteAssignment, b: RouteAssignment) {
  if (a.status !== b.status) return a.status === "active" ? -1 : 1;
  if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
  return a.rank - b.rank;
}

export function ResourcesTab({
  route,
  ctx,
}: {
  route: Route;
  ctx: RouteContext;
}) {
  const patchAssignment = useRouteStore((s) => s.patchAssignment);
  const [adding, setAdding] = useState<AssetType | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const readOnly = route.status === "retired";

  const mine = ctx.assignments.filter((a) => a.routeId === route.id);

  const openAdd = (type: AssetType) => {
    setDialogKey((k) => k + 1);
    setAdding(type);
  };

  function makePrimary(target: RouteAssignment) {
    const clash = assignmentChecks(
      route,
      target.assetType,
      target.assetId,
      "primary",
      target.days,
      ctx,
    ).find((c) => c.rule === "R6" && !c.ok);
    if (clash) {
      toast.error(clash.label, { description: clash.detail });
      return;
    }
    const same = mine.filter(
      (a) => a.assetType === target.assetType && a.status === "active",
    );
    const primaries = same.filter((a) => a.role === "primary");
    // Helpers have several primary slots; only demote once they're all full.
    const demote =
      target.assetType === "helper" && primaries.length < route.helpers
        ? undefined
        : primaries[primaries.length - 1];
    if (demote) {
      for (const a of same)
        if (a.role === "backup" && a.id !== target.id)
          patchAssignment(a.id, { rank: a.rank + 1 });
      patchAssignment(demote.id, { role: "backup", rank: 1 });
    }
    patchAssignment(target.id, { role: "primary", rank: 0 });
    const name = assetName(target, ctx);
    logRouteEvent(
      route.id,
      `${ASSET_TYPE_LABEL[target.assetType]} made primary`,
      demote
        ? `${name} replaces ${assetName(demote, ctx)}, now backup rank 1.`
        : name,
    );
    toast.success(`${name} is now primary`, {
      description: demote
        ? `${assetName(demote, ctx)} moves to backup rank 1.`
        : undefined,
    });
  }

  function toggleSuspend(a: RouteAssignment) {
    const next = a.status === "active" ? "suspended" : "active";
    patchAssignment(a.id, { status: next });
    const name = assetName(a, ctx);
    logRouteEvent(
      route.id,
      `Assignment ${next === "suspended" ? "suspended" : "reactivated"}`,
      name,
    );
    toast.success(
      next === "suspended" ? `${name} suspended` : `${name} reactivated`,
      {
        description:
          next === "suspended"
            ? "Assignments are suspended, never deleted."
            : undefined,
      },
    );
  }

  return (
    <div className="space-y-4">
      {SECTIONS.map(({ type, title, icon: Icon }) => {
        const rows = mine
          .filter((a) => a.assetType === type)
          .sort(sortAssignments);
        const primaries = rows.filter(
          (a) => a.role === "primary" && a.status === "active",
        ).length;
        const short = type === "helper" && primaries < route.helpers;
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="text-muted-foreground size-4" aria-hidden />
                {title}
              </CardTitle>
              <CardDescription>
                {type === "helper" ? (
                  <span className={short ? "text-warning" : undefined}>
                    {route.helpers} required · {primaries} primary assigned
                    {short
                      ? ": instances stay Unstaffed until every slot is filled."
                      : ""}
                  </span>
                ) : type === "truck" ? (
                  `Must be ${route.truckTypeIds.join(" or ")}, registered to ${route.entity} or the pool.`
                ) : (
                  `Must hold ${route.requiredSkills.join(", ")}.`
                )}
              </CardDescription>
              {readOnly ? null : (
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAdd(type)}
                  >
                    <Plus data-icon="inline-start" />
                    Add {ASSET_TYPE_LABEL[type].toLowerCase()}
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
                  No {title.toLowerCase()} assigned.
                  {type !== "helper"
                    ? " A primary is needed before the route can be activated."
                    : ""}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ASSET_TYPE_LABEL[type]}</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-end">Rank</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Valid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((a) => (
                      <TableRow
                        key={a.id}
                        className={
                          a.status === "suspended" ? "opacity-60" : undefined
                        }
                      >
                        <TableCell>
                          <AssetCell assignment={a} ctx={ctx} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              a.role === "primary" ? "secondary" : "outline"
                            }
                          >
                            {a.role === "primary" ? "Primary" : "Backup"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end font-mono text-sm tabular-nums">
                          {a.rank}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.days.length ? (
                            formatDays(a.days)
                          ) : (
                            <span className="text-muted-foreground">
                              All route days
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDay(a.validFrom)} –{" "}
                          {a.validTo ? formatDay(a.validTo) : "open"}
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            tone={a.status === "active" ? "success" : "warning"}
                            dot
                          >
                            {a.status === "active" ? "Active" : "Suspended"}
                          </StatusPill>
                        </TableCell>
                        <TableCell>
                          {readOnly ? null : (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon-xs" />
                                }
                                aria-label={`Actions for ${assetName(a, ctx)}`}
                              >
                                <MoreHorizontal aria-hidden />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  disabled={
                                    a.role === "primary" ||
                                    a.status !== "active"
                                  }
                                  onClick={() => makePrimary(a)}
                                >
                                  <ArrowUpToLine aria-hidden />
                                  Make primary
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleSuspend(a)}
                                >
                                  {a.status === "active" ? (
                                    <Pause aria-hidden />
                                  ) : (
                                    <Play aria-hidden />
                                  )}
                                  {a.status === "active"
                                    ? "Suspend"
                                    : "Reactivate"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      {adding ? (
        <AddAssignmentDialog
          key={dialogKey}
          open={adding !== null}
          onOpenChange={(open) => {
            if (!open) setAdding(null);
          }}
          route={route}
          ctx={ctx}
          initialType={adding}
        />
      ) : null}
    </div>
  );
}

function AssetCell({
  assignment,
  ctx,
}: {
  assignment: RouteAssignment;
  ctx: RouteContext;
}) {
  if (assignment.assetType === "truck") {
    const v = ctx.vehicles.find((x) => x.id === assignment.assetId);
    if (!v)
      return <span className="font-mono text-xs">{assignment.assetId}</span>;
    const tt = ctx.masters.truckTypes.find((t) => t.id === v.truckTypeId);
    return (
      <span className="block leading-tight">
        <span className="block font-mono text-sm">{v.plate}</span>
        <span className="text-muted-foreground block text-xs">
          {v.truckTypeId} · {tt?.name} · {v.entity ?? "Shared pool"}
        </span>
      </span>
    );
  }
  const pro = ctx.pros.find((p) => p.id === assignment.assetId);
  return pro ? (
    <TechnicianIdentity technician={pro} />
  ) : (
    <span className="font-mono text-xs">{assignment.assetId}</span>
  );
}
