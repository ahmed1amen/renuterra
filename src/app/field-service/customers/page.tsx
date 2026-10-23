import type { Metadata } from "next";
import { Customers } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Customers · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Customers />
    </AppLayout>
  );
}
