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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ContainerKind, VehicleClass } from "@/mocks";
import { CONTAINER_KIND, Field, VEHICLE_CLASS } from "../../../components";

/** Kinds that are normally consumables rather than tagged assets. */
const CONSUMABLE_KINDS: ContainerKind[] = ["bag", "sharps-box", "drum"];

const KIND_OPTIONS: ComboboxOption[] = (
  Object.keys(CONTAINER_KIND) as ContainerKind[]
).map((k) => ({ value: k, label: CONTAINER_KIND[k] }));

const VEHICLE_OPTIONS: ComboboxOption[] = (
  Object.keys(VEHICLE_CLASS) as VehicleClass[]
).map((v) => ({ value: v, label: VEHICLE_CLASS[v] }));

/**
 * Add a container type. Prototype-grade: nothing is stored, saving only
 * shows a toast. Mount with a `key` per open so the form resets.
 */
export function ContainerTypeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ContainerKind>("bin");
  const [capacity, setCapacity] = useState("");
  const [vehicle, setVehicle] = useState<VehicleClass>("compactor");
  const [tracked, setTracked] = useState(true);

  function changeKind(next: ContainerKind) {
    setKind(next);
    setTracked(!CONSUMABLE_KINDS.includes(next));
  }

  function save() {
    toast.success(`${name.trim()} added`, {
      description: "Prototype — container types aren't saved yet.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New container type</DialogTitle>
          <DialogDescription>
            A kind and size of container that service items can use.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label="Name" htmlFor={`${id}-name`}>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="1100L wheelie bin"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kind" htmlFor={`${id}-kind`}>
              <Combobox
                id={`${id}-kind`}
                options={KIND_OPTIONS}
                value={kind}
                onValueChange={(v) => changeKind(v as ContainerKind)}
              />
            </Field>
            <Field label="Capacity (litres)" htmlFor={`${id}-capacity`}>
              <Input
                id={`${id}-capacity`}
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="tabular-nums"
              />
            </Field>
          </div>
          <Field label="Vehicle" htmlFor={`${id}-vehicle`}>
            <Combobox
              id={`${id}-vehicle`}
              options={VEHICLE_OPTIONS}
              value={vehicle}
              onValueChange={(v) => setVehicle(v as VehicleClass)}
            />
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor={`${id}-tracked`}>Tagged asset</Label>
              <p className="text-muted-foreground text-xs">
                {tracked
                  ? "Each container gets a tag and is tracked per service point."
                  : "Consumable, counted per work order."}
              </p>
            </div>
            <Switch
              id={`${id}-tracked`}
              checked={tracked}
              onCheckedChange={setTracked}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!name.trim()}>
            Add container type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
