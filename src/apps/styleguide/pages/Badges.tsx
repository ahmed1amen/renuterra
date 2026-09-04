import { StatusPill, StreamTag, WASTE_STREAMS } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Demo, SectionHeader } from "../components";
import { BADGE_GROUPS } from "../data";

export default function BadgesPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="07"
        title="Status badges & tags"
        description="Pill, 20px tall, 12px/500. One tone per meaning across every module: lime = done/positive, navy = in progress/info, amber = waiting on someone, red = blocked, neutral = not started."
      />
      <div className="grid grid-cols-2 gap-4">
        {BADGE_GROUPS.map((g) => (
          <Demo key={g.title} title={g.title}>
            <div className="flex flex-wrap gap-2">
              {g.items.map((b) => (
                <StatusPill key={b.label} tone={b.tone} dot>
                  {b.label}
                </StatusPill>
              ))}
            </div>
          </Demo>
        ))}
      </div>
      <Demo
        title="Waste-stream tags"
        hint="outline with stream swatch, never a fill"
      >
        <div className="flex flex-wrap gap-2">
          {WASTE_STREAMS.map((s) => (
            <StreamTag key={s.id} stream={s.id} />
          ))}
        </div>
      </Demo>
      <Demo title="Badge variants" hint="badge.tsx">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              "default",
              "secondary",
              "outline",
              "success",
              "warning",
              "info",
              "destructive",
              "neutral",
              "ghost",
              "link",
            ] as const
          ).map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Demo>
    </div>
  );
}
