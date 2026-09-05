import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Numbered title + description header for a styleguide section page. */
export function SectionHeader({
  number,
  title,
  description,
  actions,
}: {
  number: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-muted-foreground font-mono text-[11px] tracking-[.1em] uppercase">
          {number}
        </div>
        <h2 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-.02em]">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mt-2 max-w-[70ch] text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

/** A bordered panel grouping one set of related examples. */
export function Demo({
  title,
  hint,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className="space-y-3">
      {title ? (
        <div className="text-sm font-semibold">
          {title}
          {hint ? (
            <span className="text-muted-foreground font-normal"> — {hint}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "border-border bg-card rounded-xl border",
          padded ? "p-5" : "overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Small bordered info card used for guidance copy. */
export function Note({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card rounded-xl border px-5 py-4",
        className,
      )}
    >
      <div className="mb-1.5 text-sm font-semibold">{title}</div>
      <div className="text-muted-foreground text-[13px]">{children}</div>
    </div>
  );
}

/** Labels an individual example inside a Demo. */
export function Swatch({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground font-mono text-xs">{label}</p>
      {children}
    </div>
  );
}

/** Inline token / file name. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted rounded-[5px] px-1.5 py-px font-mono text-[12.5px]">
      {children}
    </code>
  );
}
