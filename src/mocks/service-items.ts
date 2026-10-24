import data from "./data/service-items.json";
import type { ServiceItem } from "./types";

export const SERVICE_ITEMS = data as ServiceItem[];

export function findServiceItem(id: string | null | undefined) {
  return id ? SERVICE_ITEMS.find((item) => item.id === id) : undefined;
}
