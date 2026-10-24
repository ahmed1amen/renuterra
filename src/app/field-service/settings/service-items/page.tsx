import type { Metadata } from "next";
import { ServiceItems } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Service items · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <ServiceItems />
    </AppLayout>
  );
}
