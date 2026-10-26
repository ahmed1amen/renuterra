import type { Metadata } from "next";
import { ServicePros } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Service pros · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <ServicePros />
    </AppLayout>
  );
}
