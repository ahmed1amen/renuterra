import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Dashboard stat tile. Pass `value: undefined` while the query is pending to
 * get a skeleton in place of the numeral. `tone="destructive"` flags a value
 * that needs someone to act on it. With `href` (another screen) or `onClick`
 * (a filter on this one) the whole tile opens the rows behind the number.
 */
export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  href,
  onClick,
  active = false,
}: {
  label: string;
  value?: string;
  hint?: string;
  tone?: "default" | "destructive";
  href?: string;
  onClick?: () => void;
  /** The filter this tile applies is on. */
  active?: boolean;
}) {
  const interactive = Boolean(href || onClick);
  const body: ReactNode = (
    <Card
      className={cn(
        "h-full gap-2 p-4 transition-colors",
        interactive && "group-hover:border-foreground/20",
        active && "border-primary ring-primary/20 ring-2",
      )}
    >
      <p className="text-muted-foreground flex items-center justify-between gap-2 text-[12.5px]">
        {label}
        {interactive ? (
          <ChevronRight
            className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          />
        ) : null}
      </p>
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
  const wrap =
    "group block rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
  if (href)
    return (
      <Link href={href} className={wrap}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(wrap, "w-full")}
      >
        {body}
      </button>
    );
  return body;
}
