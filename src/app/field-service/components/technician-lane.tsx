"use client";

import { Phone } from "lucide-react";
import { EmptyState, StatusPill, type StatusTone } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TechnicianLane } from "@/features/field-service";
import type { Technician, TechnicianStatus } from "@/mocks";
import { formatDuration } from "../utils";
import { JobCard } from "./job-card";

const TECH_STATUS: Record<
  TechnicianStatus,
  { label: string; tone: StatusTone }
> = {
  available: { label: "Available", tone: "success" },
  "on-job": { label: "On a job", tone: "info" },
  "off-shift": { label: "Off shift", tone: "neutral" },
};

export function TechnicianStatusPill({ status }: { status: TechnicianStatus }) {
  const s = TECH_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

/** Avatar + name + shift, reused by the board and the dashboard roster. */
export function TechnicianIdentity({
  technician,
  showPhone = false,
}: {
  technician: Technician;
  showPhone?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <Avatar size="sm" className="size-8">
        <AvatarFallback className="text-[11px] font-semibold">
          {technician.initials}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-medium">
          {technician.name}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {technician.zone} · {technician.shift}
          {showPhone ? (
            <span className="ml-1.5 inline-flex items-center gap-1">
              <Phone className="size-3" aria-hidden />
              {technician.phone}
            </span>
          ) : null}
        </span>
      </span>
    </span>
  );
}

/** One technician column on the dispatch board. */
export function TechnicianLaneCard({
  lane,
  technicians,
  onAssign,
}: {
  lane: TechnicianLane;
  technicians: Technician[];
  onAssign: (jobId: string, technicianId: string | null) => void;
}) {
  const { technician, jobs, bookedMins } = lane;

  return (
    <section className="bg-muted/40 flex min-w-0 flex-col gap-3 rounded-xl p-3">
      <header className="space-y-2">
        <TechnicianIdentity technician={technician} />
        <div className="flex items-center justify-between gap-2">
          <TechnicianStatusPill status={technician.status} />
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {jobs.length} · {formatDuration(bookedMins)}
          </span>
        </div>
      </header>

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs"
          description="Assign one from the queue."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard
                job={job}
                technicians={technicians}
                onAssign={(technicianId) => onAssign(job.id, technicianId)}
                compact
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
