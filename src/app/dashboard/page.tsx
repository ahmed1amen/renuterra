import type { Metadata } from "next";
import { Dashboard } from "@/apps/main/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Page() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
