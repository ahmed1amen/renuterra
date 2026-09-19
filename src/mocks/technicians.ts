import data from "./data/technicians.json";
import type { Technician } from "./types";

export const TECHNICIANS = data as Technician[];

export function findTechnician(id: string | null | undefined) {
  return id ? TECHNICIANS.find((t) => t.id === id) : undefined;
}
