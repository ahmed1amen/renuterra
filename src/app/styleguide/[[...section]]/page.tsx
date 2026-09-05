import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STYLEGUIDE_SECTIONS, Styleguide } from "@/apps/styleguide";

export const metadata: Metadata = { title: "Styleguide" };

/** Prerender every section; the bare /styleguide path falls through to Overview. */
export function generateStaticParams() {
  return [
    { section: [] },
    ...STYLEGUIDE_SECTIONS.map((s) => ({ section: [s.id] })),
  ];
}

export default async function Page({
  params,
}: PageProps<"/styleguide/[[...section]]">) {
  const { section } = await params;

  if (section && section.length > 1) notFound();

  const id = section?.[0];
  if (id && !STYLEGUIDE_SECTIONS.some((s) => s.id === id)) notFound();

  return <Styleguide section={id} />;
}
