import { Badge } from "@/components/ui/badge";
import type { PrototypeStatus } from "../registry";

const VARIANTS: Record<
  PrototypeStatus,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  draft: { label: "Draft", variant: "outline" },
  review: { label: "In review", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
};

export function StatusBadge({ status }: { status: PrototypeStatus }) {
  const { label, variant } = VARIANTS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
