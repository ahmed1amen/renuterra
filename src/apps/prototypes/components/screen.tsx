import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Root of every mobile prototype screen: fills the viewport, stacks vertically. */
export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-background flex min-h-full flex-1 flex-col", className)}
    >
      {children}
    </div>
  );
}

/** Scrollable body between the header and the tab bar. */
export function ScreenBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-1 flex-col px-4 pb-6", className)}>
      {children}
    </main>
  );
}
