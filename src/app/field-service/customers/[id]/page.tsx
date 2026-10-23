import type { Metadata } from "next";
import { CustomerDetail } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Customer · Field Service",
};

export default async function Page({
  params,
}: PageProps<"/field-service/customers/[id]">) {
  const { id } = await params;
  return (
    <AppLayout>
      <CustomerDetail id={id} />
    </AppLayout>
  );
}
