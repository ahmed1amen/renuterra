import type { Metadata } from "next";
import { AppointmentDetail } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Appointment · Field Service",
};

export default async function Page({
  params,
}: PageProps<"/field-service/appointments/[id]">) {
  const { id } = await params;
  return (
    <AppLayout>
      <AppointmentDetail id={id} />
    </AppLayout>
  );
}
