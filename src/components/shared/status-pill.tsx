import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * One tone per meaning across every module:
 * success = done/positive, info = in progress, warning = waiting on someone,
 * destructive = blocked, neutral = not started.
 */
export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "destructive"
  | "neutral";

type StatusPillProps = {
  tone: StatusTone;
  children: React.ReactNode;
  /** Leading 6px dot in the tone colour. */
  dot?: boolean;
  className?: string;
};

export function StatusPill({
  tone,
  children,
  dot = false,
  className,
}: StatusPillProps) {
  return (
    <Badge variant={tone} className={cn("gap-1.5", className)}>
      {dot ? (
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children}
    </Badge>
  );
}
