import type { ReactNode } from "react";
import { AppTopbar } from "./app-topbar";

/** Chrome shared by every authenticated/product screen. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppTopbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
