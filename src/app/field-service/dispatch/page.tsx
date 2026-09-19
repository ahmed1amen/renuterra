import type { Metadata } from "next";
import { Dispatch } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Dispatch · Field Service",
};

export default function Page() {
  return (
    <AppLayout fullWidth>
      <Dispatch />
    </AppLayout>
  );
}
