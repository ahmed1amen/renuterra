"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { WASTE_STREAMS } from "@/components/shared";
import { Button } from "@/components/ui/button";
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
              <NativeSelect
                id={`${id}-stream`}
                className="w-full"
                value={form.stream}
                onChange={(e) => set("stream", e.target.value as WasteStreamId)}
              >
                {WASTE_STREAMS.map((s) => (
                  <NativeSelectOption key={s.id} value={s.id}>
                    {s.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Container type" htmlFor={`${id}-container`}>
              <NativeSelect
                id={`${id}-container`}
                className="w-full"
                value={form.containerTypeId ?? ""}
                disabled={containerTypes.isPending}
                onChange={(e) => set("containerTypeId", e.target.value || null)}
              >
                <NativeSelectOption value="">No container</NativeSelectOption>
                {(containerTypes.data ?? []).map((ct) => (
                  <NativeSelectOption key={ct.id} value={ct.id}>
                    {ct.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field label="Handling method" htmlFor={`${id}-method`}>
            <NativeSelect
              id={`${id}-method`}
              className="w-full"
              value={form.method}
              onChange={(e) => set("method", e.target.value as HandlingMethod)}
            >
              {HANDLING_METHOD_ORDER.map((m) => (
                <NativeSelectOption key={m} value={m}>
                  {HANDLING_METHOD[m].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="bg-muted text-muted-foreground flex items-start gap-2 rounded-md p-2.5 text-xs">
              <method.icon className="mt-px size-3.5 shrink-0" aria-hidden />
              {method.description}
            </p>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Counted in" htmlFor={`${id}-unit`}>
              <NativeSelect
                id={`${id}-unit`}
                className="w-full"
                value={form.countUnit}
                onChange={(e) => set("countUnit", e.target.value as CountUnit)}
              >
                {COUNT_UNITS.map((u) => (
                  <NativeSelectOption key={u} value={u}>
                    {unitLabel(u)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
              <NativeSelect
                id={`${id}-vehicle`}
                className="w-full"
                value={form.vehicleClass}
                onChange={(e) =>
                  set("vehicleClass", e.target.value as VehicleClass)
                }
              >
                {(Object.keys(VEHICLE_CLASS) as VehicleClass[]).map((v) => (
                  <NativeSelectOption key={v} value={v}>
                    {VEHICLE_CLASS[v]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
              <NativeSelect
                id={`${id}-weight`}
                className="w-full"
                value={form.weightSource ?? ""}
                onChange={(e) =>
                  set(
                    "weightSource",
                    (e.target.value || null) as WeightSource | null,
                  )
                }
              >
                <NativeSelectOption value="">Not weighed</NativeSelectOption>
                {(Object.keys(WEIGHT_SOURCE) as WeightSource[]).map((w) => (
                  <NativeSelectOption key={w} value={w}>
                    {WEIGHT_SOURCE[w].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
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
