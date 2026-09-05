import { cn } from "@/lib/utils";
import { Code, Demo, SectionHeader } from "../components";
import { TYPE_SCALE } from "../data";

export default function TypographyPage() {
  return (
    <div className="space-y-6">
      <SectionHeader number="03" title="Typography" />

      <div className="grid grid-cols-2 gap-4">
        <div className="border-border bg-card rounded-xl border px-6 py-5">
          <div className="text-muted-foreground mb-2.5 font-mono text-[11px]">
            --font-sans · Plus Jakarta Sans
          </div>
          <div className="text-[44px] leading-[1.05] font-semibold tracking-[-.02em]">
            renuterra Aa
          </div>
          <p className="text-muted-foreground mt-3 text-[13px]">
            Headings, UI labels, body. Weights 400 / 500 / 600 only — 700 is
            reserved for KPI numerals. Headings track −0.02em above 24px.
          </p>
        </div>
        <div className="border-border bg-card rounded-xl border px-6 py-5">
          <div className="text-muted-foreground mb-2.5 font-mono text-[11px]">
            --font-mono · Geist Mono
          </div>
          <div className="font-mono text-[36px] leading-[1.1] font-medium">
            QT-2026-0418
          </div>
          <p className="text-muted-foreground mt-3 text-[13px]">
            IDs, invoice numbers, plate numbers, weights in tables. Always{" "}
            <Code>tabular-nums</Code> in columns.
          </p>
        </div>
      </div>

      <Demo padded={false}>
        {TYPE_SCALE.map((t) => (
          <div
            key={t.cls}
            className="border-border grid grid-cols-[120px_90px_1fr] items-baseline gap-5 border-b px-5 py-3.5 last:border-b-0"
          >
            <div className="text-muted-foreground font-mono text-xs">
              {t.cls}
            </div>
            <div className="text-muted-foreground font-mono text-xs">
              {t.spec}
            </div>
            <div className={cn("truncate", t.className)}>{t.sample}</div>
          </div>
        ))}
      </Demo>
    </div>
  );
}
