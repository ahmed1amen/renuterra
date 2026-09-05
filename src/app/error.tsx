"use client";

import { ErrorState } from "@/components/shared";
import { AppLayout } from "@/layouts";

export default function RouteError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <AppLayout>
      <ErrorState error={error} onRetry={reset} />
    </AppLayout>
  );
}
