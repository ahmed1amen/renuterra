"use client";

import {
  ChevronLeft,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState, ErrorState } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities, useLead } from "@/features/crm";
import { findUser, LEADS, type LeadSource, type LeadStatus } from "@/mocks";
import { ActivityRow, Screen, ScreenBody } from "../components";
import { usePlaygroundParams } from "../hooks";
import { formatShortDate, initials } from "../utils/format";

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  unqualified: "Unqualified",
};

const SOURCE_LABEL: Record<LeadSource, string> = {
  web: "Website",
  referral: "Referral",
  event: "Event",
  outbound: "Outbound",
};

/** Defaults to the first fixture so the registry can render it without props. */
export function LeadDetail({ leadId = LEADS[0].id }: { leadId?: string }) {
  const { withParams } = usePlaygroundParams();
  const lead = useLead(leadId);
  const activities = useActivities();

  const related = useMemo(
    () =>
      (activities.data ?? []).filter(
        (a) => a.relatedTo.type === "lead" && a.relatedTo.id === leadId,
      ),
    [activities.data, leadId],
  );

  return (
    <Screen>
      <header className="flex items-center justify-between px-2 pt-1 pb-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={withParams("/prototypes/lead-list")} />}
        >
          <ChevronLeft />
          Leads
        </Button>
        <Button variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontal />
        </Button>
      </header>

      <ScreenBody className="gap-4">
        {lead.isPending ? (
          <output
            className="block space-y-4"
            aria-busy
            aria-label="Loading lead"
          >
            <div className="flex flex-col items-center gap-3 py-2">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </output>
        ) : lead.isError ? (
          <ErrorState
            title="Couldn't load this lead"
            error={lead.error}
            onRetry={() => lead.refetch()}
          />
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <Avatar className="size-16">
                <AvatarFallback className="text-lg">
                  {initials(lead.data.firstName, lead.data.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {lead.data.firstName} {lead.data.lastName}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {lead.data.title} · {lead.data.company}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {STATUS_LABEL[lead.data.status]}
                </Badge>
                <Badge variant="outline">Score {lead.data.score}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="h-12 flex-col gap-0.5 text-xs"
              >
                <Phone />
                Call
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-0.5 text-xs"
              >
                <Mail />
                Email
              </Button>
              <Button
                variant="outline"
                className="h-12 flex-col gap-0.5 text-xs"
              >
                <MessageSquare />
                Message
              </Button>
            </div>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field label="Email" value={lead.data.email} />
                <Separator />
                <Field label="Phone" value={lead.data.phone} />
                <Separator />
                <Field label="Source" value={SOURCE_LABEL[lead.data.source]} />
                <Separator />
                <Field
                  label="Owner"
                  value={findUser(lead.data.ownerId)?.name ?? "Unassigned"}
                />
                <Separator />
                <Field
                  label="Created"
                  value={formatShortDate(lead.data.createdAt)}
                />
              </CardContent>
            </Card>

            {lead.data.notes ? (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {lead.data.notes}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <section className="space-y-2">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              {activities.isPending ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : activities.isError ? (
                <ErrorState
                  title="Couldn't load activity"
                  error={activities.error}
                  onRetry={() => activities.refetch()}
                />
              ) : related.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Calls, emails and notes on this lead will appear here."
                />
              ) : (
                <ul className="divide-border divide-y">
                  {related.map((a) => (
                    <li key={a.id}>
                      <ActivityRow activity={a} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </ScreenBody>

      {lead.isSuccess ? (
        <div className="border-border bg-background/95 sticky bottom-0 mt-auto flex gap-2 border-t p-4 pb-[calc(1rem+var(--safe-area-bottom,0px))] backdrop-blur">
          <Button variant="outline" className="flex-1">
            Mark qualified
          </Button>
          <Button className="flex-1">Convert to deal</Button>
        </div>
      ) : null}
    </Screen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate text-right">{value}</span>
    </div>
  );
}
