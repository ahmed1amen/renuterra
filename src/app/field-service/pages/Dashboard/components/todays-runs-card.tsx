"use client";

import { Radio } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared";
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
import { InstanceStatusPill, TODAY_KEY } from "../../../components";
import type { RunRow } from "../hooks";

const SKELETON_ROWS = [0, 1, 2, 3, 4];
const DISPATCH_TODAY = `/field-service/dispatch?date=${TODAY_KEY}`;

export function TodaysRunsCard({ runs }: { runs: RunRow[] | null }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's runs</CardTitle>
        <CardDescription>
          Every route instance on the road today. Click a run to open it on
          Dispatch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {runs === null ? (
          <output
            className="block space-y-3"
            aria-busy
            aria-label="Loading today's runs"
          >
            {SKELETON_ROWS.map((n) => (
              <Skeleton key={n} className="h-11 w-full" />
            ))}
          </output>
        ) : runs.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No runs today"
            description="No route instances were generated for today. Generate them on Dispatch."
            action={
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={DISPATCH_TODAY} />}
              >
                Open dispatch
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Truck</TableHead>
                <TableHead className="text-end">Stops</TableHead>
                <TableHead className="text-end">Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <TableRow
                  key={run.instance.id}
                  className="cursor-pointer"
                  onClick={() => router.push(DISPATCH_TODAY)}
                >
                  <TableCell className="max-w-52">
                    <Link
                      href={DISPATCH_TODAY}
                      onClick={(e) => e.stopPropagation()}
                      className="block font-mono text-xs font-medium hover:underline"
                    >
                      {run.code}
                    </Link>
                    <span className="text-muted-foreground block truncate text-xs">
                      {run.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {run.shift}
                    <span className="text-muted-foreground block font-mono text-xs tabular-nums">
                      {run.window}
                    </span>
                  </TableCell>
                  <TableCell>
                    <InstanceStatusPill status={run.instance.status} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {run.driver ?? (
                      <span className="text-destructive text-xs">
                        No driver
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {run.truck ?? (
                      <span className="text-destructive font-sans">
                        No truck
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-end font-mono text-xs tabular-nums">
                    {run.stopsDone}/{run.stopsTotal}
                  </TableCell>
                  <TableCell className="text-end">
                    {run.instance.flags.length ? (
                      <Badge variant="outline" className="font-mono">
                        {run.instance.flags.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
