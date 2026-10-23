import { StatusPill, type StatusTone } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import type {
  ContactRole,
  ContainerType,
  CustomerFlag,
  CustomerStatus,
  CustomerTier,
  ServiceFrequency,
} from "@/mocks";

export const CUSTOMER_STATUS: Record<
  CustomerStatus,
  { label: string; tone: StatusTone }
> = {
  active: { label: "Active", tone: "success" },
  passive: { label: "Passive", tone: "neutral" },
};

export function CustomerStatusPill({ status }: { status: CustomerStatus }) {
  const s = CUSTOMER_STATUS[status];
  return (
    <StatusPill tone={s.tone} dot>
      {s.label}
    </StatusPill>
  );
}

export const TIER_LABEL: Record<CustomerTier, string> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

const FLAG: Record<CustomerFlag, { label: string; tone: StatusTone }> = {
  vip: { label: "VIP", tone: "info" },
  new_customer: { label: "New customer", tone: "success" },
  at_risk: { label: "At risk", tone: "warning" },
  do_not_service: { label: "Do not service", tone: "destructive" },
  past_due: { label: "Past due", tone: "warning" },
};

export function CustomerFlags({ flags }: { flags: CustomerFlag[] }) {
  if (!flags.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag} variant={FLAG[flag].tone}>
          {FLAG[flag].label}
        </Badge>
      ))}
    </span>
  );
}

export const CONTACT_ROLE: Record<ContactRole, string> = {
  "decision-maker": "Decision maker",
  operations: "Operations",
  finance: "Finance",
  billing: "Billing",
  sales: "Sales",
  technical: "Technical",
};

export const CONTAINER_TYPE: Record<ContainerType, string> = {
  bin: "Bin",
  skip: "Skip",
  roro: "RORO",
  compactor: "Compactor",
  drum: "Drum",
  "sharps-box": "Sharps box",
};

export const FREQUENCY_LABEL: Record<ServiceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  "on-call": "On call",
};
