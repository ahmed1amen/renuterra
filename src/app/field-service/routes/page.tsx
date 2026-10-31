import type { Metadata } from "next";
import { Routes } from "@/app/field-service/pages";
import { AppLayout } from "@/layouts";

export const metadata: Metadata = {
  title: "Routes · Field Service",
};

export default function Page() {
  return (
    <AppLayout>
      <Routes />
    </AppLayout>
  );
}
