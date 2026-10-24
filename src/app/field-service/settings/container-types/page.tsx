import type { Metadata } from "next";
import { ContainerTypes } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Container types · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <ContainerTypes />
    </AppLayout>
  );
}
