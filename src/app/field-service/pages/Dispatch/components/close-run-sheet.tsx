"use client";

import { Lock } from "lucide-react";
import { useId, useState } from "react";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useDirectory, useOpsMasters } from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { FailedReason } from "@/mocks";
import {
  APPOINTMENT_STATUS,
  type CloseRunInput,
  FAILED_REASON,
  Field,
  RESOLVED_STATUSES,
  type RoutePlan,
  type StopResolution,
} from "../../../components";
import { formatKg } from "../../../utils";

const RESCHEDULE = "reschedule";

const RESOLUTION_OPTIONS: ComboboxOption[] = [
  ...Object.entries(FAILED_REASON).map(([value, label]) => ({
    value,
    label: `Missed: ${label.toLowerCase()}`,
    group: "Missed, with a reason",
  })),
  {
    value: RESCHEDULE,
    label: "Reschedule to the next day",
    description: "Back to the backlog, same arrival window",
    group: "Reschedule",
  },
];

const toNumber = (value: string) => {
  const n = Number(value);
  return value.trim() === "" || Number.isNaN(n) ? null : n;
};

/**
 * Close a run (spec section 6.1): every stop not yet finished needs a
 * decision, missed with a reason or rescheduled, before Close is enabled
 * (R17). Weighbridge tickets and odometer readings are optional in the
 * prototype; they show their variance against the estimates as you type.
 */
export function CloseRunSheet({
  plan,
  onOpenChange,
  onClose,
}: {
  plan: RoutePlan | null;
  onOpenChange: (open: boolean) => void;
  onClose: (routeId: string, input: CloseRunInput) => void;
}) {
  return (
    <Sheet open={plan !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {plan ? (
          <CloseRunBody
            key={plan.route.id}
            plan={plan}
            onCancel={() => onOpenChange(false)}
            onClose={(input) => {
              onClose(plan.route.id, input);
              onOpenChange(false);
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CloseRunBody({
  plan,
  onCancel,
  onClose,
}: {
  plan: RoutePlan;
  onCancel: () => void;
  onClose: (input: CloseRunInput) => void;
}) {
  const id = useId();
  const directory = useDirectory();
  const masters = useOpsMasters().data;
  const { route, template, load } = plan;

  const open = plan.stops.filter((a) => !RESOLVED_STATUSES.includes(a.status));
  const done = plan.stops.filter((a) => a.status === "completed").length;
  const [choices, setChoices] = useState<Record<string, string>>({});

  // One ticket per facility the run tipped at; else the Route's sites.
  const facilities = [
    ...new Set(
      route.tippingTrips.length
        ? route.tippingTrips.map((t) => t.facility)
        : (template?.disposalSiteIds ?? []).flatMap(
            (sid) =>
              masters?.disposalSites.find((s) => s.id === sid)?.name ?? [],
          ),
    ),
  ];
  const [tickets, setTickets] = useState<
    Record<string, { ticket: string; netKg: string }>
  >({});
  const [odometerOut, setOdometerOut] = useState("");
  const [odometerIn, setOdometerIn] = useState("");
  const [note, setNote] = useState("");

  const unresolved = open.filter((a) => !choices[a.id]).length;
  const estimatedKg =
    load?.actual.limits.find((l) => l.kind === "weight")?.consumed ?? 0;
  const weighedKg = Object.values(tickets).reduce(
    (sum, t) => sum + (toNumber(t.netKg) ?? 0),
    0,
  );
  const out = toNumber(odometerOut);
  const back = toNumber(odometerIn);
  const driven =
    out !== null && back !== null && back >= out ? back - out : null;

  const submit = () => {
    const resolutions: Record<string, StopResolution> = {};
    for (const apt of open) {
      const choice = choices[apt.id];
      resolutions[apt.id] =
        choice === RESCHEDULE
          ? { outcome: "rescheduled" }
          : { outcome: "missed", reason: choice as FailedReason };
    }
    onClose({
      resolutions,
      odometerOut: out,
      odometerIn: back,
      tipTickets: facilities.flatMap((facility) => {
        const t = tickets[facility];
        return t?.ticket.trim()
          ? [{ facility, ticket: t.ticket.trim(), netKg: toNumber(t.netKg) }]
          : [];
      }),
      note: note.trim(),
    });
  };

  return (
    <>
      <SheetHeader className="border-b pe-12">
        <SheetTitle>Close {route.name}</SheetTitle>
        <SheetDescription>
          {template?.code ?? route.id} · {done} of {plan.activeStops} stops
          completed. Closing locks the actuals; corrections afterwards are dated
          adjustments.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-4">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Stops to resolve{" "}
            <span className="text-muted-foreground font-normal">
              ({open.length})
            </span>
          </h3>
          {open.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Every stop is completed, missed or cancelled.
            </p>
          ) : (
            <ul className="space-y-2">
              {open.map((apt) => {
                const customer = directory.customer(apt.customerId)?.name;
                const site = directory.servicePoint(apt.servicePointId);
                return (
                  <li
                    key={apt.id}
                    className={cn(
                      "rounded-lg border p-2.5",
                      choices[apt.id]
                        ? "border-border"
                        : "border-warning/50 bg-warning-bg/30",
                    )}
                  >
                    <p className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate font-medium">
                        {customer ?? apt.ref}
                      </span>
                      <span className="text-muted-foreground shrink-0 font-mono text-xs">
                        {apt.ref} · {APPOINTMENT_STATUS[apt.status].label}
                      </span>
                    </p>
                    <p className="text-muted-foreground mb-2 truncate text-xs">
                      {site?.location}
                    </p>
                    <Combobox
                      size="sm"
                      aria-label={`Resolve ${apt.ref}`}
                      placeholder="Missed or reschedule…"
                      options={RESOLUTION_OPTIONS}
                      value={choices[apt.id] ?? ""}
                      onValueChange={(v) =>
                        setChoices((c) => ({ ...c, [apt.id]: v }))
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Weighbridge tickets{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </h3>
          {facilities.map((facility) => (
            <div key={facility} className="grid grid-cols-[1fr_7rem] gap-2">
              <Field label={facility} htmlFor={`${id}-${facility}-ticket`}>
                <Input
                  id={`${id}-${facility}-ticket`}
                  placeholder="Ticket no."
                  value={tickets[facility]?.ticket ?? ""}
                  onChange={(e) =>
                    setTickets((t) => ({
                      ...t,
                      [facility]: {
                        ticket: e.target.value,
                        netKg: t[facility]?.netKg ?? "",
                      },
                    }))
                  }
                />
              </Field>
              <Field label="Net kg" htmlFor={`${id}-${facility}-kg`}>
                <Input
                  id={`${id}-${facility}-kg`}
                  inputMode="numeric"
                  placeholder="0"
                  value={tickets[facility]?.netKg ?? ""}
                  onChange={(e) =>
                    setTickets((t) => ({
                      ...t,
                      [facility]: {
                        ticket: t[facility]?.ticket ?? "",
                        netKg: e.target.value,
                      },
                    }))
                  }
                />
              </Field>
            </div>
          ))}
          <p className="text-muted-foreground text-xs">
            Recorded on the stops: {formatKg(estimatedKg)}
            {weighedKg > 0
              ? ` · weighbridge ${formatKg(weighedKg)} (${weighedKg >= estimatedKg ? "+" : ""}${formatKg(weighedKg - estimatedKg)})`
              : ""}
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">
            Odometer{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Out (km)" htmlFor={`${id}-odo-out`}>
              <Input
                id={`${id}-odo-out`}
                inputMode="numeric"
                value={odometerOut}
                onChange={(e) => setOdometerOut(e.target.value)}
              />
            </Field>
            <Field label="In (km)" htmlFor={`${id}-odo-in`}>
              <Input
                id={`${id}-odo-in`}
                inputMode="numeric"
                value={odometerIn}
                onChange={(e) => setOdometerIn(e.target.value)}
              />
            </Field>
          </div>
          <p className="text-muted-foreground text-xs">
            Planned {route.estimatedKm} km
            {driven !== null
              ? ` · driven ${driven} km (${driven >= route.estimatedKm ? "+" : ""}${Math.round(driven - route.estimatedKm)} km)`
              : ""}
          </p>
        </section>

        <Field label="Note" htmlFor={`${id}-note`}>
          <Textarea
            id={`${id}-note`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything billing or the planner should know."
          />
        </Field>
      </div>

      <SheetFooter className="mt-auto flex-row items-center justify-between border-t">
        <p className="text-muted-foreground text-xs">
          {unresolved
            ? `${unresolved} ${unresolved === 1 ? "stop needs" : "stops need"} a decision`
            : "Ready to close"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={unresolved > 0} onClick={submit}>
            <Lock data-icon="inline-start" />
            Close run
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

/** A dated correction to a closed run (R18): the run itself stays as closed. */
export function AdjustmentDialog({
  plan,
  onOpenChange,
  onAdd,
}: {
  plan: RoutePlan | null;
  onOpenChange: (open: boolean) => void;
  onAdd: (routeId: string, note: string) => void;
}) {
  const id = useId();
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={plan !== null}
      onOpenChange={(open) => {
        if (!open) setNote("");
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an adjustment</DialogTitle>
          <DialogDescription>
            {plan?.route.name} is closed, so its record isn't edited. The
            adjustment is dated and kept with the run for billing.
          </DialogDescription>
        </DialogHeader>
        <Field label="What changed" htmlFor={`${id}-note`}>
          <Textarea
            id={`${id}-note`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Weighbridge ticket WB-88213 arrived: net 4,120 kg, not 3,900."
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!note.trim()}
            onClick={() => {
              if (!plan) return;
              onAdd(plan.route.id, note.trim());
              setNote("");
              onOpenChange(false);
            }}
          >
            Add adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
