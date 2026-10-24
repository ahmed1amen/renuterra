import {
  ArrowLeftRight,
  Ban,
  CircleCheck,
  CircleDashed,
  CircleSlash,
  Clock,
  Droplets,
  Flame,
  type LucideIcon,
  Package,
  Redo2,
  Trash2,
  Truck,
} from "lucide-react";
import { StatusPill, type StatusTone } from "@/components/shared";
import type {
  ContainerKind,
  ContainerLocation,
  CountUnit,
  HandlingMethod,
  ShortfallReason,
  VehicleClass,
  WeightSource,
  WorkOrderStatus,
} from "@/mocks";
import { FAILED_REASON } from "./appointment-meta";

export const WORK_ORDER_STATUS: Record<
  WorkOrderStatus,
  { label: string; tone: StatusTone; icon: LucideIcon }
> = {
  scheduled: { label: "Scheduled", tone: "neutral", icon: Clock },
  "in-progress": { label: "In progress", tone: "info", icon: CircleDashed },
  completed: { label: "Completed", tone: "success", icon: CircleCheck },
  partial: { label: "Partial", tone: "warning", icon: CircleSlash },
  "not-done": { label: "Not done", tone: "destructive", icon: Ban },
  deferred: { label: "Deferred", tone: "neutral", icon: Redo2 },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
};

export const WORK_ORDER_STATUS_ORDER: WorkOrderStatus[] = [
  "scheduled",
  "in-progress",
  "completed",
  "partial",
  "not-done",
  "deferred",
  "cancelled",
];

export function WorkOrderStatusPill({ status }: { status: WorkOrderStatus }) {
  const s = WORK_ORDER_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

/** What each handling method means on the ground — shown in the catalogue and on work orders. */
export const HANDLING_METHOD: Record<
  HandlingMethod,
  { label: string; icon: LucideIcon; description: string }
> = {
  "empty-on-site": {
    label: "Empty on site",
    icon: Trash2,
    description: "Bin stays on site and is emptied into the truck.",
  },
  exchange: {
    label: "Exchange",
    icon: ArrowLeftRight,
    description:
      "Full container goes to a facility to be tipped, then returned or swapped.",
  },
  packaged: {
    label: "Packaged pickup",
    icon: Package,
    description:
      "Sealed bags, boxes or drums are taken away and empties left behind.",
  },
  "pump-out": {
    label: "Pump-out",
    icon: Droplets,
    description: "A tanker pumps liquid out of a tank or grease trap.",
  },
  logistics: {
    label: "Container logistics",
    icon: Truck,
    description: "An empty container is delivered, removed or checked.",
  },
  destruction: {
    label: "Secure destruction",
    icon: Flame,
    description: "Items are taken for witnessed destruction and a certificate.",
  },
};

export const HANDLING_METHOD_ORDER = Object.keys(
  HANDLING_METHOD,
) as HandlingMethod[];

const UNIT: Record<CountUnit, [one: string, many: string]> = {
  lift: ["lift", "lifts"],
  trip: ["trip", "trips"],
  bag: ["bag", "bags"],
  box: ["box", "boxes"],
  drum: ["drum", "drums"],
  litre: ["litre", "litres"],
  container: ["container", "containers"],
  kg: ["kg", "kg"],
};

/** "3 lifts", "1 bag", "2,000 litres". */
export function formatCountUnit(count: number, unit: CountUnit) {
  const [one, many] = UNIT[unit];
  return `${count.toLocaleString("en-AE")} ${count === 1 ? one : many}`;
}

export function unitLabel(unit: CountUnit) {
  return UNIT[unit][1];
}

export const WEIGHT_SOURCE: Record<
  WeightSource,
  { label: string; description: string }
> = {
  estimated: {
    label: "Estimated",
    description: "Units × the item's kg per unit, until a real weight lands.",
  },
  allocated: {
    label: "Route ticket",
    description: "The route's weighbridge ticket split across its stops.",
  },
  weighbridge: {
    label: "Weighbridge",
    description: "Net weight from the facility's weighbridge ticket.",
  },
  scale: { label: "On-site scale", description: "Weighed by the service pro." },
  metered: {
    label: "Tanker meter",
    description: "Litres from the flow meter.",
  },
};

export const SHORTFALL_REASON: Record<ShortfallReason, string> = {
  ...FAILED_REASON,
  vehicle_full: "Vehicle full",
  container_damaged: "Container damaged",
  overweight: "Overweight",
};

export const VEHICLE_CLASS: Record<VehicleClass, string> = {
  compactor: "Compactor",
  "skip-loader": "Skip loader",
  "hook-loader": "Hook loader",
  tanker: "Tanker",
  "box-truck": "Box truck",
};

export const CONTAINER_KIND: Record<ContainerKind, string> = {
  bin: "Bin",
  skip: "Skip",
  roro: "RORO",
  compactor: "Static compactor",
  tank: "Tank",
  drum: "Drum",
  "sharps-box": "Sharps box",
  bag: "Bag",
};

export const CONTAINER_LOCATION: Record<
  ContainerLocation,
  { label: string; tone: StatusTone }
> = {
  "on-site": { label: "On site", tone: "success" },
  "in-transit": { label: "In transit", tone: "info" },
  "at-facility": { label: "At facility", tone: "info" },
  "in-depot": { label: "In depot", tone: "neutral" },
  maintenance: { label: "Maintenance", tone: "warning" },
};

/** Where exchanged containers are tipped. Stand-in until facilities get their own screen. */
export const DISPOSAL_FACILITIES = [
  "Dubai Investment Park Landfill",
  "Al Lusaily C&D Landfill",
  "Al Qusais Material Recovery Facility",
  "Warsan Waste-to-Energy Plant",
  "Bee'ah Al Sajaa Waste Management Complex",
];
