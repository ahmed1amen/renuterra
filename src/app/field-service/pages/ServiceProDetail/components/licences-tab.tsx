"use client";

import { IdCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, StatusPill } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Technician } from "@/mocks";
import { LICENCE_TYPE, licenceState } from "../../../components";
import { formatDate } from "../../../utils";

export function LicencesTab({ pro }: { pro: Technician }) {
  const licences = [...(pro.licences ?? [])].sort((a, b) =>
    a.expiresOn.localeCompare(b.expiresOn),
  );
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Licences</CardTitle>
          <CardDescription>
            Checked against the vehicle and waste stream when the pro is put on
            a route.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {licences.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licence</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licences.map((licence) => {
                  const state = licenceState(licence.expiresOn);
                  return (
                    <TableRow key={licence.type}>
                      <TableCell className="text-sm font-medium">
                        {LICENCE_TYPE[licence.type]}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {formatDate(`${licence.expiresOn}T00:00:00Z`)}{" "}
                        {licence.expiresOn.slice(0, 4)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={state.tone} dot>
                          {state.label}
                        </StatusPill>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={
                            state.tone === "success" ? "ghost" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            toast.success(
                              `${LICENCE_TYPE[licence.type]} renewal requested`,
                              {
                                description:
                                  "Prototype — HR would upload the renewed licence.",
                              },
                            )
                          }
                        >
                          <RefreshCw data-icon="inline-start" />
                          Renew
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={IdCard}
              title="No licences on file"
              description="Loaders and trainees ride as crew and don't need a driving licence."
              className="py-8"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            What Dispatch matches against a route's vehicle and work.
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
