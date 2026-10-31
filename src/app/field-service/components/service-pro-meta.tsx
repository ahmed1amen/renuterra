import { StatusPill } from "@/components/shared";
import type { RouteInstance, Shift, Technician } from "@/mocks";
import { CREW_ROLE_LABEL } from "./dispatch-meta";
import { formatShiftWindow, licenceState, SHIFT_TYPE } from "./shift-meta";

/** Driver, Helper, or Trainee (a helper still learning the rounds). */
export function proRole(pro: Technician) {
  if (pro.role === "driver") return "Driver";
  return pro.skills.includes("Trainee") ? "Trainee" : "Helper";
}

/** The licence closest to (or furthest past) its expiry, with its state. */
export function worstLicence(pro: Technician) {
  const licences = pro.licences ?? [];
  if (!licences.length) return null;
  const worst = [...licences].sort((a, b) =>
    a.expiresOn.localeCompare(b.expiresOn),
  )[0];
  return { ...worst, state: licenceState(worst.expiresOn) };
}

/** Expired or expiring within 30 days. */
export function needsRenewal(pro: Technician) {
  const worst = worstLicence(pro);
  return Boolean(worst && worst.state.tone !== "success");
}

/** Primary / Helper / Trainee on a route, or `null` if the pro isn't on it. */
export function routeRoleOf(route: RouteInstance, proId: string) {
  if (route.primaryServiceProId === proId) return CREW_ROLE_LABEL.primary;
  const crew = route.crew.find((c) => c.serviceProId === proId);
  return crew ? CREW_ROLE_LABEL[crew.role] : null;
}

/** Shift type badge with an icon; pair with `formatShiftWindow` for the hours. */
export function ShiftBadge({ shift }: { shift: Pick<Shift, "type"> }) {
  const meta = SHIFT_TYPE[shift.type];
  const Icon = meta.icon;
  return (
    <StatusPill tone={meta.tone}>
      <Icon aria-hidden />
      {meta.label}
    </StatusPill>
  );
}

/** Badge + window, or a muted "Off" when there's no shift that day. */
export function ShiftSummary({ shift }: { shift: Shift | undefined }) {
  if (!shift) return <span className="text-muted-foreground text-sm">Off</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <ShiftBadge shift={shift} />
      {shift.type === "leave" ? null : (
        <span className="font-mono text-xs tabular-nums">
          {formatShiftWindow(shift)}
        </span>
      )}
    </span>
  );
}

/** Worst licence as a badge, or "None on file" for crew without licences. */
export function LicenceBadge({ pro }: { pro: Technician }) {
  const worst = worstLicence(pro);
  if (!worst)
    return <span className="text-muted-foreground text-sm">None on file</span>;
  return (
    <StatusPill tone={worst.state.tone} dot>
      {worst.state.label}
    </StatusPill>
  );
}
