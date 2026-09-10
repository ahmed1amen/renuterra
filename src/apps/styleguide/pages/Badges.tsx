"use client";

import {
  AlertTriangle,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  Truck,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  StatusPill,
  type StatusTone,
  StreamTag,
  WASTE_STREAMS,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Code, Demo, Note, SectionHeader } from "../components";
import { BADGE_GROUPS } from "../data";

const TONES: {
  tone: StatusTone;
  title: string;
  meaning: string;
}[] = [
  {
    tone: "success",
    title: "Lime · done / positive",
    meaning: "Completed collections, accepted quotes, paid invoices.",
  },
  {
    tone: "info",
    title: "Navy · in progress",
    meaning: "Work that has started and needs no action from us right now.",
  },
  {
    tone: "warning",
    title: "Amber · waiting on someone",
    meaning: "Blocked on a client, a driver or an approval — chase it.",
  },
  {
    tone: "destructive",
    title: "Red · failed / blocked",
    meaning: "Missed collections, declined quotes, overdue invoices.",
  },
  {
    tone: "neutral",
    title: "Grey · not started / inactive",
    meaning: "Drafts, archived records, anything with no state yet.",
  },
];

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "success",
  "warning",
  "info",
  "destructive",
  "neutral",
  "ghost",
  "link",
] as const;

const ICON_STATUSES = [
  { icon: CircleCheck, tone: "success", label: "Collected" },
  { icon: Truck, tone: "info", label: "En route" },
  { icon: Clock, tone: "warning", label: "Awaiting client" },
  { icon: CircleX, tone: "destructive", label: "Missed" },
  { icon: User, tone: "neutral", label: "Unassigned" },
] as const;

const TABLE_ROWS = [
  {
    id: "COL-10428",
    site: "American Hospital Dubai",
    tone: "success" as StatusTone,
    status: "Collected",
    weight: "1,240 kg",
    date: "12 Sep 2026",
  },
  {
    id: "COL-10429",
    site: "Emaar Square — Tower 3",
    tone: "info" as StatusTone,
    status: "En route",
    weight: "860 kg",
    date: "12 Sep 2026",
  },
  {
    id: "COL-10430",
    site: "Al Quoz Industrial 4",
    tone: "warning" as StatusTone,
    status: "Awaiting client",
    weight: "—",
    date: "11 Sep 2026",
  },
  {
    id: "COL-10431",
    site: "Northwind Farms",
    tone: "destructive" as StatusTone,
    status: "Missed",
    weight: "—",
    date: "11 Sep 2026",
  },
];

const INITIAL_FILTERS = [
  "Status: En route",
  "Stream: Recyclable",
  "Site: Al Quoz",
  "Date: Last 30 days",
];

export default function BadgesPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  return (
    <div className="space-y-5">
      <SectionHeader
        number="07"
        title="Status badges & tags"
        description={
          <>
            Pill, 20px tall, 12px/500, width follows the content. One tone per
            meaning across every module — a badge is a status, never decoration.
            Reach for <Code>StatusPill</Code> for record state and{" "}
            <Code>StreamTag</Code> for waste streams; raw <Code>Badge</Code>{" "}
            variants are for counts and chips.
          </>
        }
      />

      <Demo title="Semantic tones" hint="the whole vocabulary — nothing else">
        <div className="space-y-2">
          {TONES.map((t) => (
            <div
              key={t.tone}
              className="border-border bg-muted/30 flex items-center gap-4 rounded-lg border p-3"
            >
              <div className="w-28 shrink-0">
                <StatusPill tone={t.tone} dot>
                  {t.title.split(" · ")[1]}
                </StatusPill>
              </div>
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-muted-foreground text-xs">{t.meaning}</p>
              </div>
            </div>
          ))}
        </div>
      </Demo>

      <div className="grid gap-4 lg:grid-cols-2">
        {BADGE_GROUPS.map((g) => (
          <Demo key={g.title} title={g.title} hint="module status vocabulary">
            <div className="flex flex-wrap gap-2">
              {g.items.map((badge) => (
                <StatusPill key={badge.label} tone={badge.tone} dot>
                  {badge.label}
                </StatusPill>
              ))}
            </div>
          </Demo>
        ))}
      </div>

      <Demo
        title="Status with icons"
        hint="icon supports the word, never replaces it"
      >
        <div className="flex flex-wrap gap-2">
          {ICON_STATUSES.map((s) => {
            const Icon = s.icon;
            return (
              <Badge key={s.label} variant={s.tone}>
                <Icon data-icon="inline-start" />
                {s.label}
              </Badge>
            );
          })}
        </div>
      </Demo>

      <Demo
        title="Icon only"
        hint="acceptable in dense tables — tooltip and aria-label required"
      >
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {ICON_STATUSES.map((s) => {
              const Icon = s.icon;
              return (
                <Tooltip key={s.label}>
                  <TooltipTrigger
                    render={
                      <Badge
                        variant={s.tone}
                        aria-label={s.label}
                        className="size-5 px-0"
                      />
                    }
                  >
                    <Icon aria-hidden />
                  </TooltipTrigger>
                  <TooltipContent>{s.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </Demo>

      <Demo
        title="Waste-stream tags"
        hint="outline with stream swatch, never a fill"
      >
        <div className="flex flex-wrap gap-2">
          {WASTE_STREAMS.map((s) => (
            <StreamTag key={s.id} stream={s.id} />
          ))}
        </div>
      </Demo>

      <Demo
        title="Filter chips"
        hint="dismissible — mirrors the active filters"
      >
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          {filters.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              No filters applied
            </span>
          ) : (
            filters.map((filter) => (
              <Badge key={filter} variant="outline" className="pr-1">
                {filter}
                <button
                  type="button"
                  aria-label={`Remove filter ${filter}`}
                  onClick={() =>
                    setFilters((prev) => prev.filter((f) => f !== filter))
                  }
                  className="hover:bg-muted ml-0.5 flex size-4 items-center justify-center rounded-sm transition-colors"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </Badge>
            ))
          )}
          {filters.length < INITIAL_FILTERS.length ? (
            <button
              type="button"
              onClick={() => setFilters(INITIAL_FILTERS)}
              className="text-info text-xs underline-offset-4 hover:underline"
            >
              Reset
            </button>
          ) : null}
        </div>
      </Demo>

      <Demo title="Counts & links" hint="badges may link to a filtered view">
        <div className="flex flex-wrap items-center gap-2">
          <a href="#counts" className="transition-opacity hover:opacity-80">
            <Badge variant="success">12 collected</Badge>
          </a>
          <a href="#counts" className="transition-opacity hover:opacity-80">
            <Badge variant="warning">3 awaiting client</Badge>
          </a>
          <a href="#counts" className="transition-opacity hover:opacity-80">
            <Badge variant="destructive">1 missed</Badge>
          </a>
          <a href="#counts" className="transition-opacity hover:opacity-80">
            <Badge variant="link">View all</Badge>
          </a>
        </div>
      </Demo>

      <Demo title="Badge variants" hint="badge.tsx">
        <div className="flex flex-wrap items-center gap-2">
          {VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Demo>

      <Demo
        title="In a table"
        hint="one dedicated status column, left-aligned"
        padded={false}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-3">Collection</TableHead>
              <TableHead className="px-3">Site</TableHead>
              <TableHead className="px-3">Status</TableHead>
              <TableHead className="px-3">Weight</TableHead>
              <TableHead className="px-3">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {TABLE_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-3 py-2.5 font-medium">
                  {row.id}
                </TableCell>
                <TableCell className="px-3">{row.site}</TableCell>
                <TableCell className="px-3">
                  <StatusPill tone={row.tone} dot>
                    {row.status}
                  </StatusPill>
                </TableCell>
                <TableCell className="text-muted-foreground px-3">
                  {row.weight}
                </TableCell>
                <TableCell className="text-muted-foreground px-3">
                  {row.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Demo>

      <div className="grid gap-4 lg:grid-cols-2">
        <Demo
          title={
            <span className="text-success flex items-center gap-2">
              <Check className="size-4" aria-hidden />
              Do
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">
                Sentence case, semantic tone
              </p>
              <div className="flex gap-2">
                <StatusPill tone="success">Collected</StatusPill>
                <StatusPill tone="warning">Awaiting client</StatusPill>
                <StatusPill tone="destructive">Missed</StatusPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Width follows content</p>
              <div className="flex gap-2">
                <StatusPill tone="success">Paid</StatusPill>
                <StatusPill tone="info">Partially collected</StatusPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Icon plus a word</p>
              <div className="flex gap-2">
                <Badge variant="success">
                  <CircleCheck data-icon="inline-start" />
                  Verified
                </Badge>
                <Badge variant="info">
                  <Truck data-icon="inline-start" />
                  En route
                </Badge>
              </div>
            </div>
          </div>
        </Demo>

        <Demo
          title={
            <span className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-4" aria-hidden />
              Don&apos;t
            </span>
          }
        >
          <div className="space-y-4 opacity-70">
            <div>
              <p className="mb-2 text-sm font-medium">ALL CAPS labels</p>
              <div className="flex gap-2">
                <StatusPill tone="success">COLLECTED</StatusPill>
                <StatusPill tone="warning">PENDING</StatusPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                Tone chosen for looks, not meaning
              </p>
              <div className="flex gap-2">
                <StatusPill tone="success">Draft</StatusPill>
                <StatusPill tone="destructive">Scheduled</StatusPill>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">
                Full-width badge in a cell
              </p>
              <StatusPill tone="success" className="w-full justify-center">
                Collected
              </StatusPill>
            </div>
          </div>
        </Demo>
      </div>

      <Note title="Writing badge labels">
        Sentence case, one or two words, the same word the domain uses — a
        collection is “Missed”, never “Failure”. Keep a status out of two tones
        at once: if a record is both overdue and unpaid, badge the state the
        reader can act on. Counts go in a neutral badge next to the label, not
        in the status column.
      </Note>
    </div>
  );
}
