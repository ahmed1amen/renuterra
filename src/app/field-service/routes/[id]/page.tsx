import type { Metadata } from "next";
import { RouteDetail } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Route · Field Service",
};

export default async function Page({
  params,
}: PageProps<"/field-service/routes/[id]">) {
  const { id } = await params;
  return (
    <AppLayout>
      <RouteDetail id={id} />
    </AppLayout>
  );
}
