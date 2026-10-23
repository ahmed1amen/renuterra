import data from "./data/customers.json";
import type { Customer } from "./types";

export const CUSTOMERS = data as Customer[];

export function findCustomer(id: string | null | undefined) {
  return id ? CUSTOMERS.find((c) => c.id === id) : undefined;
}
