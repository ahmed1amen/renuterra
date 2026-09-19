/**
 * CRM domain types used by the mock fixtures and the app screens.
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

export type TechnicianStatus = "available" | "on-job" | "off-shift";

export type Technician = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  /** Service area the tech is rostered to today. */
  zone: string;
  /** Last known vehicle position, for the dispatch map. */
  lat: number;
  lng: number;
  shift: string;
  status: TechnicianStatus;
  skills: string[];
};

export type JobStatus =
  | "unassigned"
  | "scheduled"
  | "en-route"
  | "on-site"
  | "completed"
  | "blocked";

export type JobPriority = "low" | "normal" | "high" | "urgent";

export type ServiceType =
  | "collection"
  | "maintenance"
  | "installation"
  | "inspection";

export type Job = {
  id: string;
  /** Human-facing work order number. */
  ref: string;
  customer: string;
  site: string;
  address: string;
  /** Service point position, for the dispatch map. */
  lat: number;
  lng: number;
  zone: string;
  serviceType: ServiceType;
  /** Waste stream the job handles; drives the stream colour in the UI. */
  stream: "recyclable" | "food" | "medical" | "hazardous" | "cd" | "general";
  status: JobStatus;
  priority: JobPriority;
  /** Start of the booked slot. */
  scheduledFor: string;
  /** Arrival window shown to the customer. */
  window: string;
  durationMins: number;
  technicianId: string | null;
  notes?: string;
};
