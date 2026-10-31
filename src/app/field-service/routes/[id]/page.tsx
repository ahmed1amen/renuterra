import type { Metadata } from "next";
import { RouteDetail } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Route · Field Service",
};

export default async function Page({
  params,
  searchParams,
}: PageProps<"/field-service/routes/[id]">) {
  const { id } = await params;
  const { tab } = await searchParams;
  return (
    <AppLayout>
      <RouteDetail
        id={id}
        initialTab={typeof tab === "string" ? tab : undefined}
      />
    </AppLayout>
  );
}
