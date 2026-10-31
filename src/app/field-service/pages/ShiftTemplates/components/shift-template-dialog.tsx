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
import {
  NEW_TEMPLATE_PREFIX,
  useShiftTemplateStore,
} from "@/features/field-service";
import type { ShiftTemplate, ShiftType } from "@/mocks";
import {
  Field,
  formatShiftWindow,
  SHIFT_TYPE,
  SHIFT_TYPE_ORDER,
  shiftHours,
} from "../../../components";

/** Leave isn't a working window, so it has no template. */
const TEMPLATE_TYPE_OPTIONS: ComboboxOption[] = SHIFT_TYPE_ORDER.filter(
  (t) => t !== "leave",
).map((t) => ({ value: t, label: SHIFT_TYPE[t].label }));

/**
 * Add or edit a shift template. Saves into the page's session store only.
 * Mount with a `key` per open so the form resets.
 */
export function ShiftTemplateDialog({
  template,
  open,
  onOpenChange,
}: {
  /** `null` for a new template. */
  template: ShiftTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const save = useShiftTemplateStore((s) => s.save);
  const [name, setName] = useState(template?.name ?? "");
  const [type, setType] = useState<ShiftType>(template?.type ?? "morning");
  const [start, setStart] = useState(template?.startTime ?? "06:00");
  const [end, setEnd] = useState(template?.endTime ?? "14:00");
  const [active, setActive] = useState(template?.active ?? true);

  const draft = { type, startTime: start, endTime: end };
  const overnight = Boolean(start && end && end < start);

  function submit() {
    save({
      id: template?.id ?? `${NEW_TEMPLATE_PREFIX}${Date.now()}`,
      name: name.trim(),
      type,
      startTime: start,
      endTime: end,
      active,
    });
    toast.success(
      template ? `${name.trim()} updated` : `${name.trim()} added`,
      {
        description: "Prototype: saved for this session only.",
      },
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit shift template" : "New shift template"}
          </DialogTitle>
          <DialogDescription>
            A reusable daily window that default schedules and Autofill create
            shifts from.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field label="Name" htmlFor={`${id}-name`}>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Day early"
            />
          </Field>
          <Field label="Type" htmlFor={`${id}-type`}>
            <Combobox
              id={`${id}-type`}
              options={TEMPLATE_TYPE_OPTIONS}
              value={type}
              onValueChange={(v) => setType(v as ShiftType)}
            />
          </Field>
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" htmlFor={`${id}-start`}>
                <Input
                  id={`${id}-start`}
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="tabular-nums"
                />
              </Field>
              <Field label="End" htmlFor={`${id}-end`}>
                <Input
                  id={`${id}-end`}
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="tabular-nums"
                />
              </Field>
            </div>
            {start && end ? (
              <p className="text-muted-foreground text-xs">
                {formatShiftWindow(draft)} · {shiftHours(draft)} h
                {overnight ? " · Overnight: ends the next morning." : null}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
            <div>
              <Label htmlFor={`${id}-active`}>Active</Label>
              <p className="text-muted-foreground text-xs">
                {active
                  ? "Can be picked in default schedules and on the shift board."
                  : "Hidden from pickers; existing shifts keep their hours."}
              </p>
            </div>
            <Switch
              id={`${id}-active`}
              checked={active}
              onCheckedChange={setActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !start || !end}>
            {template ? "Save changes" : "Add template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
