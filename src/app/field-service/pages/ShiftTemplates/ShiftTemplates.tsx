"use client";

import { CalendarClock, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusPill,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  defaultScheduleOf,
  useDefaultScheduleStore,
  useShiftTemplates,
  useTechnicians,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import type { ShiftTemplate } from "@/mocks";
import { formatShiftWindow, ShiftBadge, shiftHours } from "../../components";
import { ShiftTemplateDialog } from "./components";

const SKELETON_ROWS = [0, 1, 2, 3, 4];

export default function ShiftTemplates() {
  const templates = useShiftTemplates();
  const pros = useTechnicians();
  const schedules = useDefaultScheduleStore((s) => s.schedules);
  const [dialog, setDialog] = useState<{
    open: boolean;
    key: number;
    template: ShiftTemplate | null;
  }>({ open: false, key: 0, template: null });
  const openDialog = (template: ShiftTemplate | null) =>
    setDialog((d) => ({ open: true, key: d.key + 1, template }));

  /** How many pros have each template somewhere in their default week. */
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const pro of pros.data ?? []) {
      const ids = new Set(Object.values(defaultScheduleOf(pro, schedules)));
      for (const id of ids) if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [pros.data, schedules]);

  const all = templates.data ?? [];

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Settings" },
          { label: "Shift templates" },
        ]}
        title="Shift templates"
        description="Reusable daily windows that default schedules and Autofill create shifts from."
        actions={
          <Button size="sm" onClick={() => openDialog(null)}>
            <Plus data-icon="inline-start" />
            New template
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            An end time before the start runs past midnight, so a 20:00–04:00
            night shift belongs to the day it starts on. Leave isn't a template:
            it's set per day on the shift board.
          </p>

          {templates.isPending || pros.isPending ? (
            <output
              className="block space-y-3"
              aria-busy
              aria-label="Loading shift templates"
            >
              {SKELETON_ROWS.map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </output>
          ) : templates.isError || pros.isError ? (
            <ErrorState
              error={templates.error ?? pros.error}
              onRetry={() => {
                templates.refetch();
                pros.refetch();
              }}
            />
          ) : all.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No shift templates yet"
              description="Add the day, night and on-call windows your service pros work."
              action={
                <Button size="sm" onClick={() => openDialog(null)}>
                  <Plus data-icon="inline-start" />
                  New template
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Service pros</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((template) => {
                  const used = usage.get(template.id) ?? 0;
                  return (
                    <TableRow
                      key={template.id}
                      className={cn(
                        "cursor-pointer",
                        !template.active && "text-muted-foreground",
                      )}
                      onClick={() => openDialog(template)}
                    >
                      <TableCell className="text-sm font-medium">
                        <button
                          type="button"
                          className="hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(template);
                          }}
                        >
                          {template.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <ShiftBadge shift={template} />
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {formatShiftWindow(template)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {shiftHours(template)} h
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {used ? (
                          used
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={template.active ? "success" : "neutral"}
                          dot
                        >
                          {template.active ? "Active" : "Inactive"}
                        </StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ShiftTemplateDialog
        key={dialog.key}
        template={dialog.template}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </>
  );
}
