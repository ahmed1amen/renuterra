import type { Metadata } from "next";
import { Dashboard } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
