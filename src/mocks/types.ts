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

// ---------------------------------------------------------------------------
// Field Ops — customers, service points and appointments.
// Vocabulary and shapes follow docs/product/glossary.md and domain-model.md.
// ---------------------------------------------------------------------------

export type WasteStreamId =
  | "general"
  | "recyclable"
  | "food"
  | "cd"
  | "hazardous"
  | "medical";

export type Emirate = "Dubai" | "Sharjah" | "Ajman" | "Umm Al Quwain";

export type CustomerStatus = "active" | "passive";
export type CustomerTier = "platinum" | "gold" | "silver" | "bronze";
export type CustomerFlag =
  | "vip"
  | "new_customer"
  | "at_risk"
  | "do_not_service"
  | "past_due";

export type ContactRole =
  | "decision-maker"
  | "operations"
  | "finance"
  | "billing"
  | "sales"
  | "technical";

export type CustomerContact = {
  name: string;
  title: string;
  role: ContactRole;
  email: string;
  phone: string;
  isPrimary: boolean;
};

/** A B2B company we collect waste for. Owns one or more service points. */
export type Customer = {
  id: string;
  /** Human-facing customer code, e.g. `REN-CUST-000101`. */
  number: string;
  name: string;
  industry: string;
  tier: CustomerTier;
  status: CustomerStatus;
  flags: CustomerFlag[];
  /** Key account manager (a `User`). */
  kamId: string;
  emirate: Emirate;
  address: string;
  phone: string;
  email: string;
  /** UAE tax registration number. */
  trn: string;
  paymentTerms: string;
  /** AED. */
  creditLimit: number;
  contacts: CustomerContact[];
  createdAt: string;
};

export type ContainerType =
  | "bin"
  | "skip"
  | "roro"
  | "compactor"
  | "drum"
  | "sharps-box";

export type Container = {
  type: ContainerType;
  /** "1100L", "10CBM", "200L" … */
  size: string;
  stream: WasteStreamId;
  quantity: number;
  ownership: "renuterra" | "customer";
};

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ServiceFrequency = "daily" | "weekly" | "monthly" | "on-call";
/** Arrival window: morning, afternoon, night, or anytime. */
export type ArrivalWindow = "AM" | "PM" | "night" | "AT";
export type BillingUom = "trip" | "skip" | "pcs" | "kg" | "ton";

/** One contracted service at a service point — what recurring appointments are generated from. */
export type ServiceLine = {
  id: string;
  /** Catalogue code, e.g. `REL 1100L GEN`. */
  serviceItem: string;
  stream: WasteStreamId;
  frequency: ServiceFrequency;
  days: DayOfWeek[];
  window: ArrivalWindow;
  uom: BillingUom;
  quantity: number;
};

/** A physical site where waste is collected. Named "Customer - Location". */
export type ServicePoint = {
  id: string;
  /** Human-facing number, e.g. `REN-SP-000301`. */
  number: string;
  customerId: string;
  name: string;
  location: string;
  address: string;
  emirate: Emirate;
  area: string;
  lat: number;
  lng: number;
  status: "active" | "inactive";
  accessNotes?: string;
  attributes: string[];
  containers: Container[];
  serviceLines: ServiceLine[];
};

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "en-route"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

export type AppointmentType = "initial" | "standard" | "reservice";
export type AppointmentServiceType =
  | "collection"
  | "delivery"
  | "swap"
  | "removal"
  | "inspection";
/** Recurring = generated from a service line; customer-request = booked ad hoc. */
export type AppointmentSource = "recurring" | "customer-request";

export type FailedReason =
  | "no_waste"
  | "access_blocked"
  | "service_refused"
  | "bin_not_out"
  | "contaminated";

export type CancelReason =
  | "customer_request"
  | "service_pro_unavailable"
  | "vehicle_breakdown"
  | "weather"
  | "other";

export type WorkOrder = {
  /** e.g. `WO-10412`. */
  ref: string;
  description: string;
  serviceItem: string;
  quantityPlanned: number;
  /** Recorded on completion; `null` until then. */
  quantityActual: number | null;
  uom: BillingUom;
};

/** A booked visit by a service pro to a service point. */
export type Appointment = {
  id: string;
  /** e.g. `APT-20412`. */
  ref: string;
  customerId: string;
  servicePointId: string;
  serviceLineId: string | null;
  type: AppointmentType;
  serviceType: AppointmentServiceType;
  stream: WasteStreamId;
  source: AppointmentSource;
  status: AppointmentStatus;
  window: ArrivalWindow;
  windowStart: string;
  windowEnd: string;
  /** Planned arrival inside the window. */
  plannedStart: string;
  durationMins: number;
  /** A `Technician` id — shown as the service pro. */
  serviceProId: string | null;
  vehiclePlate: string | null;
  workOrders: WorkOrder[];
  startedAt: string | null;
  completedAt: string | null;
  failedReason: FailedReason | null;
  cancelReason: CancelReason | null;
  notes?: string;
  /** Set on a reservice: the visit it follows up. */
  originalAppointmentId?: string;
  createdAt: string;
  /** A `User` id, or "system" for recurring generation. */
  bookedBy: string;
};
