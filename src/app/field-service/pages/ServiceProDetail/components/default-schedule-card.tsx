"use client";

import { CalendarPlus, Save } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  type DefaultSchedule,
  shiftFromTemplate,
  useDefaultScheduleStore,
  useShiftStore,
  weekdayOf,
} from "@/features/field-service";
import type { DayOfWeek, Shift, ShiftTemplate, Technician } from "@/mocks";
import { formatShiftWindow, shiftHours } from "../../../components";

const WEEK: { id: DayOfWeek; label: string }[] = [
  { id: "sun", label: "Sunday" },
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
];

const OFF = "off";

/**
 * Weekday → shift template, what Autofill and "Apply to next week" create
 * shifts from. Saving and applying only touch session stores.
 */
export function DefaultScheduleCard({
  pro,
  schedule,
  templates,
  nextWeek,
  nextWeekLabel,
  shiftOf,
  onViewWeek,
}: {
  pro: Technician;
  schedule: DefaultSchedule;
  templates: ShiftTemplate[];
  /** Day keys of the week after the one on screen. */
  nextWeek: string[];
  nextWeekLabel: string;
  shiftOf: (date: string) => Shift | undefined;
  onViewWeek: () => void;
}) {
  const id = useId();
  const saveSchedule = useDefaultScheduleStore((s) => s.save);
  const setMany = useShiftStore((s) => s.setMany);
  const [draft, setDraft] = useState<DefaultSchedule>(schedule);

  const templateOf = (templateId: string | undefined) =>
    templates.find((t) => t.id === templateId);
  const dirty = WEEK.some(
    (d) => (draft[d.id] ?? "") !== (schedule[d.id] ?? ""),
  );
  const weeklyHours = WEEK.reduce((sum, d) => {
    const t = templateOf(draft[d.id]);
    return t ? sum + shiftHours(t) : sum;
  }, 0);

  function change(day: DayOfWeek, value: string) {
    setDraft((prev) => {
      const next = { ...prev };
      if (value === OFF) delete next[day];
      else next[day] = value;
      return next;
    });
  }

  function save() {
    saveSchedule(pro.id, draft);
    toast.success("Default schedule saved", {
      description: "Prototype — saved for this session only.",
    });
  }

  function applyNextWeek() {
    const created = nextWeek.flatMap((date) => {
      if (shiftOf(date)) return [];
      const template = templateOf(draft[weekdayOf(date)]);
      return template ? [shiftFromTemplate(pro.id, date, template)] : [];
    });
    if (!created.length) {
      toast.info("Nothing to add", {
        description: `Every working day of ${nextWeekLabel} already has a shift.`,
      });
      return;
    }
    setMany(created);
    toast.success(
      `${created.length} ${created.length === 1 ? "shift" : "shifts"} added`,
      {
        description: `${pro.name}, ${nextWeekLabel}. Days that already had a shift were left alone.`,
        action: { label: "View week", onClick: onViewWeek },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default schedule</CardTitle>
        <CardDescription>
          The template worked on each weekday. {weeklyHours} h a week.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {WEEK.map((day) => {
            const value = draft[day.id] ?? OFF;
            const selected = templateOf(draft[day.id]);
            return (
              <li
                key={day.id}
                className="grid grid-cols-[6rem_1fr] items-center gap-3 py-2"
              >
                <Label htmlFor={`${id}-${day.id}`} className="font-normal">
                  {day.label}
                </Label>
                <NativeSelect
                  id={`${id}-${day.id}`}
                  size="sm"
                  className="w-full"
                  value={value}
                  onChange={(e) => change(day.id, e.target.value)}
                >
                  <NativeSelectOption value={OFF}>Off</NativeSelectOption>
                  {templates
                    .filter((t) => t.active || t.id === selected?.id)
                    .map((t) => (
                      <NativeSelectOption key={t.id} value={t.id}>
                        {t.name} · {formatShiftWindow(t)}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </li>
            );
          })}
        </ul>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={applyNextWeek}>
          <CalendarPlus data-icon="inline-start" />
          Apply to next week
        </Button>
        <Button size="sm" onClick={save} disabled={!dirty}>
          <Save data-icon="inline-start" />
          Save
        </Button>
      </CardFooter>
    </Card>
  );
}
