import type { Metadata } from "next";
import { Reports } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Reports · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Reports />
    </AppLayout>
  );
}
