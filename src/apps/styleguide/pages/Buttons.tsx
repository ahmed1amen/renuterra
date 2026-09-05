import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Code, Demo, SectionHeader } from "../components";

export default function ButtonsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="05"
        title="Buttons"
        description={
          <>
            Variants map 1:1 to <Code>button.tsx</Code>. Height 32px default,
            28px sm, 36px lg; radius 10px; 14px/500.
          </>
        }
      />
      <Demo className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus data-icon="inline-start" />
            New quote
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="link">Link</Button>
          <span className="bg-border h-6 w-px" aria-hidden />
          <Button disabled>Disabled</Button>
          <Button variant="outline" className="border-ring ring-ring/50 ring-3">
            Focused
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="xs">
            xs · 24
          </Button>
          <Button variant="outline" size="sm">
            sm · 28
          </Button>
          <Button variant="outline">default · 32</Button>
          <Button variant="outline" size="lg">
            lg · 36
          </Button>
          <span className="bg-border h-6 w-px" aria-hidden />
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell />
          </Button>
          <Button size="icon" aria-label="Add">
            <Plus />
          </Button>
          <div className="border-border inline-flex overflow-hidden rounded-lg border">
            <Button
              variant="ghost"
              className="bg-accent text-accent-foreground rounded-none"
              aria-pressed
            >
              Week
            </Button>
            <Button
              variant="ghost"
              className="border-border rounded-none border-l"
            >
              Month
            </Button>
            <Button
              variant="ghost"
              className="border-border rounded-none border-l"
            >
              Quarter
            </Button>
          </div>
        </div>
      </Demo>
    </div>
  );
}
