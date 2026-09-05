"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toErrorMessage } from "@/lib/api/errors";

type ErrorStateProps = {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
};

export function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="text-destructive size-8" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{toErrorMessage(error)}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
