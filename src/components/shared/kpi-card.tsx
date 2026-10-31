import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Dashboard stat tile. Pass `value: undefined` while the query is pending to
 * get a skeleton in place of the numeral. `tone="destructive"` flags a value
 * that needs someone to act on it.
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value?: string;
  hint?: string;
  tone?: "default" | "destructive";
}) {
  return (
    <Card className="gap-2 p-4">
      <p className="text-muted-foreground text-[12.5px]">{label}</p>
      {value === undefined ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <p
          className={cn(
            "font-mono text-[28px] leading-none font-bold tracking-[-.02em] tabular-nums",
            tone === "destructive" && "text-destructive",
          )}
        >
          {value}
        </p>
      )}
      {hint ? (
        <p className="text-muted-foreground text-[12.5px]">{hint}</p>
      ) : null}
    </Card>
  );
}
