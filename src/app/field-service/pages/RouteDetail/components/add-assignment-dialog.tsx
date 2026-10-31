"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  assignmentChecks,
  type RouteContext,
  routeDays,
  useRouteStore,
} from "@/features/field-service";
import type { DayOfWeek, Route, RouteAssignment } from "@/mocks";
import {
  ChoiceChips,
  DayToggles,
  Field,
  isBlocked,
  logRouteEvent,
  RuleCheckList,
  TODAY_KEY,
} from "../../../components";
import { ASSET_TYPE_LABEL, assetName } from "./asset-label";

type AssetType = RouteAssignment["assetType"];
type Role = RouteAssignment["role"];

const ASSET_TYPES: { id: AssetType; label: string }[] = [
  { id: "truck", label: "Truck" },
  { id: "driver", label: "Driver" },
  { id: "helper", label: "Helper" },
];
const ROLES: { id: Role; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "backup", label: "Backup" },
];

/**
 * Staff the route with one asset. The §4.2 eligibility checks run live and
 * a failing block-severity check stops the save, naming the rule.
 * A new primary truck or driver demotes the current one to backup rank 1.
 */
export function AddAssignmentDialog({
  open,
  onOpenChange,
  route,
  ctx,
  initialType = "truck",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route;
  ctx: RouteContext;
  initialType?: AssetType;
}) {
  const id = useId();
  const addAssignment = useRouteStore((s) => s.addAssignment);
  const patchAssignment = useRouteStore((s) => s.patchAssignment);
  const mine = ctx.assignments.filter(
    (a) => a.routeId === route.id && a.status === "active",
  );

  const [assetType, setAssetType] = useState<AssetType>(initialType);
  const [assetId, setAssetId] = useState("");
  const [role, setRole] = useState<Role>("primary");
  const [rank, setRank] = useState(1);
  const [days, setDays] = useState<DayOfWeek[]>([]);
  const [validFrom, setValidFrom] = useState(
    route.validFrom > TODAY_KEY ? route.validFrom : TODAY_KEY,
  );
  const [validTo, setValidTo] = useState("");

  const taken = new Set(
    mine.filter((a) => a.assetType === assetType).map((a) => a.assetId),
  );
  const nextRank = (type: AssetType) =>
    Math.max(
      0,
      ...mine
        .filter((a) => a.assetType === type && a.role === "backup")
        .map((a) => a.rank),
    ) + 1;

  const changeType = (type: AssetType) => {
    setAssetType(type);
    setAssetId("");
    setRank(nextRank(type));
  };

  // Eligible-looking options first, so the planner rarely scrolls.
  const options =
    assetType === "truck"
      ? ctx.vehicles
          .filter((v) => !taken.has(v.id))
          .map((v) => ({
            id: v.id,
            label: v.plate,
            description: `${v.truckTypeId} · ${v.entity ?? "Pool"}`,
            match: route.truckTypeIds.includes(v.truckTypeId),
          }))
      : ctx.pros
          .filter((p) => !taken.has(p.id))
          .filter((p) => assetType === "helper" || p.role !== "loader")
          .map((p) => ({
            id: p.id,
            label: p.name,
            description: p.employeeId,
            match:
              assetType === "helper"
                ? p.role === "loader"
                : route.requiredSkills.every((s) =>
                    p.skillCodes?.some((c) => c.code === s),
                  ),
          }));
  const matchGroup =
    assetType === "truck"
      ? `Matches ${route.truckTypeIds.join(" / ")}`
      : assetType === "driver"
        ? "Holds the required skills"
        : "Loaders";
  const assetOptions: ComboboxOption[] = [
    ...options.filter((o) => o.match),
    ...options.filter((o) => !o.match),
  ].map((o) => ({
    value: o.id,
    label: o.label,
    description: o.description,
    group: o.match ? matchGroup : "Others",
  }));

  const checks = assetId
    ? assignmentChecks(route, assetType, assetId, role, days, ctx)
    : [];
  const blocked = isBlocked(checks);
  const replaces =
    role === "primary" && assetType !== "helper"
      ? mine.find((a) => a.assetType === assetType && a.role === "primary")
      : undefined;
  const helperPrimaries = mine.filter(
    (a) => a.assetType === "helper" && a.role === "primary",
  ).length;

  function save() {
    if (replaces) {
      for (const a of mine)
        if (a.assetType === assetType && a.role === "backup")
          patchAssignment(a.id, { rank: a.rank + 1 });
      patchAssignment(replaces.id, { role: "backup", rank: 1 });
    }
    const assignment: RouteAssignment = {
      id: `asg_s${ctx.assignments.length + 1}`,
      routeId: route.id,
      assetType,
      assetId,
      role,
      rank: role === "primary" ? 0 : rank,
      days,
      validFrom,
      validTo: validTo || null,
      status: "active",
    };
    addAssignment(assignment);
    const name = assetName(assignment, ctx);
    logRouteEvent(
      route.id,
      `${ASSET_TYPE_LABEL[assetType]} assigned`,
      `${name} as ${role === "primary" ? "primary" : `backup rank ${rank}`}.`,
    );
    toast.success(`${name} assigned to ${route.code}`, {
      description: replaces
        ? `${assetName(replaces, ctx)} moves to backup rank 1.`
        : role === "primary"
          ? "Primary"
          : `Backup, rank ${rank}`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add assignment</DialogTitle>
          <DialogDescription>
            Staff {route.code} with a truck, driver or helper. Assignments
            change with leave and fleet moves; the route stays put.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Asset type">
              <ChoiceChips
                label="Asset type"
                options={ASSET_TYPES}
                value={assetType}
                onChange={changeType}
              />
            </Field>
            <Field label="Role">
              <ChoiceChips
                label="Role"
                options={ROLES}
                value={role}
                onChange={(r) => {
                  setRole(r);
                  if (r === "backup") setRank(nextRank(assetType));
                }}
              />
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Field label={ASSET_TYPE_LABEL[assetType]} htmlFor={`${id}-asset`}>
              <Combobox
                id={`${id}-asset`}
                options={assetOptions}
                value={assetId}
                placeholder={`Choose ${assetType === "truck" ? "a truck" : `a ${assetType}`}…`}
                onValueChange={setAssetId}
              />
            </Field>
            <Field
              label="Rank"
              htmlFor={`${id}-rank`}
              hint={role === "primary" ? "Primaries are 0." : undefined}
            >
              <Input
                id={`${id}-rank`}
                type="number"
                min={1}
                disabled={role === "primary"}
                value={role === "primary" ? 0 : rank}
                onChange={(e) => setRank(Math.max(1, Number(e.target.value)))}
              />
            </Field>
          </div>

          <Field
            label="Days"
            hint={
              days.length
                ? "Only on the selected days."
                : "None selected = all route days."
            }
          >
            <DayToggles
              label="Assignment days"
              options={routeDays(route)}
              value={days}
              onChange={setDays}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valid from" htmlFor={`${id}-from`}>
              <Input
                id={`${id}-from`}
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </Field>
            <Field
              label="Valid to"
              htmlFor={`${id}-to`}
              hint="Blank = open-ended."
            >
              <Input
                id={`${id}-to`}
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </Field>
          </div>

          {replaces ? (
            <p className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
              {assetName(replaces, ctx)} is the current primary and will move to
              backup rank 1.
            </p>
          ) : null}
          {role === "primary" &&
          assetType === "helper" &&
          helperPrimaries >= route.helpers ? (
            <p className="text-warning text-sm">
              All {route.helpers} helper slots already have a primary.
            </p>
          ) : null}

          {assetId ? (
            <Field label="Eligibility checks">
              <RuleCheckList checks={checks} />
            </Field>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
              Pick an asset to run the eligibility checks.
            </p>
          )}
        </div>

        <DialogFooter>
          {blocked ? (
            <p className="text-destructive me-auto self-center text-xs">
              Blocked:{" "}
              {checks
                .filter((c) => !c.ok && c.severity === "block")
                .map((c) => c.label.toLowerCase())
                .join(", ")}
            </p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!assetId || blocked}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
