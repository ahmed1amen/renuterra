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
import { Textarea } from "@/components/ui/textarea";
import type { RunCancelReason } from "@/mocks";
import { ChoiceChips, Field, RUN_CANCEL_REASON } from "../../../components";

const REASONS = (Object.keys(RUN_CANCEL_REASON) as RunCancelReason[]).map(
  (id) => ({ id, label: RUN_CANCEL_REASON[id] }),
);

/** What is being cancelled: one run, or every cancellable run on the day. */
export type CancelTarget =
  | { kind: "run"; routeIds: [string]; name: string; openStops: number }
  | { kind: "day"; routeIds: string[]; dayLabel: string; openStops: number };

/**
 * Cancel one run, or every run on a day that hasn't started (e.g. a public
 * holiday, spec section 6.2 rule 5). The record is kept with its reason
 * (rule 8); open stops go back to the backlog for the dispatcher to place.
 */
export function CancelRunDialog({
  target,
  onOpenChange,
  onConfirm,
}: {
  target: CancelTarget | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    routeIds: string[],
    reason: RunCancelReason,
    note: string,
  ) => void;
}) {
  const id = useId();
  const [reason, setReason] = useState<RunCancelReason>(
    target?.kind === "day" ? "public_holiday" : "vehicle_breakdown",
  );
  const [note, setNote] = useState("");
  const runs = target?.routeIds.length ?? 0;

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) setNote("");
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {target?.kind === "day"
              ? `Cancel ${runs} ${runs === 1 ? "run" : "runs"} on ${target.dayLabel}`
              : `Cancel ${target?.name ?? "run"}`}
          </DialogTitle>
          <DialogDescription>
            The {runs === 1 ? "run is" : "runs are"} kept with the reason, never
            deleted.{" "}
            {target?.openStops
              ? `${target.openStops} open ${target.openStops === 1 ? "stop goes" : "stops go"} back to the backlog.`
              : "No open stops to return."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Reason">
            <ChoiceChips
              label="Reason"
              options={REASONS}
              value={reason}
              onChange={setReason}
            />
          </Field>
          <Field label="Note" htmlFor={`${id}-note`}>
            <Textarea
              id={`${id}-note`}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Eid Al Etihad: sites closed, collections move to Thursday."
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep {runs === 1 ? "it" : "them"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!target) return;
              onConfirm(target.routeIds, reason, note.trim());
              setNote("");
              onOpenChange(false);
            }}
          >
            Cancel {runs === 1 ? "run" : `${runs} runs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
