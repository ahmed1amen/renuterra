import {
  CircleCheck,
  CircleDashed,
  Clock,
  type LucideIcon,
  MapPin,
  Navigation,
  OctagonAlert,
  Wrench,
} from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { JobPriority, JobStatus, ServiceType } from "@/mocks";

/** One tone per meaning, shared by every field service screen. */
export const JOB_STATUS: Record<
  JobStatus,
  { label: string; tone: StatusTone; icon: LucideIcon }
> = {
  unassigned: { label: "Unassigned", tone: "neutral", icon: CircleDashed },
  scheduled: { label: "Scheduled", tone: "neutral", icon: Clock },
  "en-route": { label: "En route", tone: "info", icon: Navigation },
  "on-site": { label: "On site", tone: "info", icon: MapPin },
  completed: { label: "Completed", tone: "success", icon: CircleCheck },
  blocked: { label: "Blocked", tone: "destructive", icon: OctagonAlert },
};

/** Pipeline order used by every status-aware UI. */
export const JOB_STATUS_ORDER: JobStatus[] = [
  "unassigned",
  "scheduled",
  "en-route",
  "on-site",
  "completed",
  "blocked",
];

export const SERVICE_TYPES: Record<
  ServiceType,
  { label: string; icon: LucideIcon }
> = {
  collection: { label: "Collection", icon: Navigation },
  maintenance: { label: "Maintenance", icon: Wrench },
  installation: { label: "Installation", icon: Wrench },
  inspection: { label: "Inspection", icon: MapPin },
};

export function JobStatusPill({ status }: { status: JobStatus }) {
  const s = JOB_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

const PRIORITY: Record<JobPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "text-muted-foreground" },
  normal: { label: "Normal", className: "text-muted-foreground" },
  high: { label: "High", className: "text-warning" },
  urgent: { label: "Urgent", className: "text-destructive" },
};

/** Priority reads as a word, not a colour block — only high/urgent stand out. */
export function PriorityLabel({
  priority,
  className,
}: {
  priority: JobPriority;
  className?: string;
}) {
  const p = PRIORITY[priority];
  return (
    <span
      className={cn(
        "text-xs font-medium",
        p.className,
        priority === "urgent" && "uppercase",
        className,
      )}
    >
      {p.label}
    </span>
  );
}
