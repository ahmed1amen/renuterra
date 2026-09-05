import { cn } from "@/lib/utils";
import { SectionHeader } from "../components";
import { RADII, SPACING } from "../data";

const ELEVATION = [
  {
    label: "Ring — cards, table shells",
    className: "ring-1 ring-foreground/10",
  },
  {
    label: "Popover — menus, tooltips",
    className: "bg-popover ring-1 ring-foreground/10 shadow-md",
  },
  {
    label: "Dialog — modals, sheets",
    className:
      "bg-popover ring-1 ring-foreground/10 shadow-[0_16px_40px_rgba(20,23,15,.16)]",
  },
];

export default function SpacingPage() {
  return (
    <div className="space-y-6">
      <SectionHeader number="04" title="Spacing, radius, elevation" />
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4">
        <div className="border-border bg-card rounded-xl border px-6 py-5">
          <div className="mb-3.5 text-sm font-semibold">4px grid</div>
          <div className="flex flex-col gap-2">
            {SPACING.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-muted-foreground w-16 font-mono text-[11.5px]">
                  {s.name}
                </span>
                <span
                  className="bg-lime-500 h-3.5 rounded-[3px]"
                  style={{ width: s.px }}
                />
                <span className="text-muted-foreground font-mono text-[11.5px]">
                  {s.px}px
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3.5 text-[12.5px]">
            Page gutter 24px, card padding 16px (sm: 12px), table cell 10px
            16px, form field gap 16px.
          </p>
        </div>

        <div className="border-border bg-card rounded-xl border px-6 py-5">
          <div className="mb-3.5 text-sm font-semibold">Radius · base 10px</div>
          <div className="flex flex-wrap gap-3">
            {RADII.map((r) => (
              <div key={r.name} className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "border-input bg-muted size-[52px] border",
                    r.className,
                  )}
                />
                <span className="text-muted-foreground font-mono text-[10.5px]">
                  {r.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-3.5 text-[12.5px]">
            Buttons &amp; inputs lg, cards xl, badges pill.
          </p>
        </div>

        <div className="border-border bg-card rounded-xl border px-6 py-5">
          <div className="mb-3.5 text-sm font-semibold">Elevation</div>
          <div className="flex flex-col gap-3">
            {ELEVATION.map((e) => (
              <div
                key={e.label}
                className={cn(
                  "bg-card rounded-lg px-3.5 py-3 text-[12.5px]",
                  e.className,
                )}
              >
                {e.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
