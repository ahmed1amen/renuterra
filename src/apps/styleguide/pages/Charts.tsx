import { StreamSwatch, type WasteStream } from "@/components/shared";
import { Card } from "@/components/ui/card";
import { Code, KpiTile, SectionHeader } from "../components";
import { KPIS, TONNAGE_BARS } from "../data";

const LEGEND: { stream: WasteStream; label: string }[] = [
  { stream: "recyclable", label: "Recyclable" },
  { stream: "medical", label: "Medical" },
  { stream: "food", label: "Food" },
  { stream: "general", label: "General" },
];

const DIVERSION = [
  { label: "Recycled", pct: 41, className: "bg-chart-1" },
  { label: "Composted", pct: 9, className: "bg-chart-2" },
  { label: "Energy recovery", pct: 6, className: "bg-chart-3" },
];

export default function ChartsPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="11"
        title="KPI tiles & charts"
        description={
          <>
            KPI numerals 28px/700 mono, delta in status color. Charts use{" "}
            <Code>--chart-1…5</Code> in order; stream breakdowns use the stream
            tokens instead so recyclable is always lime, medical always red.
          </>
        }
      />
      <div className="grid grid-cols-4 gap-4">
        {KPIS.map((k) => (
          <KpiTile key={k.label} kpi={k} />
        ))}
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <Card className="px-5 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="text-[15px] font-medium">
              Collected tonnage by stream
            </div>
            <div className="text-muted-foreground flex gap-3.5 text-xs">
              {LEGEND.map((l) => (
                <span
                  key={l.stream}
                  className="inline-flex items-center gap-1.5"
                >
                  <StreamSwatch stream={l.stream} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          <div className="border-border grid h-40 grid-cols-8 items-end gap-3.5 border-b">
            {TONNAGE_BARS.map((b) => (
              <div
                key={b.month}
                className="flex h-full flex-col justify-end overflow-hidden rounded-t"
              >
                <div
                  className="bg-stream-general"
                  style={{ height: `${b.general}%` }}
                />
                <div
                  className="bg-stream-food"
                  style={{ height: `${b.food}%` }}
                />
                <div
                  className="bg-stream-medical"
                  style={{ height: `${b.medical}%` }}
                />
                <div
                  className="bg-stream-recyclable"
                  style={{ height: `${b.recyclable}%` }}
                />
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-2 grid grid-cols-8 gap-3.5 text-center font-mono text-[11px]">
            {TONNAGE_BARS.map((b) => (
              <div key={b.month}>{b.month}</div>
            ))}
          </div>
        </Card>

        <Card className="gap-3.5 px-5 py-4">
          <div className="text-[15px] font-medium">Diversion rate</div>
          <div className="flex items-center gap-5">
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              aria-label="56% diverted, target 60%"
            >
              <title>Diversion rate</title>
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                className="stroke-muted"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                className="stroke-primary"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="314"
                strokeDashoffset="138"
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="58"
                textAnchor="middle"
                className="fill-foreground font-mono text-[26px] font-bold"
              >
                56%
              </text>
              <text
                x="60"
                y="76"
                textAnchor="middle"
                className="fill-muted-foreground text-[10.5px]"
              >
                target 60%
              </text>
            </svg>
            <div className="flex flex-1 flex-col gap-2.5 text-[13px]">
              {DIVERSION.map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between">
                    <span>{d.label}</span>
                    <span className="font-mono">{d.pct}%</span>
                  </div>
                  <div className="bg-muted mt-1 h-[5px] rounded-full">
                    <div
                      className={`h-full rounded-full ${d.className}`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
