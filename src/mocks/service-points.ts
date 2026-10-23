import data from "./data/service-points.json";
import type { ServicePoint } from "./types";

export const SERVICE_POINTS = data as ServicePoint[];

export function findServicePoint(id: string | null | undefined) {
  return id ? SERVICE_POINTS.find((sp) => sp.id === id) : undefined;
}
