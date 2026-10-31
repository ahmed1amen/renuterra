import type { RouteContext } from "@/features/field-service";
import type { RouteAssignment } from "@/mocks";

export const ASSET_TYPE_LABEL: Record<RouteAssignment["assetType"], string> = {
  truck: "Truck",
  driver: "Driver",
  helper: "Helper",
};

/** Plate for trucks, name for people. */
export function assetName(a: RouteAssignment, ctx: RouteContext) {
  if (a.assetType === "truck")
    return ctx.vehicles.find((v) => v.id === a.assetId)?.plate ?? a.assetId;
  return ctx.pros.find((p) => p.id === a.assetId)?.name ?? a.assetId;
}
