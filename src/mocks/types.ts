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
  /** Shift template id per weekday: what Autofill generates shifts from. */
  defaultSchedule?: Partial<Record<DayOfWeek, string>>;
  licences?: { type: LicenceType; expiresOn: string }[];
  teamId?: string | null;
  employeeId?: string;
  entity?: EntityCode;
  /** Skill codes from the master (LIC-HGV, OP-REL, CITY-DXB, SHIFT-NIGHT…). */
  skillCodes?: { code: string; expiresOn: string | null }[];
};

export type LicenceType = "heavy_vehicle" | "hazmat" | "medical_waste";

// ---------------------------------------------------------------------------
// Field Ops: customers, service points and appointments.
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
  /** Fine-grained waste code (`GEN`, `MDR`, `MED`…); `null` for logistics. */
  wasteCode: string | null;
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
 * One contracted service at a service point: what recurring appointments are
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
  /** Operating company that serves and bills it: medical is GGM, hazardous GGH. */
  entity: EntityCode;
  /**
   * When the stop may happen: before / after a time, a range, or any time.
   * Lives on the line, not the customer: one site can have several.
   */
  timeWindow: TimeWindow;
  /** Overrides the route's fill-rate assumption for this line (0–1). */
  fillRate: number | null;
  /** Contract state from the CRM; anything but active is skipped at generation. */
  contractStatus: "active" | "expired" | "suspended" | "credit-hold";
};

export type TimeWindow =
  | { kind: "none" }
  | { kind: "before"; to: string }
  | { kind: "after"; from: string }
  | { kind: "range"; from: string; to: string };

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

/** Why a visit moved to another day: report 3 groups missed and rescheduled stops by it. */
export type RescheduleReason =
  | "customer_request"
  | "access_issue"
  | "vehicle_full"
  | "ran_out_of_shift"
  | "weather"
  | "ops_decision";

/** The last time a visit moved: why, who asked, and from which day. */
export type RescheduleRecord = {
  reason: RescheduleReason;
  requestedBy: "customer" | "operations";
  /** Dubai day it was on before. */
  fromDay: string;
  at: string;
};

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
   * The route instance (one route's run on one day) this visit is a stop on;
   * its service pro is the instance's driver. `null` = backlog.
   */
  routeInstanceId: string | null;
  workOrders: WorkOrder[];
  startedAt: string | null;
  completedAt: string | null;
  failedReason: FailedReason | null;
  cancelReason: CancelReason | null;
  /** Set when the visit was moved to another day. */
  rescheduled?: RescheduleRecord | null;
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
  /** Truck-type master id, e.g. `REL-25`. */
  truckTypeId: string;
  /** Registered company; `null` = shared pool usable by any entity. */
  entity: EntityCode | null;
  /** Payload. */
  capacityKg: number;
  status: VehicleStatus;
  /** Cities the truck is permitted to work in. */
  permits: CityCode[];
  registrationExpiry: string;
  insuranceExpiry: string;
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
export type RouteInstanceStatus =
  | "planned"
  | "unstaffed"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "partial"
  | "cancelled";

/** How an instance's truck / driver / helper slot got filled (spec section 4.3). */
export type StaffingSource = "primary" | "backup" | "pool" | "manual";

/**
 * One execution of a Route on one date and shift: what the driver works,
 * dispatch monitors and billing reconciles. Generated from the Route.
 * Id: `[RouteCode]-[YYYYMMDD]-[M|N]`.
 */
export type RouteInstance = {
  id: string;
  /** The Route (template) it was generated from; `null` for a one-off. */
  routeId: string | null;
  routeVersion: number;
  name: string;
  /** Dubai calendar day, `2026-09-04`. */
  date: string;
  shiftId: RouteShiftId;
  status: RouteInstanceStatus;
  /** The driver: `null` while the slot is unstaffed. */
  primaryServiceProId: string | null;
  crew: { serviceProId: string; role: RouteCrewRole }[];
  vehicleId: string | null;
  /** Where each filled slot came from; keys are `truck`, `driver`, `helper-1`… */
  staffing: Record<string, StaffingSource>;
  /** Helper slots the Route requires; unfilled ones keep the instance Unstaffed. */
  helpersRequired: number;
  /** Generation flags: unstaffed slots, over capacity, stops outside windows. */
  flags: InstanceFlag[];
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
  /** Set when the instance is confirmed; `undefined` before that. */
  forecastSnapshot?: CapacitySnapshot | null;
  /** Set when the dispatcher closes the run (spec section 6.1, R17, R18). */
  closure?: InstanceClosure | null;
  /** Set when the run is cancelled; the record is kept, never deleted (spec section 6.2 rule 8). */
  cancellation?: {
    reason: RunCancelReason;
    note: string;
    at: string;
    by: string;
  } | null;
  /** Trips (cycles) added to resolve Over capacity, and who accepted them (R16). */
  extraTrips?: { count: number; acceptedBy: string; at: string } | null;
};

/** Why a whole run was cancelled (spec section 6.2 rules 5 and 8). */
export type RunCancelReason =
  | "public_holiday"
  | "vehicle_breakdown"
  | "weather"
  | "customer_closure"
  | "no_stops"
  | "other";

/** A dated correction to a closed run: closed runs are never edited (R18). */
export type RunAdjustment = { at: string; by: string; note: string };

/**
 * Closing a run locks its actuals and releases them to billing and costing
 * (spec section 6.1). Every stop must be completed, missed with a reason or
 * rescheduled first (R17).
 */
export type InstanceClosure = {
  at: string;
  /** A `User` id. */
  by: string;
  odometerOut: number | null;
  odometerIn: number | null;
  /** One per disposal site tipped at: the weighbridge ticket and its net weight. */
  tipTickets: { facility: string; ticket: string; netKg: number | null }[];
  /** What the run actually carried per truck limit, frozen at closure. */
  actual: {
    kind: SnapshotLimit["kind"];
    unit: SnapshotLimit["unit"];
    value: number;
  }[];
  /** Stops missed or rescheduled in the closing sheet. */
  resolved: { appointmentId: string; outcome: "missed" | "rescheduled" }[];
  note: string;
  adjustments: RunAdjustment[];
};

/** What kind of availability a shift gives. Leave = not available that day. */
export type ShiftType = "morning" | "night" | "on-call" | "training" | "leave";

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

// ---------------------------------------------------------------------------
// Route model: docs/product/specs/route-definition.md. A Route is a standing
// template; instances are generated from it per dispatch day.
// ---------------------------------------------------------------------------

/** Operating companies: waste collection, hazardous, medical. */
export type EntityCode = "RWC" | "GGH" | "GGM";
export type CityCode = "DXB" | "AUH" | "SHJ" | "AJM" | "FUJ" | "RAK" | "UAQ";
export type ServiceTypeCode =
  | "REL"
  | "SKIP"
  | "HOOK"
  | "COMP"
  | "MED"
  | "HAZ"
  | "WWT";
export type CapacityBasis = "volume" | "visits" | "weight";
export type RouteShiftId = "MORNING" | "NIGHT";
export type RouteStatus = "draft" | "active" | "suspended" | "retired";
export type SchedulePattern =
  | "daily"
  | "weekdays"
  | "weekly"
  | "alternate"
  | "custom";

export type OperatingEntity = { code: EntityCode; name: string };
export type City = { code: CityCode; name: string };
export type Depot = {
  id: string;
  name: string;
  city: CityCode;
  lat: number;
  lng: number;
};
export type DisposalSite = {
  id: string;
  name: string;
  city: CityCode;
  kind:
    | "landfill"
    | "transfer"
    | "mrf"
    | "organics"
    | "cnd"
    | "treatment"
    | "wastewater";
  /** Waste codes the site accepts. */
  wasteCodes: string[];
  lat: number;
  lng: number;
};
export type ServiceTypeDef = {
  code: ServiceTypeCode;
  name: string;
  capacityBasis: CapacityBasis;
  /** Default helper count for a new Route of this type. */
  defaultHelpers: number;
  /** Skill codes every driver on this service type needs. */
  requiredSkills: string[];
};
export type TruckType = {
  id: string;
  name: string;
  serviceTypes: ServiceTypeCode[];
  capacityBasis: CapacityBasis;
  /** Compacting bodies: m³ and compression (1:5 for REL). */
  bodyM3: number | null;
  compressionRatio: number | null;
  payloadKg: number;
  /** Secured container slots (medical / hazardous). */
  containerSlots: number | null;
};
export type SkillCode = {
  code: string;
  name: string;
  evidence: string;
  expiryTracked: boolean;
};
/** Fine-grained waste code; `group` is the stream colour and ESG bucket. */
export type WasteCode = {
  code: string;
  name: string;
  group: WasteStreamId;
  /** Codes it may share a truck body with on the same trip. */
  coCollectWith: string[];
};
export type RouteShift = {
  id: RouteShiftId;
  name: string;
  startTime: string;
  endTime: string;
};

/** Every admin-maintained lookup list the Route model depends on (spec section 7). */
export type OpsMasters = {
  entities: OperatingEntity[];
  cities: City[];
  depots: Depot[];
  disposalSites: DisposalSite[];
  serviceTypes: ServiceTypeDef[];
  truckTypes: TruckType[];
  skillCodes: SkillCode[];
  wasteCodes: WasteCode[];
  shifts: RouteShift[];
};

/** A recurring run: what, where, with which truck and driver, when. */
export type Route = {
  id: string;
  /** `[Entity]-[City]-[ServiceType]-[NNN]`, immutable once Active. */
  code: string;
  name: string;
  entity: EntityCode;
  serviceType: ServiceTypeCode;
  city: CityCode;
  zone: string | null;
  /** First is the required type, the rest are allowed alternates. */
  truckTypeIds: string[];
  requiredSkills: string[];
  wasteCodes: string[];
  coCollection: boolean;
  schedule: {
    pattern: SchedulePattern;
    /** Weekly / custom days; ignored for daily and weekdays. */
    days: DayOfWeek[];
    /** Alternate days count from here. */
    anchorDate: string | null;
  };
  shiftId: RouteShiftId;
  startTime: string;
  endTime: string;
  depotId: string;
  disposalSiteIds: string[];
  helpers: number;
  plannedTrips: number;
  /** Exchange routes: visits that fit in a shift. */
  plannedVisits: number | null;
  /** Standard 0.8; a service line can override it. */
  fillRate: number;
  status: RouteStatus;
  validFrom: string;
  validTo: string | null;
  /** Operations supervisor accountable (a `User` id). */
  ownerId: string;
  version: number;
  colorIndex: number;
  /** Attached service lines in stop order. Each line sits on one Route. */
  serviceLineIds: string[];
};

/** Staffs a Route: one asset, primary or ranked backup, on some days. */
export type RouteAssignment = {
  id: string;
  routeId: string;
  assetType: "truck" | "driver" | "helper";
  /** Vehicle id for trucks, `Technician` id for people. */
  assetId: string;
  role: "primary" | "backup";
  /** 0 for primaries, 1 = first backup… */
  rank: number;
  /** Empty = every Route day. */
  days: DayOfWeek[];
  validFrom: string;
  validTo: string | null;
  status: "active" | "suspended";
};

/**
 * One past visit of a service line, before the live fixtures start: the
 * history the suggested fill rate and the forecasting assistant learn from
 * (spec section 8.2 and section 8.5 rule 4).
 */
export type VisitRecord = {
  id: string;
  serviceLineId: string;
  servicePointId: string;
  serviceItemId: string;
  /** Dubai calendar day. */
  date: string;
  countPlanned: number;
  countDone: number;
  /** empty-on-site only: the driver's average fill level, in 5% steps. */
  fillLevelPct: number | null;
  weightKg: number | null;
  weightSource: WeightSource | null;
};

/** One truck limit as planned when the instance was confirmed. */
export type SnapshotLimit = {
  kind: "volume" | "weight" | "slots" | "visits";
  unit: "m³" | "kg" | "slots" | "visits";
  capacity: number;
  forecast: number;
  worstCase: number;
};

/**
 * The forecast frozen at Confirm, so forecast vs actual can be measured after
 * the run even if fill rates, the truck or the stops change later.
 */
export type CapacitySnapshot = {
  at: string;
  truckTypeId: string | null;
  limits: SnapshotLimit[];
  /** The binding limit's forecast utilisation, %. */
  forecastPct: number;
  /** Fill rate used for each stop's volume (empty-on-site stops only). */
  fillRates: Record<string, number>;
};

export type InstanceFlag =
  | { kind: "unstaffed"; slot: string }
  | {
      kind: "over-capacity";
      utilisation: number;
      /** The truck limit that is exceeded (volume, payload, slots, visits). */
      limit?: "volume" | "weight" | "slots" | "visits";
    }
  | { kind: "outside-window"; appointmentId: string }
  | { kind: "contract-skipped"; serviceLineId: string; reason: string }
  | { kind: "substitute"; slot: string; source: StaffingSource }
  /** An assigned truck or person was skipped: they fail an eligibility check (R4, R5). */
  | { kind: "ineligible"; slot: string; assetId: string; reason: string };
