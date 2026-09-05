import type { ReactNode } from "react";
import { CommentSurface } from "@/components/shared";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

/**
 * Chrome shared by every authenticated/product screen. `CommentSurface` adds
 * the PM review layer when Supabase is configured; otherwise it renders the
 * page untouched.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          <CommentSurface>{children}</CommentSurface>
        </main>
      </div>
    </div>
  );
}
