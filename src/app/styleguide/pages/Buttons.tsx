import {
  ArrowRight,
  Bell,
  Download,
  Loader2,
  Plus,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Demo, Note, SectionHeader } from "../components";

const SOLID = [
  { variant: "default", label: "Primary" },
  { variant: "navy", label: "Navy" },
  { variant: "secondary", label: "Gray" },
  { variant: "dark", label: "Dark" },
  { variant: "outline", label: "Light" },
  { variant: "success", label: "Success" },
  { variant: "danger", label: "Danger" },
  { variant: "warning", label: "Warning" },
] as const;

const OUTLINE = [
  { variant: "outline", label: "Default" },
  { variant: "outline-navy", label: "Navy" },
  { variant: "outline-success", label: "Success" },
  { variant: "outline-danger", label: "Danger" },
] as const;

const PILL = [
  { variant: "default", label: "Primary" },
  { variant: "navy", label: "Navy" },
  { variant: "secondary", label: "Gray" },
  { variant: "success", label: "Success" },
  { variant: "danger", label: "Danger" },
] as const;

const SIZES = [
  { size: "xs", label: "Extra small · 24" },
  { size: "sm", label: "Small · 28" },
  { size: "default", label: "Medium · 32" },
  { size: "lg", label: "Large · 36" },
] as const;

export default function ButtonsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="05"
        title="Buttons"
        description={
          <>
            Variants map 1:1 to <Code>button.tsx</Code>. Height 32px default,
            28px sm, 36px lg; radius 10px; 14px/500. Lime primary always takes
            dark text — white fails contrast on <Code>--primary</Code>.
          </>
        }
      />

      <Demo title="Solid buttons" hint="one primary per screen">
        <div className="flex flex-wrap items-center gap-3">
          {SOLID.map((b) => (
            <Button key={b.label} variant={b.variant}>
              {b.label}
            </Button>
          ))}
        </div>
      </Demo>

      <Demo title="Outline buttons" hint="transparent fill, toned border">
        <div className="flex flex-wrap items-center gap-3">
          {OUTLINE.map((b) => (
            <Button key={b.label} variant={b.variant}>
              {b.label}
            </Button>
          ))}
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </Demo>

      <Demo title="Pill buttons" hint="rounded-full — filters and chips only">
        <div className="flex flex-wrap items-center gap-3">
          {PILL.map((b) => (
            <Button key={b.label} variant={b.variant} className="rounded-full">
              {b.label}
            </Button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {OUTLINE.map((b) => (
            <Button key={b.label} variant={b.variant} className="rounded-full">
              {b.label}
            </Button>
          ))}
        </div>
      </Demo>

      <Demo title="Sizes" hint="xs, sm, default, lg">
        <div className="flex flex-wrap items-center gap-3">
          {SIZES.map((s) => (
            <Button key={s.label} size={s.size}>
              {s.label}
            </Button>
          ))}
        </div>
      </Demo>

      <Demo
        title="Buttons with icons"
        hint="data-icon inline-start / inline-end trims the padding"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <ShoppingCart data-icon="inline-start" />
            New quote
          </Button>
          <Button variant="outline">
            <Download data-icon="inline-start" />
            Download
          </Button>
          <Button variant="navy">
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button variant="outline-success">
            <Settings data-icon="inline-start" />
            Settings
          </Button>
        </div>
      </Demo>

      <Demo title="Icon only" hint="always give an aria-label">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" aria-label="Continue">
            <ArrowRight />
          </Button>
          <Button variant="outline" size="icon" aria-label="Settings">
            <Settings />
          </Button>
          <Button variant="navy" size="icon" aria-label="Download">
            <Download />
          </Button>
          <Button
            variant="outline-navy"
            size="icon"
            aria-label="Cart"
            className="rounded-full"
          >
            <ShoppingCart />
          </Button>
          <span className="bg-border h-6 w-px" aria-hidden />
          <Button size="icon-xs" aria-label="Add extra small">
            <Plus />
          </Button>
          <Button size="icon-sm" aria-label="Add small">
            <Plus />
          </Button>
          <Button size="icon-lg" aria-label="Add large">
            <Plus />
          </Button>
        </div>
      </Demo>

      <Demo title="With a count" hint="badge inside the button, never a dot">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            Messages
            <Badge variant="neutral" className="bg-primary-foreground/10">
              2
            </Badge>
          </Button>
          <Button variant="navy">
            <Bell data-icon="inline-start" />
            Notifications
            <Badge variant="neutral" className="bg-white/15 text-white">
              5
            </Badge>
          </Button>
          <Button variant="outline">
            Tasks
            <Badge variant="neutral">12</Badge>
          </Button>
        </div>
      </Demo>

      <Demo title="Loading" hint="spinner replaces the leading icon">
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Loading…
          </Button>
          <Button variant="outline" disabled>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Processing…
          </Button>
          <Button variant="navy" disabled>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Saving…
          </Button>
        </div>
      </Demo>

      <Demo title="Disabled & focus" hint="50% opacity, no pointer events">
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button variant="navy" disabled>
            <Download data-icon="inline-start" />
            Cannot download
          </Button>
          <Button variant="outline" disabled>
            Disabled outline
          </Button>
          <span className="bg-border h-6 w-px" aria-hidden />
          <Button variant="outline" className="border-ring ring-ring/50 ring-3">
            Focused
          </Button>
        </div>
      </Demo>

      <Demo title="Segmented group" hint="ghost buttons in a bordered shell">
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
      </Demo>

      <Note title="Picking a variant">
        Lime <Code>default</Code> is the single primary action on a screen. Navy
        carries links and secondary confirmations, gray/outline everything else.{" "}
        <Code>danger</Code> is for irreversible actions only — the soft{" "}
        <Code>destructive</Code> variant covers ordinary deletes. Warning and
        success solids are for status-driven actions, not decoration.
      </Note>
    </div>
  );
}
