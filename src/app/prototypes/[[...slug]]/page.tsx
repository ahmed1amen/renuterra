import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPrototype, PROTOTYPES, Prototypes } from "@/apps/prototypes";

export const metadata: Metadata = { title: "Prototypes" };

/** Prerender the index and every registered prototype. */
export function generateStaticParams() {
  return [{ slug: [] }, ...PROTOTYPES.map((p) => ({ slug: [p.slug] }))];
}

export default async function Page({
  params,
}: PageProps<"/prototypes/[[...slug]]">) {
  const { slug } = await params;

  if (slug && slug.length > 1) notFound();

  const id = slug?.[0];
  if (id && !findPrototype(id)) notFound();

  return <Prototypes slug={id} />;
}
