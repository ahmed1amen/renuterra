"use client";

import {
  Check,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Leaf,
  type LucideIcon,
  PencilLine,
  Send,
} from "lucide-react";
import { useState } from "react";
import {
  findStream,
  StatusPill,
  type StatusTone,
  StreamSwatch,
} from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CrmFrame, KpiTile, SectionHeader } from "../components";
import {
  CLIENTS,
  driverInitials,
  KPIS,
  LINE_ITEMS,
  PIPELINE,
  QUOTE_ACTIVITY,
  QUOTE_STEPS,
  SCHEDULE,
} from "../data";

type ScreenId = "dashboard" | "clients" | "quote";

const SCREENS: { id: ScreenId; label: string; title: string; cta: string }[] = [
  { id: "dashboard", label: "Dashboard", title: "Dashboard", cta: "New" },
  {
    id: "clients",
    label: "Clients",
    title: "Clients & contacts",
    cta: "New client",
  },
  {
    id: "quote",
    label: "Quote detail",
    title: "Quotes & pricing",
    cta: "New quote",
  },
];

const NAV_INDEX: Record<ScreenId, number> = {
  dashboard: 0,
  clients: 1,
  quote: 2,
};

const AVATARS = [
  "bg-navy-100 text-navy-700",
  "bg-lime-200 text-lime-900",
  "bg-muted text-foreground",
];

const TONE_BG: Record<StatusTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  destructive: "bg-destructive-bg text-destructive",
  neutral: "bg-muted text-foreground",
};

const ACTIVITY_ICONS: Record<
  (typeof QUOTE_ACTIVITY)[number]["icon"],
  LucideIcon
> = {
  eye: Eye,
  note: PencilLine,
  send: Send,
  check: Check,
};

function Segment({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div className="border-border bg-card inline-flex overflow-hidden rounded-[9px] border">
      {items.map((item, i) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(item.id)}
            className={cn(
              "h-7 px-2.5 text-[12.5px] font-medium transition-colors",
              i > 0 && "border-border border-l",
              active ? "bg-accent text-accent-foreground" : "hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ColumnHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground grid h-[38px] items-center px-4 text-[11px] font-medium tracking-[.04em] uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[22px] font-semibold tracking-[-.02em]">
            Good morning, Sara
          </div>
          <div className="text-muted-foreground text-[13px]">
            Thursday 4 September · 27 collections scheduled today
          </div>
        </div>
        <Segment
          items={[
            { id: "month", label: "This month" },
            { id: "quarter", label: "Quarter" },
            { id: "year", label: "Year" },
          ]}
          value="month"
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <KpiTile key={k.label} kpi={k} />
        ))}
      </div>
      <div className="grid grid-cols-[1.5fr_1fr] gap-4">
        <Card className="gap-0 py-0">
          <div className="border-border flex items-center justify-between border-b px-4 py-3.5">
            <div className="text-[15px] font-medium">Today's collections</div>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-[12.5px]"
            >
              View route board
            </Button>
          </div>
          {SCHEDULE.map((s) => (
            <div
              key={s.time}
              className="border-border hover:bg-muted/60 grid h-12 grid-cols-[64px_1.6fr_1fr_1fr_auto] items-center gap-3 border-b px-4 text-[13px] last:border-b-0"
            >
              <span className="text-muted-foreground font-mono text-[12.5px]">
                {s.time}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{s.client}</div>
                <div className="text-muted-foreground text-xs">{s.site}</div>
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5">
                <StreamSwatch stream={s.stream} />
                {findStream(s.stream).label}
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-[12.5px]">
                <span className="bg-muted text-foreground inline-flex size-5 items-center justify-center rounded-full text-[9px] font-semibold">
                  {driverInitials(s.driver)}
                </span>
                {s.driver}
              </div>
              <StatusPill tone={s.tone} dot>
                {s.status}
              </StatusPill>
            </div>
          ))}
        </Card>
        <div className="flex flex-col gap-4">
          <Card className="gap-3 p-4">
            <div className="text-[15px] font-medium">Quotes pipeline</div>
            {PIPELINE.map((p) => (
              <div key={p.stage} className="flex flex-col gap-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", p.dotClass)} />
                    {p.stage}
                  </span>
                  <span className="text-muted-foreground font-mono tabular-nums">
                    {p.count} · {p.value}
                  </span>
                </div>
                <div className="bg-muted h-[5px] rounded-full">
                  <div
                    className={cn("h-full rounded-full", p.barClass)}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>
          <Card className="gap-2.5 p-4">
            <div className="text-[15px] font-medium">Needs attention</div>
            {[
              ["bg-warning", "3 permits", " expire within 30 days"],
              ["bg-destructive", "AED 86,400", " overdue across 5 invoices"],
              ["bg-info", "2 tickets", " waiting on you since yesterday"],
            ].map(([dot, strong, rest]) => (
              <div
                key={strong}
                className="flex items-start gap-2.5 text-[13px]"
              >
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", dot)}
                />
                <div>
                  <span className="font-medium">{strong}</span>
                  {rest}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Clients() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            "All · 612",
            "Healthcare",
            "Hospitality",
            "Residential",
            "Construction",
          ].map((c, i) => (
            <Badge
              key={c}
              variant={i === 0 ? "default" : "outline"}
              className={cn(
                "h-7 px-3 text-[12.5px]",
                i === 0 ? "bg-foreground text-background" : "bg-card",
              )}
            >
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter data-icon="inline-start" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>
      <Card className="gap-0 py-0">
        <ColumnHeader className="grid-cols-[2fr_1.1fr_1.4fr_1fr_1fr_1fr_40px] rounded-t-xl">
          <div>Client</div>
          <div>Sector</div>
          <div>Streams</div>
          <div className="text-right">Tonnage / mo</div>
          <div className="text-right">MRR</div>
          <div className="text-center">Status</div>
          <div />
        </ColumnHeader>
        {CLIENTS.map((c, i) => (
          <div
            key={c.name}
            className="border-border hover:bg-muted/60 grid h-[52px] cursor-pointer grid-cols-[2fr_1.1fr_1.4fr_1fr_1fr_1fr_40px] items-center border-t px-4 text-[13px]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] text-[11px] font-semibold",
                  AVATARS[i % 3],
                )}
              >
                {c.initials}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.name}</div>
                <div className="text-muted-foreground text-xs">{c.sites}</div>
              </div>
            </div>
            <div className="text-muted-foreground">{c.sector}</div>
            <div className="flex gap-1">
              {c.streams.map((s) => (
                <StreamSwatch
                  key={s}
                  stream={s}
                  className="size-2.5 rounded-[3px]"
                />
              ))}
            </div>
            <div className="text-right font-mono tabular-nums">{c.tonnage}</div>
            <div className="text-right font-mono tabular-nums">{c.mrr}</div>
            <div className="flex justify-center">
              <StatusPill tone={c.tone}>{c.status}</StatusPill>
            </div>
            <ChevronRight
              className="text-muted-foreground size-4 justify-self-end"
              aria-hidden
            />
          </div>
        ))}
        <div className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-[12.5px]">
          <span>Showing 1–8 of 612</span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuoteDetail() {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="text-muted-foreground flex items-center gap-2 text-[13px]">
        <span>Quotes</span>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-foreground font-mono">QT-2026-0418</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-2xl font-semibold tracking-[-.02em]">
              Sparklo — Recyclable collection, 12 RVM sites
            </h3>
            <StatusPill tone="warning" dot>
              Awaiting client
            </StatusPill>
          </div>
          <div className="text-muted-foreground mt-1 text-[13px]">
            Created 1 Sep by Sara Al Ali · Sent 1 Sep · Expires 15 Sep
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Duplicate</Button>
          <Button variant="outline">Download PDF</Button>
          <Button>Send reminder</Button>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <Card className="gap-0 py-0">
            <div className="border-border border-b px-4 py-3.5 text-[15px] font-medium">
              Line items
            </div>
            <ColumnHeader className="h-9 grid-cols-[2fr_1fr_.7fr_1fr_1fr]">
              <div>Service</div>
              <div>Frequency</div>
              <div className="text-right">Qty</div>
              <div className="text-right">Unit</div>
              <div className="text-right">Amount</div>
            </ColumnHeader>
            {LINE_ITEMS.map((l) => (
              <div
                key={l.service}
                className="border-border grid h-[46px] grid-cols-[2fr_1fr_.7fr_1fr_1fr] items-center border-t px-4 text-[13px]"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-[2px]", l.swatchClass)} />
                  <span className="font-medium">{l.service}</span>
                </div>
                <div className="text-muted-foreground">{l.freq}</div>
                <div className="text-right font-mono">{l.qty}</div>
                <div className="text-muted-foreground text-right font-mono">
                  {l.unit}
                </div>
                <div className="text-right font-mono tabular-nums">
                  {l.amount}
                </div>
              </div>
            ))}
            <div className="border-border bg-muted/50 flex justify-end rounded-b-xl border-t px-4 py-3.5">
              <div className="grid grid-cols-[auto_auto] gap-x-8 gap-y-1.5 text-right text-[13px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">AED 40,571.43</span>
                <span className="text-muted-foreground">VAT 5%</span>
                <span className="font-mono">AED 2,028.57</span>
                <span className="font-semibold">Total / year</span>
                <span className="font-mono text-base font-bold">
                  AED 42,600.00
                </span>
              </div>
            </div>
          </Card>
          <Card className="gap-3.5 p-4">
            <div className="text-[15px] font-medium">Activity</div>
            {QUOTE_ACTIVITY.map((a) => {
              const Icon = ACTIVITY_ICONS[a.icon];
              return (
                <div
                  key={a.actor + a.text}
                  className="grid grid-cols-[28px_1fr_auto] items-start gap-3 text-[13px]"
                >
                  <span
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full",
                      TONE_BG[a.tone],
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <div>
                      <span className="font-medium">{a.actor}</span> {a.text}
                    </div>
                    {a.note ? (
                      <div className="bg-muted text-muted-foreground mt-1.5 rounded-lg px-2.5 py-2 text-[12.5px]">
                        {a.note}
                      </div>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground font-mono text-xs whitespace-nowrap">
                    {a.when}
                  </span>
                </div>
              );
            })}
            <div className="mt-1 flex gap-2">
              <Input
                placeholder="Add an internal note…"
                aria-label="Add an internal note"
                className="text-[13px]"
              />
              <Button variant="outline">Post</Button>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card className="gap-3 p-4">
            <div className="text-[15px] font-medium">Client</div>
            <div className="flex items-center gap-2.5">
              <span className="bg-navy-100 text-navy-700 inline-flex size-9 items-center justify-center rounded-[9px] text-xs font-semibold">
                SP
              </span>
              <div>
                <div className="font-medium">Sparklo</div>
                <div className="text-muted-foreground text-xs">
                  Recycling tech · 12 sites, Dubai
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <span className="text-muted-foreground">Contact</span>
              <span>Lina Haddad</span>
              <span className="text-muted-foreground">Email</span>
              <span className="text-info">lina@sparklo.ae</span>
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono text-[12.5px]">+971 50 226 4150</span>
              <span className="text-muted-foreground">Owner</span>
              <span className="flex items-center gap-1.5">
                <Avatar size="sm" className="size-[18px]">
                  <AvatarFallback className="bg-lime-200 text-lime-900 text-[8.5px] font-semibold">
                    SA
                  </AvatarFallback>
                </Avatar>
                Sara Al Ali
              </span>
            </div>
          </Card>
          <Card className="gap-3 p-4">
            <div className="text-[15px] font-medium">Timeline</div>
            {QUOTE_STEPS.map((q) => (
              <div
                key={q.label}
                className="flex items-center gap-2.5 text-[13px]"
              >
                <span
                  className={cn(
                    "text-primary-foreground inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
                    q.state === "done" && "bg-primary",
                    q.state === "current" && "border-primary border-2",
                    q.state === "todo" && "border-input border",
                  )}
                >
                  {q.state === "done" ? (
                    <Check className="size-2.5" strokeWidth={3.5} aria-hidden />
                  ) : null}
                </span>
                <span
                  className={cn(
                    q.state === "todo" && "text-muted-foreground",
                    q.state === "current" && "font-semibold",
                  )}
                >
                  {q.label}
                </span>
                <span className="text-muted-foreground ml-auto font-mono text-xs">
                  {q.date}
                </span>
              </div>
            ))}
          </Card>
          <div className="bg-accent text-accent-foreground flex items-start gap-2.5 rounded-xl px-4 py-3.5 text-[13px]">
            <Leaf className="mt-px size-4 shrink-0" aria-hidden />
            <div>
              <span className="font-semibold">Est. 38 t/year diverted</span>{" "}
              from landfill if accepted — shows on the client's impact
              dashboard.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScreensPage() {
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  const current = SCREENS.find((s) => s.id === screen) ?? SCREENS[0];

  return (
    <div className="space-y-5">
      <SectionHeader
        number="14"
        title="Sample CRM screens"
        description="Everything above, assembled. Three views the CRM will need first."
        actions={
          <Segment
            items={SCREENS}
            value={screen}
            onChange={(id) => setScreen(id as ScreenId)}
          />
        }
      />
      <CrmFrame
        activeIndex={NAV_INDEX[screen]}
        sidebarWidth={232}
        cta={current.cta}
        className="min-h-[640px] rounded-[14px] shadow-[0_16px_40px_rgba(20,23,15,.10)]"
        topbarLeft={
          <div className="text-[15px] font-semibold tracking-[-.01em]">
            {current.title}
          </div>
        }
      >
        {screen === "dashboard" ? <Dashboard /> : null}
        {screen === "clients" ? <Clients /> : null}
        {screen === "quote" ? <QuoteDetail /> : null}
      </CrmFrame>
    </div>
  );
}
