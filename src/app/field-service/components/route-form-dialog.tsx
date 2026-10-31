"use client";

import { GitBranch, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import {
  activationChecks,
  editRoute,
  nextRouteCode,
  type RouteContext,
  streamMixCheck,
  useRouteStore,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import {
  type CityCode,
  type EntityCode,
  type OpsMasters,
  type Route,
  type RouteShiftId,
  type SchedulePattern,
  type ServiceTypeCode,
  USERS,
} from "@/mocks";
import { Field } from "./form-field";
import { logRouteEvent } from "./route-history";
import {
  CodeChips,
  DayToggles,
  dayKeyFromToday,
  RuleCheckList,
} from "./route-labels";
import { SCHEDULE_PATTERN } from "./route-meta";

type Draft = Omit<
  Route,
  "id" | "status" | "version" | "colorIndex" | "serviceLineIds"
>;

/** Attributes whose change on an Active route makes a new version (R13). */
const MATCHING = [
  "serviceType",
  "city",
  "truckTypeIds",
  "requiredSkills",
  "wasteCodes",
  "shiftId",
] as const;

const STEPS = [
  { id: "basics", label: "Basics" },
  { id: "matching", label: "Truck, crew & streams" },
  { id: "operations", label: "Schedule & capacity" },
] as const;
type Step = (typeof STEPS)[number]["id"];

const PATTERN_OPTIONS: ComboboxOption[] = (
  Object.keys(SCHEDULE_PATTERN) as SchedulePattern[]
).map((p) => ({ value: p, label: SCHEDULE_PATTERN[p] }));

const OWNER_OPTIONS: ComboboxOption[] = USERS.map((u) => ({
  value: u.id,
  label: u.name,
}));

function defaultSkills(
  masters: OpsMasters,
  serviceType: ServiceTypeCode,
  city: CityCode,
  shiftId: RouteShiftId,
) {
  const st = masters.serviceTypes.find((s) => s.code === serviceType);
  return [
    ...(st?.requiredSkills ?? []),
    `CITY-${city}`,
    ...(shiftId === "NIGHT" ? ["SHIFT-NIGHT"] : []),
  ];
}

/** The type the fleet has most of, so a new route can actually be staffed. */
function defaultTruckType(ctx: RouteContext, serviceType: ServiceTypeCode) {
  const types = ctx.masters.truckTypes.filter((t) =>
    t.serviceTypes.includes(serviceType),
  );
  const count = (id: string) =>
    ctx.vehicles.filter((v) => v.truckTypeId === id).length;
  return [...types].sort((a, b) => count(b.id) - count(a.id))[0]?.id;
}

function blankDraft(ctx: RouteContext): Draft {
  const m = ctx.masters;
  const entity: EntityCode = "RWC";
  const serviceType: ServiceTypeCode = "REL";
  const city: CityCode = "DXB";
  const shift = m.shifts.find((s) => s.id === "MORNING") ?? m.shifts[0];
  return {
    code: nextRouteCode(ctx.routes, entity, city, serviceType),
    name: "",
    entity,
    serviceType,
    city,
    zone: null,
    truckTypeIds: [defaultTruckType(ctx, serviceType) ?? ""].filter(Boolean),
    requiredSkills: defaultSkills(m, serviceType, city, shift.id),
    wasteCodes: [],
    coCollection: false,
    schedule: { pattern: "weekdays", days: [], anchorDate: null },
    shiftId: shift.id,
    startTime: shift.startTime,
    endTime: "13:00",
    depotId: m.depots.find((d) => d.city === city)?.id ?? "",
    disposalSiteIds: [],
    helpers:
      m.serviceTypes.find((s) => s.code === serviceType)?.defaultHelpers ?? 1,
    plannedTrips: 2,
    plannedVisits: null,
    fillRate: 0.8,
    validFrom: dayKeyFromToday(1),
    validTo: null,
    ownerId: USERS[0]?.id ?? "",
  };
}

/**
 * New route (saves a Draft and opens it) or edit an existing one. Three steps
 * mirroring the spec's layers; every step stays reachable from the stepper.
 *
 * Prototype-grade: the only hard checks are a name and a unique code (R1).
 * The rest is surfaced as hints and enforced at activation.
 */
export function RouteFormDialog({
  open,
  onOpenChange,
  ctx,
  route,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: RouteContext;
  /** Omit to create a new draft. Mount with a `key` so the form resets. */
  route?: Route;
}) {
  const id = useId();
  const router = useRouter();
  const addRoute = useRouteStore((s) => s.addRoute);
  const m = ctx.masters;
  const [step, setStep] = useState<Step>("basics");
  const [form, setForm] = useState<Draft>(() => route ?? blankDraft(ctx));
  const [codeTouched, setCodeTouched] = useState(Boolean(route));

  const codeEditable = !route || route.status === "draft";
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** Re-default code and skills when a matching attribute changes. */
  function setMatching(changes: Partial<Draft>) {
    setForm((f) => {
      const next = { ...f, ...changes };
      const oldDefaults = defaultSkills(m, f.serviceType, f.city, f.shiftId);
      const extras = f.requiredSkills.filter((s) => !oldDefaults.includes(s));
      next.requiredSkills = [
        ...new Set([
          ...defaultSkills(m, next.serviceType, next.city, next.shiftId),
          ...extras,
        ]),
      ];
      if (!codeTouched && codeEditable)
        next.code = nextRouteCode(
          ctx.routes.filter((r) => r.id !== route?.id),
          next.entity,
          next.city,
          next.serviceType,
        );
      return next;
    });
  }

  const serviceType = m.serviceTypes.find((s) => s.code === form.serviceType);
  const truckOptions = m.truckTypes.filter((t) =>
    t.serviceTypes.includes(form.serviceType),
  );
  const depots = m.depots.filter((d) => d.city === form.city);
  const cityDisposal = m.disposalSites.filter((d) => d.city === form.city);
  const disposalOptions = form.wasteCodes.length
    ? cityDisposal.filter((d) =>
        d.wasteCodes.some((c) => form.wasteCodes.includes(c)),
      )
    : cityDisposal;
  const uncovered = form.wasteCodes.filter(
    (code) =>
      !form.disposalSiteIds.some((sid) =>
        m.disposalSites.find((d) => d.id === sid)?.wasteCodes.includes(code),
      ),
  );
  const basis =
    m.truckTypes.find((t) => t.id === form.truckTypeIds[0])?.capacityBasis ??
    serviceType?.capacityBasis ??
    "volume";

  const preview = useMemo<Route>(
    () => ({
      ...form,
      id: route?.id ?? "preview",
      status: route?.status ?? "draft",
      version: route?.version ?? 1,
      colorIndex: route?.colorIndex ?? 0,
      serviceLineIds: route?.serviceLineIds ?? [],
    }),
    [form, route],
  );
  const designChecks = activationChecks(preview, ctx).filter(
    (c) => c.rule === "R22",
  );
  const mixCheck = streamMixCheck(preview, m);

  const duplicate =
    codeEditable &&
    ctx.routes.some(
      (r) =>
        r.id !== route?.id && r.code.toUpperCase() === form.code.toUpperCase(),
    );
  const willVersion =
    route?.status === "active" &&
    MATCHING.some(
      (key) => JSON.stringify(form[key]) !== JSON.stringify(route[key]),
    );
  const canSave =
    form.name.trim() !== "" && form.code.trim() !== "" && !duplicate;

  function save() {
    const values: Draft = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      zone: form.zone?.trim() || null,
      plannedVisits: basis === "visits" ? (form.plannedVisits ?? 6) : null,
    };
    if (route) {
      const changes = Object.fromEntries(
        Object.entries(values).filter(
          ([k, v]) =>
            JSON.stringify(v) !== JSON.stringify(route[k as keyof Route]),
        ),
      ) as Partial<Route>;
      if (!Object.keys(changes).length) {
        onOpenChange(false);
        return;
      }
      const { versioned, version } = editRoute(route, changes);
      logRouteEvent(
        route.id,
        versioned ? `Version ${version} created` : "Definition edited",
        `Changed ${Object.keys(changes).join(", ")}.`,
      );
      toast.success(
        versioned ? `${route.code} is now v${version}` : `${route.code} saved`,
        {
          description: versioned
            ? `Instances already generated keep v${route.version}; the next one uses v${version}.`
            : values.name,
        },
      );
      onOpenChange(false);
      return;
    }
    const newId = `rt_${String(ctx.routes.length + 1).padStart(2, "0")}`;
    addRoute({
      ...values,
      id: newId,
      status: "draft",
      version: 1,
      colorIndex: ctx.routes.length % 8,
      serviceLineIds: [],
    });
    logRouteEvent(newId, "Route created as draft", values.code);
    toast.success(`${values.code} saved as a draft`, {
      description:
        "Assign a truck and driver, attach service lines, then activate.",
    });
    onOpenChange(false);
    router.push(`/field-service/routes/${newId}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {route ? `Edit ${route.code}` : "New route"}
          </DialogTitle>
          <DialogDescription>
            {route
              ? "A route is a standing template; daily instances are generated from it."
              : "Define the recurring run. It saves as a draft, so nothing is dispatched until you activate it."}
          </DialogDescription>
        </DialogHeader>

        <ol className="flex gap-1.5" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                aria-current={s.id === step ? "step" : undefined}
                className={cn(
                  "w-full border-t-2 pt-1.5 text-start text-xs font-medium transition-colors",
                  i <= stepIndex
                    ? "border-primary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-muted-foreground font-mono">{i + 1}</span>{" "}
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {willVersion ? (
          <Alert>
            <GitBranch aria-hidden />
            <AlertTitle>Saving creates v{(route?.version ?? 1) + 1}</AlertTitle>
            <AlertDescription>
              You changed a matching attribute on an active route. Instances
              already generated keep v{route?.version}.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid max-h-[60vh] gap-5 overflow-y-auto pr-1">
          {step === "basics" ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Entity" htmlFor={`${id}-entity`}>
                  <Combobox
                    id={`${id}-entity`}
                    options={m.entities.map((e) => ({
                      value: e.code,
                      label: e.code,
                      description: e.name,
                    }))}
                    value={form.entity}
                    onValueChange={(v) =>
                      setMatching({ entity: v as EntityCode })
                    }
                  />
                </Field>
                <Field label="Service type" htmlFor={`${id}-st`}>
                  <Combobox
                    id={`${id}-st`}
                    options={m.serviceTypes.map((s) => ({
                      value: s.code,
                      label: s.code,
                      description: s.name,
                    }))}
                    value={form.serviceType}
                    onValueChange={(v) => {
                      const st = v as ServiceTypeCode;
                      const def = m.serviceTypes.find((s) => s.code === st);
                      const truck = defaultTruckType(ctx, st);
                      setMatching({
                        serviceType: st,
                        truckTypeIds: truck ? [truck] : [],
                        helpers: def?.defaultHelpers ?? form.helpers,
                      });
                    }}
                  />
                </Field>
                <Field
                  label="City"
                  htmlFor={`${id}-city`}
                  hint="One city per route."
                >
                  <Combobox
                    id={`${id}-city`}
                    options={m.cities.map((c) => ({
                      value: c.code,
                      label: c.name,
                    }))}
                    value={form.city}
                    onValueChange={(v) => {
                      const city = v as CityCode;
                      setMatching({
                        city,
                        depotId:
                          m.depots.find((d) => d.city === city)?.id ?? "",
                        disposalSiteIds: [],
                      });
                    }}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-[1fr_14rem] gap-3">
                <Field label="Route name" htmlFor={`${id}-name`}>
                  <Input
                    id={`${id}-name`}
                    value={form.name}
                    placeholder="e.g. Al Quoz REL Morning A"
                    onChange={(e) => set("name", e.target.value)}
                    autoFocus
                  />
                </Field>
                <Field label="Zone / area" htmlFor={`${id}-zone`}>
                  <Input
                    id={`${id}-zone`}
                    value={form.zone ?? ""}
                    placeholder="Optional"
                    onChange={(e) => set("zone", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="Route code"
                  htmlFor={`${id}-code`}
                  hint={
                    codeEditable
                      ? "Entity-City-ServiceType-NNN. Locked once active."
                      : undefined
                  }
                >
                  <span className="relative flex">
                    <Input
                      id={`${id}-code`}
                      value={form.code}
                      disabled={!codeEditable}
                      aria-invalid={duplicate || undefined}
                      className="font-mono"
                      onChange={(e) => {
                        setCodeTouched(true);
                        set("code", e.target.value);
                      }}
                    />
                    {!codeEditable ? (
                      <Lock
                        aria-label="Immutable once active"
                        className="text-muted-foreground absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2"
                      />
                    ) : null}
                  </span>
                  {duplicate ? (
                    <p className="text-destructive text-xs">
                      Another route already uses this code.
                    </p>
                  ) : null}
                </Field>
                <Field label="Owner" htmlFor={`${id}-owner`}>
                  <Combobox
                    id={`${id}-owner`}
                    options={OWNER_OPTIONS}
                    value={form.ownerId}
                    onValueChange={(v) => set("ownerId", v)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Valid from" htmlFor={`${id}-from`}>
                    <Input
                      id={`${id}-from`}
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => set("validFrom", e.target.value)}
                    />
                  </Field>
                  <Field label="Valid to" htmlFor={`${id}-to`}>
                    <Input
                      id={`${id}-to`}
                      type="date"
                      value={form.validTo ?? ""}
                      onChange={(e) => set("validTo", e.target.value || null)}
                    />
                  </Field>
                </div>
              </div>
            </>
          ) : null}

          {step === "matching" ? (
            <>
              <Field
                label="Truck types"
                hint="The first is required; the rest are allowed alternates. Only types that do this service type are listed."
              >
                <div className="grid grid-cols-[14rem_1fr] items-start gap-3">
                  <Combobox
                    aria-label="Required truck type"
                    options={truckOptions.map((t) => ({
                      value: t.id,
                      label: t.id,
                      description: t.name,
                    }))}
                    value={form.truckTypeIds[0] ?? ""}
                    onValueChange={(v) =>
                      setMatching({
                        truckTypeIds: [
                          v,
                          ...form.truckTypeIds.slice(1).filter((t) => t !== v),
                        ],
                      })
                    }
                  />
                  {truckOptions.length > 1 ? (
                    <CodeChips
                      label="Alternate truck types"
                      options={truckOptions
                        .filter((t) => t.id !== form.truckTypeIds[0])
                        .map((t) => ({ id: t.id, label: t.id, title: t.name }))}
                      value={form.truckTypeIds.slice(1)}
                      onChange={(alts) =>
                        setMatching({
                          truckTypeIds: [form.truckTypeIds[0], ...alts],
                        })
                      }
                    />
                  ) : (
                    <p className="text-muted-foreground pt-1.5 text-xs">
                      No alternates for {form.serviceType}.
                    </p>
                  )}
                </div>
              </Field>

              <Field
                label="Required driver skills"
                hint={`Defaulted from ${form.serviceType}, CITY-${form.city}${form.shiftId === "NIGHT" ? " and SHIFT-NIGHT" : ""}. Every listed skill is mandatory.`}
              >
                <CodeChips
                  label="Required driver skills"
                  options={m.skillCodes.map((s) => ({
                    id: s.code,
                    label: s.code,
                    title: s.name,
                  }))}
                  value={form.requiredSkills}
                  onChange={(v) => set("requiredSkills", v)}
                />
              </Field>

              <Field
                label="Waste streams accepted"
                hint="Only service lines of an accepted stream can be attached."
              >
                <CodeChips
                  label="Waste streams accepted"
                  options={m.wasteCodes.map((w) => ({
                    id: w.code,
                    label: w.code,
                    title: w.name,
                  }))}
                  value={form.wasteCodes}
                  onChange={(v) =>
                    setMatching({
                      wasteCodes: v,
                      coCollection: v.length > 1 && form.coCollection,
                    })
                  }
                />
                <label
                  htmlFor={`${id}-coco`}
                  className="flex items-center gap-2 pt-1 text-sm"
                >
                  <Switch
                    id={`${id}-coco`}
                    checked={form.coCollection}
                    disabled={form.wasteCodes.length < 2}
                    onCheckedChange={(v) => set("coCollection", v)}
                  />
                  Co-collection: load the streams in one body on the same trip
                </label>
                {form.wasteCodes.length > 1 || !mixCheck.ok ? (
                  <RuleCheckList checks={[mixCheck]} className="mt-2" />
                ) : null}
              </Field>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Shift" htmlFor={`${id}-shift`}>
                  <Combobox
                    id={`${id}-shift`}
                    options={m.shifts.map((s) => ({
                      value: s.id,
                      label: s.name,
                      description: `${s.startTime}–${s.endTime}`,
                    }))}
                    value={form.shiftId}
                    onValueChange={(v) => {
                      const shift = m.shifts.find((s) => s.id === v);
                      if (!shift) return;
                      setMatching({
                        shiftId: shift.id,
                        startTime: shift.startTime,
                        endTime: shift.id === "NIGHT" ? "02:00" : "13:00",
                      });
                    }}
                  />
                </Field>
                <Field label="Planned start" htmlFor={`${id}-start`}>
                  <Input
                    id={`${id}-start`}
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set("startTime", e.target.value)}
                  />
                </Field>
                <Field label="Planned end" htmlFor={`${id}-end`}>
                  <Input
                    id={`${id}-end`}
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set("endTime", e.target.value)}
                  />
                </Field>
              </div>
              {designChecks.some((c) => !c.ok) ? (
                <RuleCheckList checks={designChecks} />
              ) : null}
            </>
          ) : null}

          {step === "operations" ? (
            <>
              <div className="grid grid-cols-[14rem_1fr] items-start gap-3">
                <Field label="Schedule pattern" htmlFor={`${id}-pattern`}>
                  <Combobox
                    id={`${id}-pattern`}
                    options={PATTERN_OPTIONS}
                    value={form.schedule.pattern}
                    onValueChange={(v) =>
                      set("schedule", {
                        ...form.schedule,
                        pattern: v as SchedulePattern,
                      })
                    }
                  />
                </Field>
                {form.schedule.pattern === "weekly" ||
                form.schedule.pattern === "custom" ? (
                  <Field label="Schedule days">
                    <DayToggles
                      label="Schedule days"
                      value={form.schedule.days}
                      onChange={(days) =>
                        set("schedule", { ...form.schedule, days })
                      }
                    />
                  </Field>
                ) : form.schedule.pattern === "alternate" ? (
                  <Field
                    label="Anchor date"
                    htmlFor={`${id}-anchor`}
                    hint="Runs every second day from here."
                  >
                    <Input
                      id={`${id}-anchor`}
                      type="date"
                      className="w-44"
                      value={form.schedule.anchorDate ?? form.validFrom}
                      onChange={(e) =>
                        set("schedule", {
                          ...form.schedule,
                          anchorDate: e.target.value || null,
                        })
                      }
                    />
                  </Field>
                ) : (
                  <p className="text-muted-foreground pt-7 text-xs">
                    {form.schedule.pattern === "daily"
                      ? "Every calendar day in the valid window."
                      : "Monday to Saturday."}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-[14rem_1fr] items-start gap-3">
                <Field label="Start depot" htmlFor={`${id}-depot`}>
                  <Combobox
                    id={`${id}-depot`}
                    options={depots.map((d) => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    value={form.depotId}
                    onValueChange={(v) => set("depotId", v)}
                    placeholder={
                      depots.length === 0
                        ? "No depot in this city"
                        : "Select a depot…"
                    }
                    disabled={depots.length === 0}
                  />
                </Field>
                <Field
                  label="Disposal sites"
                  hint={
                    form.wasteCodes.length
                      ? "Sites in the route's city that accept at least one of its streams."
                      : "Pick waste streams first to narrow the list."
                  }
                >
                  {disposalOptions.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No disposal site in this city takes these streams.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {disposalOptions.map((d) => {
                        const on = form.disposalSiteIds.includes(d.id);
                        return (
                          <li key={d.id}>
                            <label
                              htmlFor={`${id}-ds-${d.id}`}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                id={`${id}-ds-${d.id}`}
                                checked={on}
                                onCheckedChange={(v) =>
                                  set(
                                    "disposalSiteIds",
                                    v
                                      ? [...form.disposalSiteIds, d.id]
                                      : form.disposalSiteIds.filter(
                                          (x) => x !== d.id,
                                        ),
                                  )
                                }
                              />
                              {d.name}
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {d.wasteCodes.join(", ")}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {uncovered.length && form.disposalSiteIds.length ? (
                    <p className="text-warning text-xs">
                      No selected site takes {uncovered.join(", ")}; each stream
                      needs a tip.
                    </p>
                  ) : null}
                </Field>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Field
                  label="Helpers"
                  htmlFor={`${id}-helpers`}
                  hint={`${form.serviceType} default: ${serviceType?.defaultHelpers ?? "-"}.`}
                >
                  <Input
                    id={`${id}-helpers`}
                    type="number"
                    min={0}
                    max={4}
                    value={form.helpers}
                    onChange={(e) => set("helpers", Number(e.target.value))}
                  />
                </Field>
                {basis === "visits" ? (
                  <Field
                    label="Planned visits / shift"
                    htmlFor={`${id}-visits`}
                    hint="From the zone's average cycle time."
                  >
                    <Input
                      id={`${id}-visits`}
                      type="number"
                      min={1}
                      value={form.plannedVisits ?? 6}
                      onChange={(e) =>
                        set("plannedVisits", Number(e.target.value))
                      }
                    />
                  </Field>
                ) : (
                  <Field
                    label="Planned trips / shift"
                    htmlFor={`${id}-trips`}
                    hint="Tips per shift."
                  >
                    <Input
                      id={`${id}-trips`}
                      type="number"
                      min={1}
                      value={form.plannedTrips}
                      onChange={(e) =>
                        set("plannedTrips", Number(e.target.value))
                      }
                    />
                  </Field>
                )}
                <Field
                  label="Fill rate"
                  htmlFor={`${id}-fill`}
                  hint="Standard 80%; a service line can override."
                >
                  <span className="relative flex">
                    <Input
                      id={`${id}-fill`}
                      type="number"
                      min={10}
                      max={100}
                      disabled={basis !== "volume"}
                      value={Math.round(form.fillRate * 100)}
                      onChange={(e) =>
                        set("fillRate", Number(e.target.value) / 100)
                      }
                      className="pe-7"
                    />
                    <span className="text-muted-foreground pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-sm">
                      %
                    </span>
                  </span>
                </Field>
                <Field label="Capacity basis">
                  <p className="pt-1.5 text-sm capitalize">{basis}</p>
                </Field>
              </div>
            </>
          ) : null}
        </div>

        {!canSave && stepIndex === STEPS.length - 1 && !route ? (
          <p className="text-muted-foreground text-end text-xs">
            {duplicate
              ? "Pick a unique route code."
              : "Give the route a name on step 1."}
          </p>
        ) : null}
        <DialogFooter>
          {stepIndex > 0 ? (
            <Button
              variant="outline"
              className="sm:me-auto"
              onClick={() => setStep(STEPS[stepIndex - 1].id)}
            >
              Back
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {stepIndex < STEPS.length - 1 && !route ? (
            <Button onClick={() => setStep(STEPS[stepIndex + 1].id)}>
              Next
            </Button>
          ) : (
            <Button onClick={save} disabled={!canSave}>
              {route ? "Save changes" : "Save draft"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
