"use client";

import { IdCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, StatusPill } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOpsMasters } from "@/features/field-service";
import type { Technician } from "@/mocks";
import { licenceState } from "../../../components";
import { formatDate } from "../../../utils";

/** Dated codes first, soonest expiry on top; untracked ones after. */
const byExpiry = (
  a: { code: string; expiresOn: string | null },
  b: { code: string; expiresOn: string | null },
) => {
  if (a.expiresOn && b.expiresOn) return a.expiresOn.localeCompare(b.expiresOn);
  if (a.expiresOn) return -1;
  if (b.expiresOn) return 1;
  return a.code.localeCompare(b.code);
};

export function LicencesTab({ pro }: { pro: Technician }) {
  const masters = useOpsMasters();
  const codes = [...(pro.skillCodes ?? [])].sort(byExpiry);
  const skillName = (code: string) =>
    masters.data?.skillCodes.find((s) => s.code === code)?.name;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Skill codes</CardTitle>
          <CardDescription>
            Checked against the route's required skills when the pro is
            assigned. A lapsed code stops counting the day it expires.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {masters.isPending ? (
            <Skeleton className="h-40 w-full" />
          ) : masters.isError ? (
            <ErrorState
              error={masters.error}
              onRetry={() => masters.refetch()}
            />
          ) : codes.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((skill) => {
                  const state = skill.expiresOn
                    ? licenceState(skill.expiresOn)
                    : null;
                  const name = skillName(skill.code) ?? skill.code;
                  return (
                    <TableRow key={skill.code}>
                      <TableCell className="font-mono text-sm font-medium">
                        {skill.code}
                      </TableCell>
                      <TableCell className="text-sm">{name}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {skill.expiresOn ? (
                          <>
                            {formatDate(`${skill.expiresOn}T00:00:00Z`)}{" "}
                            {skill.expiresOn.slice(0, 4)}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No expiry
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {state ? (
                          <StatusPill tone={state.tone} dot>
                            {state.label}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="neutral">Not tracked</StatusPill>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {state ? (
                          <Button
                            variant={
                              state.tone === "success" ? "ghost" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              toast.success(`${name} renewal requested`, {
                                description:
                                  "Prototype: HR would upload the renewed evidence.",
                              })
                            }
                          >
                            <RefreshCw data-icon="inline-start" />
                            Renew
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={IdCard}
              title="No skill codes on file"
              description="Add licences, inductions and certificates so Dispatch can match this pro to routes."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Free-text tags from the old roster, kept for reference. Route rules
            match the skill codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pro.skills.length ? (
            <span className="flex flex-wrap gap-1.5">
              {pro.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </span>
          ) : (
            <p className="text-muted-foreground text-sm">No skills recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
