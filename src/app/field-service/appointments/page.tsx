import type { Metadata } from "next";
import { Appointments } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Appointments · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Appointments />
    </AppLayout>
  );
}
