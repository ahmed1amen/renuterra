import type { Metadata } from "next";
import { ServiceProDetail } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Service pro · Field Service",
};

export default async function Page({
  params,
}: PageProps<"/field-service/service-pros/[id]">) {
  const { id } = await params;
  return (
    <AppLayout>
      <ServiceProDetail id={id} />
    </AppLayout>
  );
}
