import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard stat tile. Pass `value: undefined` while the query is pending to
 * get a skeleton in place of the numeral.
 */
export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  return (
    <Card className="gap-2 p-4">
      <p className="text-muted-foreground text-[12.5px]">{label}</p>
      {value === undefined ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <p className="font-mono text-[28px] leading-none font-bold tracking-[-.02em] tabular-nums">
          {value}
        </p>
      )}
      {hint ? (
        <p className="text-muted-foreground text-[12.5px]">{hint}</p>
      ) : null}
    </Card>
  );
}
