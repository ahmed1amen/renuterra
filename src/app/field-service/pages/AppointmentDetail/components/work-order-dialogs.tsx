"use client";

import { Camera } from "lucide-react";
import { useId, useState } from "react";
import { StreamTag } from "@/components/shared";
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
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { outcomeFor, useDirectory } from "@/features/field-service";
import type {
  ServiceItem,
  ShortfallReason,
  WeightSource,
  WorkOrder,
  WorkOrderEvidence,
} from "@/mocks";
import {
  ChoiceChips,
  DISPOSAL_FACILITIES,
  Field,
  formatCountUnit,
  HANDLING_METHOD,
  SHORTFALL_REASON,
  unitLabel,
  WEIGHT_SOURCE,
  WorkOrderStatusPill,
} from "../../../components";
import { formatKg } from "../../../utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FILL_LEVELS = [
  { id: "25", label: "¼" },
  { id: "50", label: "½" },
  { id: "75", label: "¾" },
  { id: "100", label: "Full" },
  { id: "120", label: "Overflowing" },
] as const;
type FillLevel = (typeof FILL_LEVELS)[number]["id"];

let fakeSeq = 9100;
const nextNumber = () => fakeSeq++;

/** What the service pro's app would have pre-filled: one seal per unit. */
function fakeSeals(count: number) {
  const start = 300000 + nextNumber() * 10;
  return Array.from({ length: count }, (_, i) => `SL-${start + i}`).join("\n");
}

/**
 * Close out one work order on site. The fields follow the item's handling
 * method — lifted bins for empty-on-site, weighbridge ticket for an exchange,
 * seals and a consignment note for packaged waste — and the outcome
 * (completed / partial / not done) follows from what was done.
 *
 * Prototype-grade: values are pre-filled as the service pro's app would send
 * them; nothing is validated beyond "a shortfall needs a reason".
 */
export function RecordWorkOrderDialog({
  open,
  onOpenChange,
  workOrder: wo,
  item,
  at,
  onConfirm,
}: DialogProps & {
  workOrder: WorkOrder;
  item: ServiceItem | undefined;
  /** When the record is made — closes the work order. */
  at: string;
  onConfirm: (changes: Partial<WorkOrder>) => void;
}) {
  const id = useId();
  const directory = useDirectory();
  const containers = wo.containerIds.map((cid) => ({
    id: cid,
    tag: directory.container(cid)?.tag ?? cid,
  }));
  const kgPerUnit = item?.estKgPerUnit ?? wo.weightEstKg / wo.countPlanned;

  // empty-on-site: tick the bins that were lifted.
  const [lifted, setLifted] = useState<string[]>(wo.containerIds);
  const [count, setCount] = useState(String(wo.countPlanned));
  const [fill, setFill] = useState<FillLevel>("75");
  const [contamination, setContamination] = useState(false);
  // exchange
  const [containerOut, setContainerOut] = useState(containers[0]?.tag ?? "");
  const [returned, setReturned] = useState(true);
  const [ticket, setTicket] = useState(() => `WB-${78000 + nextNumber()}`);
  const [facility, setFacility] = useState(DISPOSAL_FACILITIES[0]);
  // packaged / destruction / pump-out
  const [seals, setSeals] = useState(() =>
    item?.requiresSeals && wo.method === "packaged"
      ? fakeSeals(wo.countPlanned)
      : "",
  );
  const [consignment, setConsignment] = useState(
    () =>
      `${wo.method === "pump-out" ? "MF" : "CN"}-2026-0${6000 + nextNumber()}`,
  );
  const [empties, setEmpties] = useState(String(wo.countPlanned));
  const [weight, setWeight] = useState(String(wo.weightEstKg || ""));
  const [reason, setReason] = useState<ShortfallReason | "">("");

  const usesChecklist = wo.method === "empty-on-site" && containers.length > 0;
  const done = usesChecklist ? lifted.length : Number(count) || 0;
  const outcome = outcomeFor(done, wo.countPlanned);
  const needsReason = outcome !== "completed";

  // Weight: bins and pump-outs derive it, everything else is weighed.
  const derivedWeight =
    wo.method === "empty-on-site" || wo.method === "pump-out";
  const weightKg = derivedWeight
    ? Math.round(done * kgPerUnit * 10) / 10
    : Number(weight) || 0;
  const weightSource: WeightSource | null =
    wo.method === "logistics"
      ? null
      : wo.method === "empty-on-site"
        ? "estimated"
        : (item?.weightSource ?? "scale");

  function confirm() {
    const evidence: WorkOrderEvidence = { photos: done > 0 ? 2 : 1 };
    if (done > 0) {
      if (wo.method === "empty-on-site") {
        evidence.fillLevelPct = Number(fill);
        evidence.contamination = contamination;
      }
      if (wo.method === "exchange") {
        evidence.containerOut = containerOut || undefined;
        evidence.containerIn = returned ? containerOut : undefined;
        evidence.weighbridgeTicket = ticket;
        evidence.facility = facility;
      }
      if (item?.requiresSeals) {
        evidence.seals = seals
          .split(/[\s,]+/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (item?.requiresConsignmentNote) evidence.consignmentNote = consignment;
      if (item?.consumable) evidence.consumablesLeft = Number(empties) || 0;
    }
    onConfirm({
      status: outcome,
      countDone: done,
      weightKg: weightSource ? weightKg : null,
      weightSource,
      // The bins actually lifted, so their last-serviced date can move on.
      containerIds: usesChecklist ? lifted : wo.containerIds,
      startedAt: wo.startedAt ?? at,
      completedAt: at,
      reason: needsReason && reason ? reason : null,
      evidence,
    });
  }

  const method = HANDLING_METHOD[wo.method];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record {wo.ref}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            {wo.itemName}
            <StreamTag stream={wo.stream} />
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          <p className="bg-muted text-muted-foreground rounded-md p-2.5 text-xs">
            <span className="text-foreground font-medium">{method.label}.</span>{" "}
            {method.description}
          </p>

          {usesChecklist ? (
            <Field
              label={`Containers lifted (${lifted.length} of ${containers.length})`}
            >
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {containers.map((c) => {
                  const checked = lifted.includes(c.id);
                  return (
                    <li key={c.id}>
                      <Label className="hover:bg-muted flex items-center gap-2 rounded-md border px-2 py-1.5 font-mono text-xs font-normal">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) =>
                            setLifted((prev) =>
                              next
                                ? [...prev, c.id]
                                : prev.filter((x) => x !== c.id),
                            )
                          }
                        />
                        {c.tag}
                      </Label>
                    </li>
                  );
                })}
              </ul>
            </Field>
          ) : (
            <Field
              label={`Done (${unitLabel(wo.countUnit)})`}
              htmlFor={`${id}-count`}
              hint={`Planned ${formatCountUnit(wo.countPlanned, wo.countUnit)}`}
            >
              <Input
                id={`${id}-count`}
                type="number"
                min={0}
                className="w-32"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </Field>
          )}

          {wo.method === "empty-on-site" && done > 0 ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label="Average fill level">
                <ChoiceChips
                  label="Average fill level"
                  options={[...FILL_LEVELS]}
                  value={fill}
                  onChange={setFill}
                />
              </Field>
              <Field label="Contamination" htmlFor={`${id}-contam`}>
                <Switch
                  id={`${id}-contam`}
                  checked={contamination}
                  onCheckedChange={setContamination}
                />
              </Field>
            </div>
          ) : null}

          {wo.method === "exchange" && done > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Container taken" htmlFor={`${id}-out`}>
                  <NativeSelect
                    id={`${id}-out`}
                    className="w-full"
                    value={containerOut}
                    onChange={(e) => setContainerOut(e.target.value)}
                  >
                    {containers.map((c) => (
                      <NativeSelectOption key={c.id} value={c.tag}>
                        {c.tag}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Same container returned" htmlFor={`${id}-ret`}>
                  <Switch
                    id={`${id}-ret`}
                    checked={returned}
                    onCheckedChange={setReturned}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Facility" htmlFor={`${id}-facility`}>
                  <NativeSelect
                    id={`${id}-facility`}
                    className="w-full"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                  >
                    {DISPOSAL_FACILITIES.map((f) => (
                      <NativeSelectOption key={f} value={f}>
                        {f}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Weighbridge ticket" htmlFor={`${id}-ticket`}>
                  <Input
                    id={`${id}-ticket`}
                    value={ticket}
                    onChange={(e) => setTicket(e.target.value)}
                  />
                </Field>
              </div>
            </>
          ) : null}

          {item?.requiresSeals && done > 0 ? (
            <Field
              label="Seal numbers"
              htmlFor={`${id}-seals`}
              hint="One per line, scanned from each unit."
            >
              <Textarea
                id={`${id}-seals`}
                rows={3}
                className="font-mono text-xs"
                value={seals}
                onChange={(e) => setSeals(e.target.value)}
              />
            </Field>
          ) : null}

          {done > 0 && (item?.requiresConsignmentNote || item?.consumable) ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {item?.requiresConsignmentNote ? (
                <Field
                  label={
                    wo.method === "pump-out" ? "Manifest" : "Consignment note"
                  }
                  htmlFor={`${id}-cn`}
                >
                  <Input
                    id={`${id}-cn`}
                    value={consignment}
                    onChange={(e) => setConsignment(e.target.value)}
                  />
                </Field>
              ) : null}
              {item?.consumable ? (
                <Field
                  label={`Empties left (${item.consumable.toLowerCase()})`}
                  htmlFor={`${id}-empties`}
                >
                  <Input
                    id={`${id}-empties`}
                    type="number"
                    min={0}
                    className="w-32"
                    value={empties}
                    onChange={(e) => setEmpties(e.target.value)}
                  />
                </Field>
              ) : null}
            </div>
          ) : null}

          {weightSource && done > 0 ? (
            derivedWeight ? (
              <p className="text-sm">
                <span className="text-muted-foreground">Weight: </span>
                <span className="font-mono tabular-nums">
                  {formatKg(weightKg)}
                </span>{" "}
                <span className="text-muted-foreground text-xs">
                  —{" "}
                  {wo.method === "pump-out"
                    ? "from the tanker meter."
                    : "estimated now; replaced by the route's weighbridge ticket."}
                </span>
              </p>
            ) : (
              <Field
                label={`Net weight (kg) — ${WEIGHT_SOURCE[weightSource].label.toLowerCase()}`}
                htmlFor={`${id}-kg`}
                hint={`Estimate ${formatKg(wo.weightEstKg)}`}
              >
                <Input
                  id={`${id}-kg`}
                  type="number"
                  min={0}
                  step="any"
                  className="w-32"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </Field>
            )
          ) : null}

          {needsReason ? (
            <Field
              label={outcome === "partial" ? "Why not all of it?" : "Why not?"}
              htmlFor={`${id}-reason`}
            >
              <NativeSelect
                id={`${id}-reason`}
                className="w-full"
                value={reason}
                onChange={(e) => setReason(e.target.value as ShortfallReason)}
              >
                <NativeSelectOption value="">
                  Select a reason…
                </NativeSelectOption>
                {(Object.keys(SHORTFALL_REASON) as ShortfallReason[]).map(
                  (r) => (
                    <NativeSelectOption key={r} value={r}>
                      {SHORTFALL_REASON[r]}
                    </NativeSelectOption>
                  ),
                )}
              </NativeSelect>
            </Field>
          ) : null}

          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Camera className="size-3.5" aria-hidden />
            Photos are attached from the service pro's app.
          </p>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Outcome</span>
            <WorkOrderStatusPill status={outcome} />
          </span>
          <span className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Back
            </Button>
            <Button disabled={needsReason && !reason} onClick={confirm}>
              Save
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Add a work order to the visit — planned, or picked up on site. */
export function AddWorkOrderDialog({
  open,
  onOpenChange,
  items,
  onSite,
  onConfirm,
}: DialogProps & {
  /** Active catalogue items. */
  items: ServiceItem[];
  onSite: boolean;
  onConfirm: (item: ServiceItem, count: number) => void;
}) {
  const id = useId();
  const [itemId, setItemId] = useState("");
  const [count, setCount] = useState("1");
  const item = items.find((i) => i.id === itemId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add work order</DialogTitle>
          <DialogDescription>
            {onSite
              ? "Extra work found on site. It's flagged for approval before billing."
              : "Plan more work on this visit."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Service item" htmlFor={`${id}-item`}>
            <NativeSelect
              id={`${id}-item`}
              className="w-full"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <NativeSelectOption value="">
                Select a service item…
              </NativeSelectOption>
              {items.map((i) => (
                <NativeSelectOption key={i.id} value={i.id}>
                  {i.code} — {i.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          {item ? (
            <Field
              label={`How many (${unitLabel(item.countUnit)})`}
              htmlFor={`${id}-count`}
              hint={`${HANDLING_METHOD[item.method].label} · est. ${formatKg(
                (Number(count) || 0) * item.estKgPerUnit,
              )}`}
            >
              <Input
                id={`${id}-count`}
                type="number"
                min={1}
                className="w-32"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            disabled={!item || !(Number(count) > 0)}
            onClick={() => item && onConfirm(item, Number(count))}
          >
            Add work order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
