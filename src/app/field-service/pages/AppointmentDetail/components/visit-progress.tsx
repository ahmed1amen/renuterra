import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/mocks";

const STEPS: { status: AppointmentStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "confirmed", label: "Confirmed" },
  { status: "en-route", label: "En route" },
  { status: "in-progress", label: "On site" },
  { status: "completed", label: "Completed" },
];

/** Where a visit is in its lifecycle. Failed and cancelled stop the line. */
export function VisitProgress({ status }: { status: AppointmentStatus }) {
  const stopped = status === "failed" || status === "cancelled";
  // A failed visit got as far as the site; a cancelled one never left.
  const reached = stopped
    ? status === "failed"
      ? 3
      : 0
    : STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Visit progress">
      {STEPS.map((step, index) => {
        const done = index < reached || (!stopped && index === reached);
        const current = index === reached;
        return (
          <li key={step.status} className="space-y-1.5">
            <span
              className={cn(
                "block h-1.5 rounded-full",
                done
                  ? "bg-primary"
                  : stopped && current
                    ? "bg-destructive"
                    : "bg-muted",
              )}
            />
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                done || current
                  ? "text-foreground font-medium"
                  : "text-muted-foreground",
              )}
              aria-current={current ? "step" : undefined}
            >
              {done && !current ? (
                <Check className="size-3" aria-hidden />
              ) : null}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
