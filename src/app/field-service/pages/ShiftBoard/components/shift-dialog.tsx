"use client";

import { AlertTriangle, Plane, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { useShiftStore } from "@/features/field-service";
import type { Shift, ShiftTemplate, ShiftType, Technician } from "@/mocks";
import {
  ChoiceChips,
  CREW_ROLE_LABEL,
  Field,
  formatShiftWindow,
  SHIFT_TYPE,
  SHIFT_TYPE_ORDER,
} from "../../../components";
import { firstName, formatDayKey, type RouteSeat } from "./board-meta";

const CUSTOM = "";

export type ShiftTarget = { pro: Technician; date: string };

/**
 * Add or edit one pro's shift on one day. Pick a template or set the type and
 * times by hand; training shifts take a trainer. Setting leave or removing
 * the shift while the pro is on a route warns but is allowed — the board then
 * shows the conflict.
 *
 * Prototype-grade: saves patch the session shift store only.
 */
export function ShiftDialog({
  target,
  onOpenChange,
  ...rest
}: {
  target: ShiftTarget | null;
  onOpenChange: (open: boolean) => void;
  shift: Shift | undefined;
  seats: RouteSeat[];
  templates: ShiftTemplate[];
  trainers: Technician[];
}) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={onOpenChange}>
      {target ? (
        <ShiftForm
          key={`${target.pro.id}|${target.date}`}
          target={target}
          onDone={() => onOpenChange(false)}
          {...rest}
        />
      ) : null}
    </Dialog>
  );
}

function ShiftForm({
  target: { pro, date },
  shift,
  seats,
  templates,
  trainers,
  onDone,
}: {
  target: ShiftTarget;
  shift: Shift | undefined;
  seats: RouteSeat[];
  templates: ShiftTemplate[];
  trainers: Technician[];
  onDone: () => void;
}) {
  const id = useId();
  const setShift = useShiftStore((s) => s.set);
  const removeShift = useShiftStore((s) => s.remove);

  const fallback = templates[0];
  const [templateId, setTemplateId] = useState(
    shift ? (shift.templateId ?? CUSTOM) : (fallback?.id ?? CUSTOM),
  );
  const [type, setType] = useState<ShiftType>(
    shift?.type ?? fallback?.type ?? "morning",
  );
  const [startTime, setStartTime] = useState(
    shift?.startTime ?? fallback?.startTime ?? "06:00",
  );
  const [endTime, setEndTime] = useState(
    shift?.endTime ?? fallback?.endTime ?? "14:00",
  );
  const [trainerId, setTrainerId] = useState(shift?.trainerId ?? "");
  const [note, setNote] = useState(shift?.note ?? "");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isLeave = type === "leave";
  const dayLabel = formatDayKey(date);
  const otherTrainers = trainers.filter((t) => t.id !== pro.id);
  const onRoute = seats.length > 0;
  const routeList = seats
    .map(({ route, role }) =>
      role === "primary"
        ? `the primary on ${route.name}`
        : `${CREW_ROLE_LABEL[role].toLowerCase()} on ${route.name}`,
    )
    .join(" and ");
  const showRouteWarning = onRoute && (isLeave || confirmRemove);

  function applyTemplate(nextId: string) {
    setTemplateId(nextId);
    const template = templates.find((t) => t.id === nextId);
    if (!template) return;
    setType(template.type);
    setStartTime(template.startTime);
    setEndTime(template.endTime);
  }

  // Hand edits detach the shift from its template.
  function editManually(change: () => void) {
    change();
    setTemplateId(CUSTOM);
  }

  function save(event: React.FormEvent) {
    event.preventDefault();
    const next: Shift = {
      id: shift?.id ?? `shift_${pro.id}_${date.replaceAll("-", "")}`,
      serviceProId: pro.id,
      date,
      type,
      startTime: isLeave ? null : startTime,
      endTime: isLeave ? null : endTime,
      templateId: templateId || null,
      trainerId: type === "training" ? trainerId || null : null,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    setShift(next);
    onDone();
    toast.success(
      `${firstName(pro)} · ${dayLabel}: ${SHIFT_TYPE[type].label.toLowerCase()} ${isLeave ? "" : formatShiftWindow(next)}`.trim(),
      {
        description: showRouteWarning
          ? "Still on a route that day — the board flags the conflict."
          : shift
            ? "Shift updated."
            : "Shift added.",
      },
    );
  }

  function remove() {
    if (onRoute && !confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    removeShift(pro.id, date);
    onDone();
    toast.success(`Removed ${firstName(pro)}'s shift on ${dayLabel}`, {
      description: onRoute
        ? "Still on a route that day — the board flags the conflict."
        : undefined,
    });
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={save} className="grid gap-4">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit shift" : "Add shift"}</DialogTitle>
          <DialogDescription>
            {pro.name} · {dayLabel}
            {onRoute
              ? ` · on ${seats.length === 1 ? "a route" : `${seats.length} routes`} this day`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Field
            label="Shift template"
            htmlFor={`${id}-template`}
            hint={
              templateId
                ? undefined
                : "Custom — the type and times below are set by hand."
            }
          >
            <Combobox
              id={`${id}-template`}
              options={[
                { value: CUSTOM, label: "Custom" },
                ...templates.map((t) => ({
                  value: t.id,
                  label: t.name,
                  description: formatShiftWindow(t),
                })),
              ]}
              value={templateId}
              onValueChange={applyTemplate}
              placeholder="Custom"
            />
          </Field>

          <Field label="Shift type">
            <ChoiceChips
              label="Shift type"
              options={SHIFT_TYPE_ORDER.map((t) => ({
                id: t,
                label: SHIFT_TYPE[t].label,
              }))}
              value={type}
              onChange={(next) => editManually(() => setType(next))}
            />
          </Field>

          {isLeave ? null : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start" htmlFor={`${id}-start`}>
                <Input
                  id={`${id}-start`}
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    editManually(() => setStartTime(e.target.value))
                  }
                />
              </Field>
              <Field
                label="End"
                htmlFor={`${id}-end`}
                hint={endTime < startTime ? "Runs past midnight." : undefined}
              >
                <Input
                  id={`${id}-end`}
                  type="time"
                  value={endTime}
                  onChange={(e) =>
                    editManually(() => setEndTime(e.target.value))
                  }
                />
              </Field>
            </div>
          )}

          {type === "training" ? (
            <Field
              label="Trainer"
              htmlFor={`${id}-trainer`}
              hint="The driver supervising this training shift."
            >
              <Combobox
                id={`${id}-trainer`}
                options={[
                  { value: "", label: "No trainer yet" },
                  ...otherTrainers.map((t) => ({
                    value: t.id,
                    label: t.name,
                    description: t.skills.join(", "),
                  })),
                ]}
                value={trainerId}
                onValueChange={setTrainerId}
                placeholder="No trainer yet"
              />
            </Field>
          ) : null}

          <Field label="Note" htmlFor={`${id}-note`}>
            <Textarea
              id={`${id}-note`}
              rows={2}
              value={note}
              placeholder={isLeave ? "Annual leave, sick leave…" : "Overtime…"}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          {showRouteWarning ? (
            <Alert variant="destructive">
              <AlertTriangle aria-hidden />
              <AlertTitle>
                {confirmRemove ? "Remove anyway?" : "Still on a route"}
              </AlertTitle>
              <AlertDescription>
                {firstName(pro)} is {routeList}; move the route first or it will
                show a conflict.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            {isLeave ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmRemove(false);
                  editManually(() => setType("leave"));
                }}
              >
                <Plane data-icon="inline-start" />
                Mark as leave
              </Button>
            )}
            {shift ? (
              <Button
                type="button"
                variant={confirmRemove ? "destructive" : "ghost"}
                size="sm"
                onClick={remove}
              >
                <Trash2 data-icon="inline-start" />
                {confirmRemove ? "Remove anyway" : "Remove shift"}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onDone}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {shift ? "Save shift" : "Add shift"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
