"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { WASTE_STREAMS } from "@/components/shared";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  type ServiceItemInput,
  useCatalogStore,
  useContainerTypes,
} from "@/features/field-service";
import type {
  CountUnit,
  HandlingMethod,
  ServiceItem,
  VehicleClass,
  WasteStreamId,
  WeightSource,
} from "@/mocks";
import {
  Field,
  HANDLING_METHOD,
  HANDLING_METHOD_ORDER,
  unitLabel,
  VEHICLE_CLASS,
  WEIGHT_SOURCE,
} from "../../../components";

const COUNT_UNITS: CountUnit[] = [
  "lift",
  "trip",
  "bag",
  "box",
  "drum",
  "litre",
  "container",
  "kg",
];

const STREAM_OPTIONS: ComboboxOption[] = WASTE_STREAMS.map((s) => ({
  value: s.id,
  label: s.label,
}));

const METHOD_OPTIONS: ComboboxOption[] = HANDLING_METHOD_ORDER.map((m) => ({
  value: m,
  label: HANDLING_METHOD[m].label,
}));

const UNIT_OPTIONS: ComboboxOption[] = COUNT_UNITS.map((u) => ({
  value: u,
  label: unitLabel(u),
}));

const VEHICLE_OPTIONS: ComboboxOption[] = (
  Object.keys(VEHICLE_CLASS) as VehicleClass[]
).map((v) => ({ value: v, label: VEHICLE_CLASS[v] }));

const WEIGHT_OPTIONS: ComboboxOption[] = [
  { value: "", label: "Not weighed" },
  ...(Object.keys(WEIGHT_SOURCE) as WeightSource[]).map((w) => ({
    value: w,
    label: WEIGHT_SOURCE[w].label,
  })),
];

const BLANK: ServiceItemInput = {
  code: "",
  name: "",
  stream: "general",
  method: "empty-on-site",
  containerTypeId: null,
  countUnit: "lift",
  estKgPerUnit: 0,
  minutesPerUnit: 0,
  vehicleClass: "compactor",
  weightSource: "estimated",
  requiresSeals: false,
  requiresConsignmentNote: false,
  consumable: null,
  wasteCode: null,
  active: true,
};

/**
 * Add or edit one service item. `item: null` opens it empty. Mount with a
 * `key` per item so the form resets between rows.
 *
 * Prototype-grade: saves go to the session catalogue store, and the only
 * check is that code and name aren't blank.
 */
export function ServiceItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ServiceItem | null;
}) {
  const id = useId();
  const containerTypes = useContainerTypes();
  const add = useCatalogStore((s) => s.add);
  const update = useCatalogStore((s) => s.update);
  const containerOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "", label: "No container" },
      ...(containerTypes.data ?? []).map((ct) => ({
        value: ct.id,
        label: ct.name,
      })),
    ],
    [containerTypes.data],
  );

  const initial = item ?? BLANK;
  const [form, setForm] = useState<ServiceItemInput>(initial);
  const [estKg, setEstKg] = useState(item ? String(initial.estKgPerUnit) : "");
  const [minutes, setMinutes] = useState(
    item ? String(initial.minutesPerUnit) : "",
  );

  const set = <K extends keyof ServiceItemInput>(
    key: K,
    value: ServiceItemInput[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const canSave = form.code.trim() !== "" && form.name.trim() !== "";

  function save() {
    const values: ServiceItemInput = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      consumable: form.consumable?.trim() || null,
      estKgPerUnit: Number(estKg) || 0,
      minutesPerUnit: Number(minutes) || 0,
    };
    if (item) {
      update(item.id, values);
      toast.success(`${values.code} saved`, { description: values.name });
    } else {
      add(values);
      toast.success(`${values.code} added to the catalogue`, {
        description: values.name,
      });
    }
    onOpenChange(false);
  }

  const method = HANDLING_METHOD[form.method];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? `Edit ${item.code}` : "New service item"}
          </DialogTitle>
          <DialogDescription>
            What a contract line sells and a work order performs. Changes apply
            to future work orders only.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-[12rem_1fr] gap-3">
            <Field label="Code" htmlFor={`${id}-code`}>
              <Input
                id={`${id}-code`}
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="REL-1100-GEN"
                className="font-mono"
              />
            </Field>
            <Field label="Name" htmlFor={`${id}-name`}>
              <Input
                id={`${id}-name`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="1100L general waste lift"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Stream" htmlFor={`${id}-stream`}>
              <Combobox
                id={`${id}-stream`}
                options={STREAM_OPTIONS}
                value={form.stream}
                onValueChange={(v) => set("stream", v as WasteStreamId)}
              />
            </Field>
            <Field label="Container type" htmlFor={`${id}-container`}>
              <Combobox
                id={`${id}-container`}
                options={containerOptions}
                value={form.containerTypeId ?? ""}
                placeholder="No container"
                disabled={containerTypes.isPending}
                onValueChange={(v) => set("containerTypeId", v || null)}
              />
            </Field>
          </div>

          <Field label="Handling method" htmlFor={`${id}-method`}>
            <Combobox
              id={`${id}-method`}
              options={METHOD_OPTIONS}
              value={form.method}
              onValueChange={(v) => set("method", v as HandlingMethod)}
            />
            <p className="bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-2.5 text-xs">
              <method.icon className="mt-px size-3.5 shrink-0" aria-hidden />
              {method.description}
            </p>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Counted in" htmlFor={`${id}-unit`}>
              <Combobox
                id={`${id}-unit`}
                options={UNIT_OPTIONS}
                value={form.countUnit}
                onValueChange={(v) => set("countUnit", v as CountUnit)}
              />
            </Field>
            <Field
              label="Est. kg per unit"
              htmlFor={`${id}-kg`}
              hint="Planning estimate until weighed."
            >
              <Input
                id={`${id}-kg`}
                type="number"
                min={0}
                step="0.1"
                value={estKg}
                onChange={(e) => setEstKg(e.target.value)}
                className="tabular-nums"
              />
            </Field>
            <Field
              label="Minutes per unit"
              htmlFor={`${id}-mins`}
              hint="Feeds appointment duration."
            >
              <Input
                id={`${id}-mins`}
                type="number"
                min={0}
                step="0.5"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="tabular-nums"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle" htmlFor={`${id}-vehicle`}>
              <Combobox
                id={`${id}-vehicle`}
                options={VEHICLE_OPTIONS}
                value={form.vehicleClass}
                onValueChange={(v) => set("vehicleClass", v as VehicleClass)}
              />
            </Field>
            <Field
              label="Weight from"
              htmlFor={`${id}-weight`}
              hint={
                form.weightSource
                  ? WEIGHT_SOURCE[form.weightSource].description
                  : "Nothing is weighed, e.g. container logistics."
              }
            >
              <Combobox
                id={`${id}-weight`}
                options={WEIGHT_OPTIONS}
                value={form.weightSource ?? ""}
                placeholder="Not weighed"
                onValueChange={(v) =>
                  set("weightSource", (v || null) as WeightSource | null)
                }
              />
            </Field>
          </div>

          <Field
            label="Consumable"
            htmlFor={`${id}-consumable`}
            hint="Left behind on each service. Leave blank if none."
          >
            <Input
              id={`${id}-consumable`}
              value={form.consumable ?? ""}
              onChange={(e) => set("consumable", e.target.value)}
              placeholder="Yellow bag"
            />
          </Field>

          <div className="divide-border grid divide-y rounded-lg border">
            <SwitchRow
              id={`${id}-seals`}
              label="Requires seals"
              hint="Each unit carries a numbered seal."
              checked={form.requiresSeals}
              onChange={(v) => set("requiresSeals", v)}
            />
            <SwitchRow
              id={`${id}-cn`}
              label="Requires consignment note"
              hint="A consignment note travels with the waste (chain of custody)."
              checked={form.requiresConsignmentNote}
              onChange={(v) => set("requiresConsignmentNote", v)}
            />
            <SwitchRow
              id={`${id}-active`}
              label="Active"
              hint="Archived items can't be added to new contract lines."
              checked={form.active}
              onChange={(v) => set("active", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {item ? "Save changes" : "Add service item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
