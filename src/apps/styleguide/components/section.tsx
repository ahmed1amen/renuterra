import type { ReactNode } from "react";

/** Title + description header for a styleguide section page. */
export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

/** A bordered demo panel grouping one set of related examples. */
export function Demo({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-border bg-card space-y-4 rounded-xl border p-6">
      <h3 className="text-base font-semibold">{title}</h3>
      {children}
    </section>
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
