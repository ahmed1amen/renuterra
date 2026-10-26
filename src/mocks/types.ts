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
  /** Drivers can be a route's primary; loaders and trainees ride along as crew. */
  role?: "driver" | "loader";
  /** Shift template id per weekday — what Autofill generates shifts from. */
  defaultSchedule?: Partial<Record<DayOfWeek, string>>;
  licences?: { type: LicenceType; expiresOn: string }[];
  teamId?: string | null;
};

export type LicenceType = "heavy_vehicle" | "hazmat" | "medical_waste";

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

/**
 * How a service pro physically handles a service item. It decides what gets
 * counted, where the weight comes from and what proof is captured.
 */
export type HandlingMethod =
  /** Bin stays on site and is emptied into the truck (lifts). */
  | "empty-on-site"
  /** Full container taken to a facility, tipped and returned or swapped (trips). */
  | "exchange"
  /** Sealed bags, boxes or drums taken away; empties left behind. */
  | "packaged"
  /** Tanker pumps liquid out of a tank or grease trap (litres). */
  | "pump-out"
  /** An empty container is delivered, removed or relocated. */
  | "logistics"
  /** Items taken for witnessed destruction and a certificate. */
  | "destruction";

export type VehicleClass =
  | "compactor"
  | "skip-loader"
  | "hook-loader"
  | "tanker"
  | "box-truck";

/** What the service pro counts on a work order. */
export type CountUnit =
  | "lift"
  | "trip"
  | "bag"
  | "box"
  | "drum"
  | "litre"
  | "container"
  | "kg";

/** Where a work order's actual weight comes from. */
export type WeightSource =
  /** Planned units × the item's kg per unit. */
  | "estimated"
  /** The route's weighbridge ticket split across its stops. */
  | "allocated"
  | "weighbridge"
  /** Hanging or platform scale on site. */
  | "scale"
  /** Tanker flow meter (litres, converted). */
  | "metered";

export type ContainerKind =
  | "bin"
  | "skip"
  | "roro"
  | "compactor"
  | "tank"
  | "drum"
  | "sharps-box"
  | "bag";

/** Catalogue entry for a kind and size of container. */
export type ContainerType = {
  id: string;
  /** e.g. "1100L wheelie bin". */
  name: string;
  kind: ContainerKind;
  capacityLitres: number;
  vehicleClass: VehicleClass;
  /**
   * Tracked containers are assets with a tag and a location. Untracked ones
   * (bags, sharps boxes, drums) are consumables counted on the work order.
   */
  tracked: boolean;
  active: boolean;
};

/** Catalogue entry for one service Renuterra sells and performs. */
export type ServiceItem = {
  id: string;
  /** e.g. `REL-1100-GEN`. Contract lines and work orders point at the id, never the text. */
  code: string;
  name: string;
  stream: WasteStreamId;
  method: HandlingMethod;
  containerTypeId: string | null;
  countUnit: CountUnit;
  /** Planning estimate used until a real weight is recorded. */
  estKgPerUnit: number;
  minutesPerUnit: number;
  vehicleClass: VehicleClass;
  /** Where the actual weight is expected to come from. `null` for logistics. */
  weightSource: WeightSource | null;
  /** Each unit carries a numbered seal (medical, hazardous). */
  requiresSeals: boolean;
  /** Consignment note / manifest travels with the waste (chain of custody). */
  requiresConsignmentNote: boolean;
  /** Left behind on each service, e.g. "Yellow bag". */
  consumable: string | null;
  active: boolean;
};

export type ContainerOwnership = "renuterra" | "customer";
export type ContainerLocation =
  | "on-site"
  | "in-transit"
  | "at-facility"
  | "in-depot"
  | "maintenance";

/** One physical, tagged container. */
export type Container = {
  id: string;
  /** Printed tag / barcode, e.g. `RT-1100-00412`. */
  tag: string;
  containerTypeId: string;
  /** Where it is placed; `null` while in the depot. */
  servicePointId: string | null;
  stream: WasteStreamId;
  ownership: ContainerOwnership;
  location: ContainerLocation;
  placedAt: string | null;
  lastServicedAt: string | null;
};

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type ServiceFrequency = "daily" | "weekly" | "monthly" | "on-call";
/** Arrival window: morning, afternoon, night, or anytime. */
export type ArrivalWindow = "AM" | "PM" | "night" | "AT";

/**
 * One contracted service at a service point — what recurring appointments are
 * generated from. Prices stay on the CRM contract; Field Ops needs quantities.
 */
export type ServiceLine = {
  id: string;
  serviceItemId: string;
  /** Units per visit, in the item's count unit. */
  quantity: number;
  frequency: ServiceFrequency;
  days: DayOfWeek[];
  window: ArrivalWindow;
  /** Tracked containers this line services. */
  containerIds: string[];
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

export type WorkOrderStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "partial"
  | "not-done"
  | "deferred"
  | "cancelled";

/** Why a work order fell short (partial or not done). */
export type ShortfallReason =
  | FailedReason
  | "vehicle_full"
  | "container_damaged"
  | "overweight";

/** Proof captured on close-out. Which fields apply depends on the handling method. */
export type WorkOrderEvidence = {
  /** empty-on-site: average fill level of the lifted containers. */
  fillLevelPct?: number;
  contamination?: boolean;
  /** exchange: tag of the full container taken and the one left. */
  containerOut?: string;
  containerIn?: string;
  weighbridgeTicket?: string;
  facility?: string;
  /** packaged: one seal number per unit. */
  seals?: string[];
  /** packaged / pump-out / destruction: consignment note or manifest. */
  consignmentNote?: string;
  consumablesLeft?: number;
  photos?: number;
};

/** One unit of work on an appointment: a service item, how much, and what happened. */
export type WorkOrder = {
  id: string;
  /** e.g. `WO-10412`. */
  ref: string;
  serviceItemId: string;
  /** Copied from the item at booking so later renames don't rewrite history. */
  itemCode: string;
  itemName: string;
  stream: WasteStreamId;
  method: HandlingMethod;
  countUnit: CountUnit;
  status: WorkOrderStatus;
  origin: "planned" | "added-on-site";
  containerIds: string[];
  countPlanned: number;
  /** `null` until recorded. */
  countDone: number | null;
  weightEstKg: number;
  /** `null` until recorded, and for logistics. */
  weightKg: number | null;
  weightSource: WeightSource | null;
  startedAt: string | null;
  completedAt: string | null;
  reason: ShortfallReason | null;
  evidence: WorkOrderEvidence;
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
  /**
   * The route this visit is on; its service pro is the route's primary.
   * `null` = not routed yet (backlog).
   */
  routeId: string | null;
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

export type VehicleStatus = "in-service" | "maintenance" | "out-of-service";

/** A truck. Its class decides which service items it can carry. */
export type Vehicle = {
  id: string;
  plate: string;
  vehicleClass: VehicleClass;
  /** Payload. */
  capacityKg: number;
  status: VehicleStatus;
};

export type RouteCrewRole = "secondary" | "trainee";

/** A trip to a disposal facility to empty the truck mid-route. */
export type TippingTrip = {
  id: string;
  /** The stop after which the truck goes to tip. */
  afterAppointmentId: string;
  facility: string;
  plannedStart: string;
  durationMins: number;
};

/**
 * One day's run: a name and a primary service pro who works through its
 * appointments in order, plus optional crew, the truck and tipping trips.
 */
export type Route = {
  id: string;
  name: string;
  /** Dubai calendar day, `2026-09-04`. */
  date: string;
  /** A `Technician` id — owns the route and every appointment on it. */
  primaryServiceProId: string;
  crew: { serviceProId: string; role: RouteCrewRole }[];
  vehicleId: string | null;
  /** Local `HH:mm`; `24:00` for a run that ends at midnight. */
  startTime: string;
  endTime: string;
  maxStops: number;
  /** Index into the route colour palette. */
  colorIndex: number;
  /** Stops in the order they're driven. */
  appointmentIds: string[];
  tippingTrips: TippingTrip[];
  estimatedKm: number;
  estimatedDriveMins: number;
  lockedAt: string | null;
  lockedBy: string | null;
};

/** What kind of availability a shift gives. Leave = not available that day. */
export type ShiftType = "day" | "night" | "on-call" | "training" | "leave";

/** A reusable daily window, e.g. "Night 20:00–04:00". */
export type ShiftTemplate = {
  id: string;
  name: string;
  type: ShiftType;
  /** Local `HH:mm`. An end before the start runs past midnight. */
  startTime: string;
  endTime: string;
  active: boolean;
};

/**
 * A service pro's availability on one day. Only pros with a working shift
 * that day can be on a route.
 */
export type Shift = {
  id: string;
  serviceProId: string;
  /** Dubai calendar day the shift starts on, `2026-09-04`. */
  date: string;
  type: ShiftType;
  /** `null` for leave. An end before the start runs past midnight. */
  startTime: string | null;
  endTime: string | null;
  templateId: string | null;
  /** Supervising pro on a training shift. */
  trainerId: string | null;
  note?: string;
};
