"use client";

import { useId, useState } from "react";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Appointment, ArrivalWindow } from "@/mocks";
import { ChoiceChips, Field, WINDOW_LABEL } from "../../../components";
import { addDays, TODAY, toDayKey, toDubaiDayKey } from "../../../utils";

const WINDOWS = (Object.keys(WINDOW_LABEL) as ArrivalWindow[]).map((id) => ({
  id,
  label: WINDOW_LABEL[id],
}));

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Pick a reason (and an optional note) to close out a visit — cancel or report
 * a failed visit. "Other" requires a note.
 */
export function ReasonDialog<R extends string>({
  open,
  onOpenChange,
  title,
  description,
  reasons,
  confirmLabel,
  destructive = false,
  onConfirm,
}: DialogProps & {
  title: string;
  description: string;
  reasons: Record<R, string>;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (reason: R, note: string) => void;
}) {
  const id = useId();
  const [reason, setReason] = useState<R | "">("");
  const [note, setNote] = useState("");
  const needsNote = reason === "other" && !note.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Reason" htmlFor={`${id}-reason`}>
            <NativeSelect
              id={`${id}-reason`}
              className="w-full"
              value={reason}
              onChange={(e) => setReason(e.target.value as R)}
            >
              <NativeSelectOption value="">Select a reason…</NativeSelectOption>
              {(Object.keys(reasons) as R[]).map((r) => (
                <NativeSelectOption key={r} value={r}>
                  {reasons[r]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field
            label="Note"
            htmlFor={`${id}-note`}
            hint={
              reason === "other"
                ? "Required when the reason is Other."
                : undefined
            }
          >
            <Textarea
              id={`${id}-note`}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What happened? This is shared with the customer team."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!reason || needsNote}
            onClick={() => reason && onConfirm(reason, note.trim())}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Move a visit to another day and/or arrival window. */
export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: DialogProps & {
  appointment: Appointment;
  onConfirm: (day: string, window: ArrivalWindow, note: string) => void;
}) {
  const id = useId();
  const current = toDubaiDayKey(appointment.windowStart);
  const [day, setDay] = useState(
    current > toDayKey(TODAY) ? current : toDayKey(addDays(TODAY, 1)),
  );
  const [arrivalWindow, setArrivalWindow] = useState<ArrivalWindow>(
    appointment.window,
  );
  const [note, setNote] = useState("");
  const unchanged = day === current && arrivalWindow === appointment.window;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule {appointment.ref}</DialogTitle>
          <DialogDescription>
            The customer is notified of the new arrival window.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="New date" htmlFor={`${id}-day`}>
            <Input
              id={`${id}-day`}
              type="date"
              value={day}
              min={toDayKey(TODAY)}
              onChange={(e) => setDay(e.target.value)}
            />
          </Field>
          <Field label="Arrival window">
            <ChoiceChips
              label="Arrival window"
              options={WINDOWS}
              value={arrivalWindow}
              onChange={setArrivalWindow}
            />
          </Field>
          <Field label="Note" htmlFor={`${id}-note`}>
            <Textarea
              id={`${id}-note`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why it moved — e.g. customer asked for the afternoon."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            disabled={!day || unchanged}
            onClick={() => onConfirm(day, arrivalWindow, note.trim())}
          >
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Close out a visit by recording what was actually collected. */
export function CompleteDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: DialogProps & {
  appointment: Appointment;
  onConfirm: (actuals: number[]) => void;
}) {
  const id = useId();
  const [actuals, setActuals] = useState(
    appointment.workOrders.map((wo) => String(wo.quantityPlanned)),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete {appointment.ref}</DialogTitle>
          <DialogDescription>
            Record the quantities collected. They feed the customer's monthly
            invoice and proof of service.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          {appointment.workOrders.map((wo, index) => (
            <Field
              key={wo.ref}
              label={`${wo.ref} · ${wo.serviceItem}`}
              htmlFor={`${id}-${wo.ref}`}
              hint={`Planned ${wo.quantityPlanned} ${wo.uom}`}
            >
              <span className="flex items-center gap-2">
                <Input
                  id={`${id}-${wo.ref}`}
                  type="number"
                  min={0}
                  step="any"
                  className="w-32"
                  value={actuals[index]}
                  onChange={(e) =>
                    setActuals((prev) =>
                      prev.map((v, i) => (i === index ? e.target.value : v)),
                    )
                  }
                />
                <span className="text-muted-foreground text-sm">{wo.uom}</span>
              </span>
            </Field>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            disabled={actuals.some((v) => v === "" || Number(v) < 0)}
            onClick={() => onConfirm(actuals.map(Number))}
          >
            Mark completed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
