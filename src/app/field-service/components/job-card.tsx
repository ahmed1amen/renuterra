"use client";

import { Clock, MapPin, UserPlus } from "lucide-react";
import { StreamTag } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Job, Technician } from "@/mocks";
import { formatDuration } from "../utils";
import { JobStatusPill, PriorityLabel, SERVICE_TYPES } from "./job-status";

/**
 * One work order on the dispatch board. The assign menu is the only action —
 * everything else about the job is read-only in this prototype.
 */
export function JobCard({
  job,
  technicians,
  onAssign,
  compact = false,
}: {
  job: Job;
  technicians: Technician[];
  onAssign: (technicianId: string | null) => void;
  /** Lane cards drop the status pill and the address to fit the column. */
  compact?: boolean;
}) {
  const service = SERVICE_TYPES[job.serviceType];
  const ServiceIcon = service.icon;
  const assignable = technicians.filter((t) => t.status !== "off-shift");

  return (
    <Card
      className={cn(
        "gap-2.5 p-3",
        job.priority === "urgent" && "ring-destructive/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold">{job.ref}</span>
            <PriorityLabel priority={job.priority} />
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">{job.customer}</p>
          <p className="text-muted-foreground truncate text-xs">{job.site}</p>
        </div>
        {compact ? null : <JobStatusPill status={job.status} />}
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {job.window}
          <span className="text-muted-foreground/70">
            · {formatDuration(job.durationMins)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ServiceIcon className="size-3.5" aria-hidden />
          {service.label}
        </span>
        {compact ? null : (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {job.zone}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <StreamTag stream={job.stream} />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" className="h-7 px-2" />}
          >
            <UserPlus data-icon="inline-start" />
            {job.technicianId ? "Reassign" : "Assign"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Assign to</DropdownMenuLabel>
            {assignable.map((tech) => (
              <DropdownMenuItem
                key={tech.id}
                disabled={tech.id === job.technicianId}
                onClick={() => onAssign(tech.id)}
              >
                <span className="truncate">{tech.name}</span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {tech.zone}
                </span>
              </DropdownMenuItem>
            ))}
            {job.technicianId ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAssign(null)}>
                  Back to the queue
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {job.notes && !compact ? (
        <p className="text-muted-foreground border-border/60 border-t pt-2 text-xs">
          {job.notes}
        </p>
      ) : null}
    </Card>
  );
}
