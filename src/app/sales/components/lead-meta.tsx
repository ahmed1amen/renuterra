import type { StatusTone } from "@/components/shared";
import type { LeadSource, LeadStatus } from "@/mocks";

/** One tone per lead status, shared by every sales screen. */
export const LEAD_STATUS: Record<
  LeadStatus,
  { label: string; tone: StatusTone }
> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "warning" },
  qualified: { label: "Qualified", tone: "success" },
  unqualified: { label: "Unqualified", tone: "neutral" },
};

export const LEAD_SOURCE: Record<LeadSource, { label: string }> = {
  web: { label: "Website" },
  referral: { label: "Referral" },
  event: { label: "Event" },
  outbound: { label: "Outbound" },
};
