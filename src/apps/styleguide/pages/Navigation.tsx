import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, CrmFrame, SectionHeader } from "../components";

const TABS = ["Overview", "Sites", "Collections", "Invoices", "Documents"];
const CHIPS = ["All", "Scheduled", "Completed", "Missed"];

export default function NavigationPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="10"
        title="Sidebar & top nav"
        description={
          <>
            Ivory sidebar (<Code>--sidebar</Code>), 240px, active item on the
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
    </div>
  );
}
