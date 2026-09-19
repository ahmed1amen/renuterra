import type { ReactNode } from "react";
import { CommentSurface } from "@/components/shared";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

/**
 * Chrome shared by every authenticated/product screen. `CommentSurface` adds
 * the PM review layer when Supabase is configured; otherwise it renders the
 * page untouched.
 */
export function AppLayout({
  children,
  fullWidth = false,
}: {
  children: ReactNode;
  /** Drop the reading-width container and page gutters — for map/board screens. */
  fullWidth?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main
          className={cn(
            "flex w-full flex-1 flex-col",
            fullWidth ? "min-h-0" : "mx-auto max-w-6xl px-6 py-8",
          )}
        >
          <CommentSurface>{children}</CommentSurface>
        </main>
      </div>
    </div>
  );
}
