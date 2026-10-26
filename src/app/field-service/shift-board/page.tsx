import type { Metadata } from "next";
import { ShiftBoard } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Shift board · Field Service",
};

export default function Page() {
  return (
    <AppLayout fullWidth>
      <ShiftBoard />
    </AppLayout>
  );
}
