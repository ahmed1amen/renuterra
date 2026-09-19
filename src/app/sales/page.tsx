import type { Metadata } from "next";
import { Dashboard } from "@/app/sales/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Sales",
};

export default function Page() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
