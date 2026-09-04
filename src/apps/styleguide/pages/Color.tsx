import { Check, X } from "lucide-react";
import { StreamSwatch, WASTE_STREAMS } from "@/components/shared";
import { cn } from "@/lib/utils";
import { Demo, SectionHeader } from "../components";
import {
  BRAND_PALETTE,
  LIME_RAMP,
  NAVY_RAMP,
  SEMANTIC_TOKENS,
  STATUS_TONES,
} from "../data";

const TONE_CLASSES = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  destructive: "bg-destructive-bg text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;

function Ramp({
  steps,
  cols,
}: {
  steps: { step: string; hex: string; dark: boolean }[];
  cols: number;
}) {
  return (
    <div
      className="border-border grid overflow-hidden rounded-lg border"
      style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}
    >
      {steps.map((s) => (
        <div
          key={s.step}
          className="flex h-16 items-end px-2 py-1.5"
          style={{ background: s.hex }}
        >
          <span
            className={cn(
              "font-mono text-[10.5px]",
              s.dark ? "text-lime-50" : "text-lime-900",
            )}
          >
            {s.step}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ColorPage() {
  return (
    <div className="space-y-7">
      <SectionHeader
        number="02"
        title="Color"
        description="Brand colors as sampled from the website, then the semantic roles the code reads. Toggle the theme in the header to see the dark values."
      />

      <div className="space-y-3">
        <div className="text-sm font-semibold">Brand palette</div>
        <div className="grid grid-cols-5 gap-3">
          {BRAND_PALETTE.map((c) => (
            <div
              key={c.name}
              className="border-border bg-card overflow-hidden rounded-xl border"
            >
              <div className="h-[72px]" style={{ background: c.hex }} />
              <div className="px-3 py-2.5">
                <div className="text-[13px] font-semibold">{c.name}</div>
                <div className="text-muted-foreground mt-0.5 font-mono text-[11.5px]">
                  {c.hex}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {c.use}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Lime ramp</div>
        <Ramp steps={LIME_RAMP} cols={10} />
        <div className="pt-2 text-sm font-semibold">Navy ramp</div>
        <Ramp steps={NAVY_RAMP} cols={6} />
      </div>

      <Demo
        title="Semantic tokens"
        hint="same names as globals.css"
        padded={false}
      >
        <div className="border-border bg-muted text-muted-foreground grid grid-cols-[44px_1.2fr_1fr_1fr_1.6fr] gap-3 border-b px-4 py-2.5 font-mono text-[10.5px] tracking-[.08em] uppercase">
          <div />
          <div>Token</div>
          <div>Light</div>
          <div>Dark</div>
          <div>Use</div>
        </div>
        {SEMANTIC_TOKENS.map((t) => (
          <div
            key={t.name}
            className="border-border grid grid-cols-[44px_1.2fr_1fr_1fr_1.6fr] items-center gap-3 border-b px-4 py-2 text-[13px] last:border-b-0"
          >
            <div
              className="border-border size-8 rounded-lg border"
              style={{ background: t.swatch }}
            />
            <div className="font-mono text-[12.5px]">{t.name}</div>
            <div className="text-muted-foreground font-mono text-xs">
              {t.light}
            </div>
            <div className="text-muted-foreground font-mono text-xs">
              {t.dark}
            </div>
            <div className="text-muted-foreground">{t.use}</div>
          </div>
        ))}
      </Demo>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold">Status colors</div>
          <div className="grid grid-cols-2 gap-2.5">
            {STATUS_TONES.map((s) => (
              <div
                key={s.tone}
                className={cn(
                  "border-border flex items-center gap-3 rounded-lg border px-3.5 py-3",
                  TONE_CLASSES[s.tone],
                )}
              >
                <span className="size-2.5 rounded-full bg-current" />
                <div>
                  <div className="text-[13px] font-semibold">{s.name}</div>
                  <div className="font-mono text-[11px] opacity-80">
                    {s.vars}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold">
            Waste streams{" "}
            <span className="text-muted-foreground font-normal">
              — fixed per stream, everywhere
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {WASTE_STREAMS.map((s) => (
              <div
                key={s.id}
                className="border-border bg-card flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
              >
                <StreamSwatch
                  stream={s.id}
                  className="size-3.5 rounded-[4px]"
                />
                <div>
                  <div className="text-[13px] font-medium">{s.label}</div>
                  <div className="text-muted-foreground font-mono text-[10.5px]">
                    {s.token}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-border bg-card rounded-xl border px-5 py-4">
          <div className="text-success mb-2 flex items-center gap-2 text-sm font-semibold">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
            Do
          </div>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1.5 pl-4 text-[13px]">
            <li>
              Lime for one primary action per view, focus rings, and
              "recyclable" data.
            </li>
            <li>
              Navy for links and informational badges; lavender as its tint.
            </li>
            <li>Ivory/snow surfaces so lime reads warm, never neon.</li>
          </ul>
        </div>
        <div className="border-border bg-card rounded-xl border px-5 py-4">
          <div className="text-destructive mb-2 flex items-center gap-2 text-sm font-semibold">
            <X className="size-4" strokeWidth={2.5} aria-hidden />
            Don't
          </div>
          <ul className="text-muted-foreground flex list-disc flex-col gap-1.5 pl-4 text-[13px]">
            <li>No white text on lime — use #142105.</li>
            <li>
              No lime as body-text color; use lime-700 for text-size accents.
            </li>
            <li>
              No large lime fills or gradients on panels; the leaf mark owns the
              gradient.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
