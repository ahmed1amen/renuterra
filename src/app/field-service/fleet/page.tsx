import type { Metadata } from "next";
import { Fleet } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Fleet · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Fleet />
    </AppLayout>
  );
}
