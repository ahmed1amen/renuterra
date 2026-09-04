import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SampleKpi } from "../data";

const TONE_TEXT = {
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  destructive: "text-destructive",
  neutral: "text-muted-foreground",
} as const;

function sparkPoints(values: number[]) {
  return values
    .map((v, i) => `${(i * 72) / (values.length - 1)},${22 - v * 20}`)
    .join(" ");
}

/** KPI numerals 28px/700 mono, delta in a status colour, 72×24 sparkline. */
export function KpiTile({ kpi }: { kpi: SampleKpi }) {
  return (
    <Card className="gap-2 p-4">
      <div className="text-muted-foreground flex items-center justify-between text-[12.5px]">
        <span>{kpi.label}</span>
        <span className="font-mono text-[11px]">{kpi.period}</span>
      </div>
      <div className="font-mono text-[28px] leading-none font-bold tracking-[-.02em] tabular-nums">
        {kpi.value}
        <span className="text-muted-foreground ml-1 text-sm font-medium">
          {kpi.unit}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn("text-[12.5px] font-medium", TONE_TEXT[kpi.deltaTone])}
        >
          {kpi.delta}
        </span>
        <svg width="72" height="24" viewBox="0 0 72 24" fill="none">
          <title>{`${kpi.label} trend`}</title>
          <polyline
            points={sparkPoints(kpi.spark)}
            className={kpi.sparkClass}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Card>
  );
}
