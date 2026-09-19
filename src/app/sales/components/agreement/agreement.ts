import type { WasteStream } from "@/components/shared";

/**
 * The shape of a service agreement while it is being drafted. Prototype-grade:
 * this never leaves the browser, so everything is optional until the review
 * step and nothing is validated beyond "can we move on yet".
 */
export type AgreementDraft = {
  customer: {
    /** A lead picked from the funnel, when the agreement started from one. */
    leadId?: string;
    company: string;
    contactName: string;
    email: string;
    phone: string;
  };
  site: {
    name: string;
    address: string;
    zone: string;
    accessNotes: string;
  };
  lines: AgreementLine[];
  schedule: {
    startDate: string;
    /** Weekday the run should land on, 0 = Sunday. */
    preferredDay: number;
    window: string;
  };
  terms: {
    termMonths: number;
    poNumber: string;
    billing: BillingCycle;
  };
};

/** One waste stream on the agreement: what we collect, in what, how often. */
export type AgreementLine = {
  id: string;
  stream: WasteStream;
  containerId: string;
  quantity: number;
  frequencyId: string;
};

export type BillingCycle = "monthly" | "quarterly" | "annual";

/** Containers we rent, priced per unit per lift. */
export const CONTAINERS: {
  id: string;
  label: string;
  /** Rental per container per month. */
  rental: number;
  /** Charge per lift. */
  lift: number;
}[] = [
  { id: "bin-240", label: "240L wheelie bin", rental: 18, lift: 12 },
  { id: "bin-1100", label: "1100L bin", rental: 45, lift: 28 },
  { id: "skip-6", label: "6yd skip", rental: 120, lift: 180 },
  { id: "skip-12", label: "12yd skip", rental: 190, lift: 280 },
  { id: "compactor", label: "Static compactor", rental: 640, lift: 320 },
];

/** Collection cadences, with the lifts per month each implies. */
export const FREQUENCIES: {
  id: string;
  label: string;
  liftsPerMonth: number;
}[] = [
  { id: "daily", label: "Daily (Mon–Sat)", liftsPerMonth: 26 },
  { id: "3x-week", label: "3× a week", liftsPerMonth: 13 },
  { id: "weekly", label: "Weekly", liftsPerMonth: 4.33 },
  { id: "fortnightly", label: "Fortnightly", liftsPerMonth: 2.17 },
  { id: "monthly", label: "Monthly", liftsPerMonth: 1 },
  { id: "on-call", label: "On call", liftsPerMonth: 0.5 },
];

export const BILLING_CYCLES: { id: BillingCycle; label: string }[] = [
  { id: "monthly", label: "Monthly in arrears" },
  { id: "quarterly", label: "Quarterly in advance" },
  { id: "annual", label: "Annual in advance" },
];

export const TERM_OPTIONS = [12, 24, 36];

export const SERVICE_ZONES = ["Al Quoz", "Deira", "Jebel Ali", "Business Bay"];

export const COLLECTION_WINDOWS = [
  "06:00–08:00",
  "08:00–10:00",
  "10:00–12:00",
  "13:00–15:00",
  "15:00–17:00",
];

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function findContainer(id: string) {
  return CONTAINERS.find((c) => c.id === id) ?? CONTAINERS[0];
}

export function findFrequency(id: string) {
  return FREQUENCIES.find((f) => f.id === id) ?? FREQUENCIES[2];
}

/** Monthly value of one line: container rental plus the lifts it implies. */
export function lineMonthly(line: AgreementLine) {
  const container = findContainer(line.containerId);
  const frequency = findFrequency(line.frequencyId);
  const rental = container.rental * line.quantity;
  const lifts = container.lift * line.quantity * frequency.liftsPerMonth;
  return Math.round(rental + lifts);
}

export function agreementMonthly(lines: AgreementLine[]) {
  return lines.reduce((sum, line) => sum + lineMonthly(line), 0);
}

/** What the whole term is worth — the number a rep is measured on. */
export function agreementValue(draft: AgreementDraft) {
  return agreementMonthly(draft.lines) * draft.terms.termMonths;
}

let lineSeq = 0;

export function newLine(stream: WasteStream = "general"): AgreementLine {
  lineSeq += 1;
  return {
    id: `line_${lineSeq}`,
    stream,
    containerId: "bin-1100",
    quantity: 1,
    frequencyId: "weekly",
  };
}

export function emptyDraft(startDate: string): AgreementDraft {
  return {
    customer: { company: "", contactName: "", email: "", phone: "" },
    site: { name: "", address: "", zone: SERVICE_ZONES[0], accessNotes: "" },
    lines: [newLine("general")],
    schedule: { startDate, preferredDay: 1, window: COLLECTION_WINDOWS[1] },
    terms: { termMonths: 12, poNumber: "", billing: "monthly" },
  };
}

export const AGREEMENT_STEPS = [
  { id: "customer", title: "Customer" },
  { id: "site", title: "Site" },
  { id: "services", title: "Services" },
  { id: "schedule", title: "Schedule" },
  { id: "terms", title: "Terms" },
  { id: "review", title: "Review" },
] as const;

export type AgreementStepId = (typeof AGREEMENT_STEPS)[number]["id"];

/** Whether a step has enough filled in to move past it. */
export function isStepComplete(
  step: AgreementStepId,
  draft: AgreementDraft,
): boolean {
  switch (step) {
    case "customer":
      return Boolean(draft.customer.company && draft.customer.contactName);
    case "site":
      return Boolean(draft.site.name && draft.site.address);
    case "services":
      return draft.lines.length > 0;
    case "schedule":
      return Boolean(draft.schedule.startDate);
    case "terms":
      return draft.terms.termMonths > 0;
    case "review":
      return true;
  }
}
