"use client";

import { SearchX } from "lucide-react";
import { EmptyState, ErrorState, Loader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { Demo, SectionHeader } from "../components";

export default function StatesPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="States"
        description="Loading, empty and error placeholders from @/components/shared. Use these instead of ad-hoc markup so every screen fails the same way."
      />

      <Demo title="Loader">
        <Loader />
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
