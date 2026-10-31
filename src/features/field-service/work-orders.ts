import type { ServiceItem, WorkOrder, WorkOrderStatus } from "@/mocks";

let workOrderSeq = 40000;

/** Statuses after which nothing more happens on a work order. */
export const CLOSED_WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  "completed",
  "partial",
  "not-done",
  "deferred",
  "cancelled",
];

export function isWorkOrderClosed(wo: WorkOrder) {
  return CLOSED_WORK_ORDER_STATUSES.includes(wo.status);
}

/** A fresh work order for a service item: fake ref, planned weight from the item's estimate. */
export function newWorkOrder(
  item: ServiceItem,
  count: number,
  containerIds: string[] = [],
  origin: WorkOrder["origin"] = "planned",
): WorkOrder {
  const seq = workOrderSeq++;
  return {
    id: `wo_${seq}`,
    ref: `WO-${seq}`,
    serviceItemId: item.id,
    itemCode: item.code,
    itemName: item.name,
    stream: item.stream,
    method: item.method,
    countUnit: item.countUnit,
    status: "scheduled",
    origin,
    containerIds,
    countPlanned: count,
    countDone: null,
    weightEstKg: Math.round(count * item.estKgPerUnit * 10) / 10,
    weightKg: null,
    weightSource: null,
    startedAt: null,
    completedAt: null,
    reason: null,
    evidence: {},
  };
}

/** Completed when everything planned was done, not done when nothing was, partial between. */
export function outcomeFor(
  countDone: number,
  countPlanned: number,
): Extract<WorkOrderStatus, "completed" | "partial" | "not-done"> {
  if (countDone <= 0) return "not-done";
  return countDone >= countPlanned ? "completed" : "partial";
}
