"use client";

import { BarChart3, ChevronRight, Home, Menu, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, CrmFrame, Demo, SectionHeader } from "../components";

const TABS = ["Overview", "Sites", "Collections", "Invoices", "Documents"];
const DRAWER_ITEMS = [
  { label: "Home", icon: Home, active: false },
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Styleguide", icon: Palette, active: false },
];
const CHIPS = ["All", "Scheduled", "Completed", "Missed"];

export default function NavigationPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="10"
        title="Sidebar & top nav"
        description={
          <>
            White sidebar (<Code>--sidebar</Code>), 240px, active item on the
            lime tint with a 2px lime bar. Top bar 56px, 60% border, 80%
            background blur — the existing <Code>app-topbar.tsx</Code> recipe.
          </>
        }
      />
      <CrmFrame
        activeIndex={1}
        badge="STAFF"
        className="h-[480px]"
        topbarLeft={
          <div className="text-muted-foreground flex items-center gap-2 text-[13px]">
            <span>Clients</span>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-foreground font-medium">
              American Hospital Dubai
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-3 p-5">
          <Tabs defaultValue="Overview">
            <TabsList
              variant="line"
              className="border-border w-full justify-start border-b"
            >
              {TABS.map((t) => (
                <TabsTrigger key={t} value={t} className="flex-none px-3">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="border-border text-muted-foreground flex h-[120px] items-center justify-center rounded-lg border border-dashed text-[12.5px]">
            Page content · 24px gutters · max-width 1152px
          </div>
          <div className="flex gap-2">
            {CHIPS.map((c, i) => (
              <Badge
                key={c}
                variant={i === 0 ? "default" : "outline"}
                className={
                  i === 0
                    ? "bg-foreground text-background h-[26px] px-2.5 text-[12.5px]"
                    : "h-[26px] px-2.5 text-[12.5px]"
                }
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>
      </CrmFrame>

      <Demo
        title="Mobile drawer"
        hint={
          <>
            below <Code>lg</Code> the rail is hidden and the same links move
            into a <Code>Sheet</Code> behind the topbar's menu button (
            <Code>app-mobile-nav.tsx</Code>); tapping a link closes it
          </>
        }
      >
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>
            <Menu className="size-4" />
            Open drawer
          </SheetTrigger>
          <SheetContent side="left" className="bg-sidebar">
            <SheetHeader className="border-sidebar-border">
              <SheetTitle>Renuterra</SheetTitle>
            </SheetHeader>
            <nav aria-label="Demo navigation" className="px-3 py-4">
              <ul className="flex flex-col gap-0.5">
                {DRAWER_ITEMS.map(({ label, icon: Icon, active }) => (
                  <li key={label}>
                    <span
                      className={
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium"
                          : "text-sidebar-foreground/80 flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium"
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
          </SheetContent>
        </Sheet>
      </Demo>
    </div>
  );
}
