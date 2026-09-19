import type { Metadata } from "next";
import { Dashboard } from "@/app/main/pages";
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
