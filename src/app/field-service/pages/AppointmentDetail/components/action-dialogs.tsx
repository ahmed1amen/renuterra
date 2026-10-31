"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Appointment, ArrivalWindow, RescheduleReason } from "@/mocks";
import {
  ChoiceChips,
  Field,
  RESCHEDULE_REASON,
  WINDOW_LABEL,
} from "../../../components";
import { addDays, TODAY, toDayKey, toDubaiDayKey } from "../../../utils";

const WINDOWS = (Object.keys(WINDOW_LABEL) as ArrivalWindow[]).map((id) => ({
  id,
  label: WINDOW_LABEL[id],
}));

const REASONS = (Object.keys(RESCHEDULE_REASON) as RescheduleReason[]).map(
  (id) => ({ id, label: RESCHEDULE_REASON[id] }),
);

const ASKED_BY = [
  { id: "customer" as const, label: "Customer" },
  { id: "operations" as const, label: "Operations" },
];

export type RescheduleInput = {
  day: string;
  window: ArrivalWindow;
  reason: RescheduleReason;
  requestedBy: "customer" | "operations";
  note: string;
};

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Pick a reason (and an optional note) to close out a visit: cancel or report
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
            <Combobox
              id={`${id}-reason`}
              options={(Object.keys(reasons) as R[]).map((r) => ({
                value: r,
                label: reasons[r],
              }))}
              value={reason}
              onValueChange={(v) => setReason(v as R)}
              placeholder="Select a reason…"
            />
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
  onConfirm: (input: RescheduleInput) => void;
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
  const [reason, setReason] = useState<RescheduleReason>("customer_request");
  const [requestedBy, setRequestedBy] = useState<"customer" | "operations">(
    "customer",
  );
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
          <Field label="Reason">
            <ChoiceChips
              label="Reason"
              options={REASONS}
              value={reason}
              onChange={(next) => {
                setReason(next);
                setRequestedBy(
                  next === "customer_request" ? "customer" : "operations",
                );
              }}
            />
          </Field>
          <Field label="Asked by">
            <ChoiceChips
              label="Asked by"
              options={ASKED_BY}
              value={requestedBy}
              onChange={setRequestedBy}
            />
          </Field>
          <Field label="Note" htmlFor={`${id}-note`}>
            <Textarea
              id={`${id}-note`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything else: e.g. call the site manager on arrival."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button
            disabled={!day || unchanged}
            onClick={() =>
              onConfirm({
                day,
                window: arrivalWindow,
                reason,
                requestedBy,
                note: note.trim(),
              })
            }
          >
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
