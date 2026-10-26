import type { Metadata } from "next";
import { ShiftTemplates } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Shift templates · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <ShiftTemplates />
    </AppLayout>
  );
}
