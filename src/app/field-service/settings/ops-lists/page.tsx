import type { Metadata } from "next";
import { OpsLists } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Lookups · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <OpsLists />
    </AppLayout>
  );
}
