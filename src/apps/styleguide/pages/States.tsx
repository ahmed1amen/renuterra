"use client";

import { AlertCircle, CheckCircle2, Info, Plus } from "lucide-react";
import { EmptyState, ErrorState, Loader } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { SectionHeader } from "../components";
import { SKELETON_ROWS } from "../data";

export default function StatesPage() {
  return (
    <div className="space-y-5">
      <SectionHeader
        number="12"
        title="Empty, loading, error"
        description='Centered, 64px vertical padding, 32px Lucide icon in muted-foreground. One primary action max; filtered-empty offers "Clear filters" as outline.'
      />
      <div className="grid grid-cols-3 gap-4">
        <Card className="justify-center">
          <EmptyState
            title="No quotes yet"
            description="Quotes from the website form and your team will show up here."
            action={
              <Button size="sm">
                <Plus data-icon="inline-start" />
                New quote
              </Button>
            }
          />
        </Card>
        <Card className="gap-3.5 p-4" aria-busy>
          {SKELETON_ROWS.map((s) => (
            <div key={s.w1 + s.w2} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3" style={{ width: s.w1 }} />
                <Skeleton className="h-2.5" style={{ width: s.w2 }} />
              </div>
            </div>
          ))}
          <div className="text-muted-foreground text-center font-mono text-[11.5px]">
            skeleton · --muted · no shimmer
          </div>
          <Loader className="py-2" />
        </Card>
        <Card className="justify-center">
          <ErrorState
            title="Couldn't load collections"
            error={
              new ApiError(
                "The tracking service didn't respond. Your data is safe.",
                503,
                null,
              )
            }
            onRetry={() => undefined}
          />
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Alert className="bg-success-bg text-success border-success/25 rounded-lg px-3.5 py-3">
          <CheckCircle2 />
          <AlertTitle className="font-semibold">
            Quote sent to Sparklo
          </AlertTitle>
          <AlertDescription className="text-current opacity-85">
            They'll get a link to accept in myRenuterra.
          </AlertDescription>
        </Alert>
        <Alert className="bg-warning-bg text-warning border-warning/25 rounded-lg px-3.5 py-3">
          <AlertCircle />
          <AlertTitle className="font-semibold">
            Permit expires in 14 days
          </AlertTitle>
          <AlertDescription className="text-current opacity-85">
            Dubai Municipality — medical waste, site 2.
          </AlertDescription>
        </Alert>
        <Alert className="bg-info-bg text-info border-info/25 rounded-lg px-3.5 py-3">
          <Info />
          <AlertTitle className="font-semibold">
            Route DXB-07 rescheduled
          </AlertTitle>
          <AlertDescription className="text-current opacity-85">
            Driver change — new ETA 07:15.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
