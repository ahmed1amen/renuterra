"use client";

import { Phone } from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Technician, TechnicianStatus } from "@/mocks";

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
