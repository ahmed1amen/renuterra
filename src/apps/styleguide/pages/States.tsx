"use client";

import { SearchX } from "lucide-react";
import { EmptyState, ErrorState, Loader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { Demo, SectionHeader } from "../components";

export default function StatesPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="States"
        description="Loading, empty and error placeholders. Loader and Skeleton cover pending fetches; EmptyState and ErrorState from @/components/shared make every screen fail the same way."
      />

      <Demo title="Loader">
        <Loader />
      </Demo>

      <Demo title="Skeleton">
        <div className="flex max-w-sm items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </Demo>

      <Demo title="Empty">
        <EmptyState
          title="No records yet"
          description="Create your first record to get started."
          action={<Button size="sm">Create record</Button>}
        />
      </Demo>

      <Demo title="Empty — no results">
        <EmptyState
          icon={SearchX}
          title="No matches"
          description="Try a different search term or clear your filters."
        />
      </Demo>

      <Demo title="Error">
        <ErrorState
          error={new ApiError("Failed to load records", 500, null)}
          onRetry={() => undefined}
        />
      </Demo>
    </div>
  );
}
