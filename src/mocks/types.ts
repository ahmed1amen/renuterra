/**
 * CRM domain types used by the mock fixtures and the prototype screens.
 * When the real API lands these should move to `src/api/Api/<resource>/`.
 */

export type User = {
  id: string;
  name: string;
  initials: string;
};

export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified";
export type LeadSource = "web" | "referral" | "event" | "outbound";

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  /** 0–100 fit score. */
  score: number;
  ownerId: string;
  createdAt: string;
  lastActivityAt: string;
  notes?: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  tags: string[];
  ownerId: string;
  lastContactedAt: string;
};

export type DealStage =
  | "prospecting"
  | "qualification"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type Deal = {
  id: string;
  name: string;
  company: string;
  contactId: string;
  /** Whole currency units. */
  value: number;
  currency: "USD";
  stage: DealStage;
  /** 0–100 likelihood of closing. */
  probability: number;
  closeDate: string;
  ownerId: string;
  updatedAt: string;
};

export type ActivityType = "call" | "email" | "meeting" | "note" | "task";

export type ActivityRelation = {
  type: "lead" | "contact" | "deal";
  id: string;
  name: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  subject: string;
  body?: string;
  relatedTo: ActivityRelation;
  actorId: string;
  occurredAt: string;
  /** Only meaningful for tasks. */
  completed?: boolean;
};
