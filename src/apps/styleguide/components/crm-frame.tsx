"use client";

import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  LayoutGrid,
  type LucideIcon,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CRM_NAV } from "../data";

const ICONS: Record<(typeof CRM_NAV)[number]["icon"], LucideIcon> = {
  home: LayoutGrid,
  users: Users,
  quote: FileText,
  calendar: CalendarDays,
  invoice: Receipt,
  chart: BarChart3,
  truck: Truck,
  ticket: Ticket,
  shield: ShieldCheck,
};

/** The CRM sidebar: ivory ground, active item on the lime tint with a 2px bar. */
export function CrmSidebar({
  activeIndex,
  badge,
  className,
}: {
  activeIndex: number;
  badge?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col gap-1 border-r px-3 py-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-2 pt-1 pb-3.5">
        <BrandLogo height={20} plate className="rounded-md px-1.5 py-[3px]" />
        {badge ? (
          <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px]">
            {badge}
          </span>
        ) : null}
      </div>
      <nav className="flex flex-col gap-1" aria-label="CRM">
        {CRM_NAV.map((item, i) => {
          const Icon = ICONS[item.icon];
          const active = i === activeIndex;
          const count = "count" in item ? item.count : undefined;
          return (
            <button
              key={item.label}
              type="button"
              aria-current={active ? "page" : undefined}
              className={cn(
                "hover:bg-sidebar-accent flex h-[34px] w-full items-center gap-2.5 rounded-[9px] px-2.5 text-left text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                  : "text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
              {count ? (
                <span className="bg-sidebar-accent text-sidebar-accent-foreground ml-auto rounded-full px-1.5 py-px font-mono text-[11px]">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="border-sidebar-border mt-auto flex items-center gap-2.5 border-t px-2.5 py-2">
        <Avatar size="sm" className="size-7">
          <AvatarFallback className="bg-lime-200 text-lime-900 text-[11px] font-semibold">
            SA
          </AvatarFallback>
        </Avatar>
        <div className="text-[12.5px] leading-tight">
          <div className="font-medium">Sara Al Ali</div>
          <div className="text-muted-foreground text-[11.5px]">
            Operations lead
          </div>
        </div>
      </div>
    </aside>
  );
}

/** The 56px top bar: 60% border, blurred 80% background. */
export function CrmTopbar({
  left,
  cta = "New",
}: {
  left: ReactNode;
  cta?: string;
}) {
  return (
    <div className="border-border/60 bg-background/80 flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5 backdrop-blur">
      {left}
      <div className="flex items-center gap-2">
        <span className="relative flex">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
            aria-hidden
          />
          <Input
            readOnly
            placeholder="Search…  ⌘K"
            aria-label="Search"
            className="bg-card h-[30px] w-[210px] rounded-[9px] ps-8 text-[13px]"
          />
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Notifications"
          className="relative rounded-[9px]"
        >
          <Bell className="size-[15px]" />
          <span className="bg-primary border-card absolute top-[5px] right-1.5 size-[7px] rounded-full border-[1.5px]" />
        </Button>
        <Button size="sm" className="rounded-[9px]">
          <Plus data-icon="inline-start" />
          {cta}
        </Button>
      </div>
    </div>
  );
}

/** Sidebar + topbar + content, boxed as a demo frame. */
export function CrmFrame({
  activeIndex,
  badge,
  topbarLeft,
  cta,
  children,
  className,
  sidebarWidth = 240,
}: {
  activeIndex: number;
  badge?: string;
  topbarLeft: ReactNode;
  cta?: string;
  children: ReactNode;
  className?: string;
  sidebarWidth?: number;
}) {
  return (
    <div
      className={cn(
        "ring-foreground/10 grid overflow-hidden rounded-xl ring-1",
        className,
      )}
      style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0,1fr)` }}
    >
      <CrmSidebar activeIndex={activeIndex} badge={badge} />
      <div className="bg-background flex min-w-0 flex-col">
        <CrmTopbar left={topbarLeft} cta={cta} />
        {children}
      </div>
    </div>
  );
}
