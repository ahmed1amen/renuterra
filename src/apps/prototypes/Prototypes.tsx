import { Suspense } from "react";
import { Loader } from "@/components/shared";
import { PrototypeShell } from "./components";

/**
 * Entry point for /prototypes. The shell reads `useSearchParams`, which
 * requires a Suspense boundary for the route to stay statically prerendered.
 */
export default function Prototypes({ slug }: { slug?: string }) {
  return (
    <Suspense fallback={<Loader className="min-h-screen" />}>
      <PrototypeShell slug={slug} />
    </Suspense>
  );
}
