import type { Metadata } from "next";
import { Leads } from "@/app/sales/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Leads · Sales",
};

export default function Page() {
  return (
    <AppLayout>
      <Leads />
    </AppLayout>
  );
}
