"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StreamTag } from "@/components/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDirectory } from "@/features/field-service";
import type { Appointment } from "@/mocks";
import { formatDate, formatWindowRange } from "../utils";
import {
  APPOINTMENT_TYPE,
  AppointmentStatusPill,
  SERVICE_TYPE_LABEL,
  WINDOW_LABEL,
} from "./appointment-meta";

/** Appointment rows; click anywhere on a row to open the appointment. */
export function AppointmentsTable({
  appointments,
  showCustomer = true,
}: {
  appointments: Appointment[];
  /** Hide the customer line when the table already sits on a customer. */
  showCustomer?: boolean;
}) {
  const router = useRouter();
  const directory = useDirectory();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Appointment</TableHead>
          <TableHead>When</TableHead>
          <TableHead>{showCustomer ? "Customer" : "Service point"}</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Service pro</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((apt) => {
          const customer = directory.customer(apt.customerId);
          const site = directory.servicePoint(apt.servicePointId);
          const pro = directory.servicePro(apt.serviceProId);
          const href = `/field-service/appointments/${apt.id}`;
          return (
            <TableRow
              key={apt.id}
              className="cursor-pointer"
              onClick={() => router.push(href)}
            >
              <TableCell>
                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  className="font-mono text-xs font-medium hover:underline"
                >
                  {apt.ref}
                </Link>
                <span className="text-muted-foreground block text-xs">
                  {SERVICE_TYPE_LABEL[apt.serviceType]}
                  {apt.type !== "standard"
                    ? ` · ${APPOINTMENT_TYPE[apt.type].label}`
                    : ""}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className="block text-sm">
                  {formatDate(apt.windowStart)}
                </span>
                <span className="text-muted-foreground block font-mono text-xs tabular-nums">
                  {WINDOW_LABEL[apt.window]} ·{" "}
                  {formatWindowRange(apt.windowStart, apt.windowEnd)}
                </span>
              </TableCell>
              <TableCell className="max-w-64">
                {showCustomer ? (
                  <span className="block truncate text-sm font-medium">
                    {customer?.name ?? "—"}
                  </span>
                ) : null}
                <span
                  className={
                    showCustomer
                      ? "text-muted-foreground block truncate text-xs"
                      : "block truncate text-sm font-medium"
                  }
                >
                  {site?.location ?? "—"}
                  {site ? ` · ${site.area}` : ""}
                </span>
              </TableCell>
              <TableCell>
                <StreamTag stream={apt.stream} />
                <span className="text-muted-foreground mt-1 block font-mono text-[11px]">
                  {apt.workOrders[0]?.itemCode}
                  {apt.workOrders.length > 1
                    ? ` +${apt.workOrders.length - 1}`
                    : ""}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {pro ? (
                  pro.name
                ) : (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell>
                <AppointmentStatusPill status={apt.status} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
