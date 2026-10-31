import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock, FileX2, Gauge, Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InstanceFlag } from "@/mocks";
import { slotKind, slotLabel } from "./dispatch-meta";
import { STAFFING_SOURCE } from "./route-meta";

type Chip = {
  key: string;
  label: string;
  title: string;
  tone: "destructive" | "warning" | "info" | "neutral";
  icon: LucideIcon;
};

const CONTRACT_REASON: Record<string, string> = {
  "credit-hold": "credit hold",
  suspended: "suspended",
  expired: "expired",
};

/**
 * What the dispatch engine flagged on an instance, one chip per kind:
 * unstaffed slots and over capacity block a plain Confirm; substitutes,
 * window misses and skipped contracts are for the dispatcher's eye.
 */
export function flagChips(flags: InstanceFlag[]): Chip[] {
  const chips: Chip[] = [];
  for (const f of flags) {
    if (f.kind === "unstaffed")
      chips.push({
        key: `unstaffed-${f.slot}`,
        label: `Unstaffed: ${slotLabel(f.slot)}`,
        title: `No eligible ${slotKind(f.slot)} was available — staff the slot before confirming.`,
        tone: "destructive",
        icon: AlertTriangle,
      });
  }
  for (const f of flags) {
    if (f.kind === "substitute")
      chips.push({
        key: `substitute-${f.slot}`,
        label: `${STAFFING_SOURCE[f.source]} ${slotKind(f.slot)}`,
        title:
          f.source === "pool"
            ? `The ${slotLabel(f.slot)} slot was filled from the pool — the Route's primary and backups were unavailable.`
            : f.source === "backup"
              ? `The primary ${slotKind(f.slot)} was unavailable, so a ranked backup was dispatched.`
              : `The ${slotLabel(f.slot)} slot was staffed by hand.`,
        tone: f.source === "pool" ? "warning" : "info",
        icon: Repeat,
      });
  }
  const over = flags.find((f) => f.kind === "over-capacity");
  if (over)
    chips.push({
      key: "over-capacity",
      label: `Over capacity ${over.utilisation}%`,
      title:
        "Planned load is above the dispatched truck's capacity — resolve before confirming.",
      tone: "destructive",
      icon: Gauge,
    });
  const outside = flags.filter((f) => f.kind === "outside-window").length;
  if (outside)
    chips.push({
      key: "outside-window",
      label: `${outside} ${outside === 1 ? "stop" : "stops"} outside window`,
      title:
        "Sequencing couldn't place these stops inside their service window.",
      tone: "warning",
      icon: Clock,
    });
  const skipped = flags.filter(
    (f): f is Extract<InstanceFlag, { kind: "contract-skipped" }> =>
      f.kind === "contract-skipped",
  );
  if (skipped.length) {
    const reasons = [
      ...new Set(skipped.map((f) => CONTRACT_REASON[f.reason] ?? f.reason)),
    ];
    chips.push({
      key: "contract-skipped",
      label: `${skipped.length} ${skipped.length === 1 ? "contract" : "contracts"} skipped (${reasons.join(", ")})`,
      title: `Service lines left off this run: ${skipped.map((f) => f.serviceLineId).join(", ")}.`,
      tone: "neutral",
      icon: FileX2,
    });
  }
  return chips;
}

export function InstanceFlagChips({
  flags,
  className,
}: {
  flags: InstanceFlag[];
  className?: string;
}) {
  const chips = flagChips(flags);
  if (!chips.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)}>
      {chips.map(({ key, label, title, tone, icon: Icon }) => (
        <li key={key}>
          <Badge variant={tone} title={title} className="h-5 text-[11px]">
            <Icon aria-hidden />
            {label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
