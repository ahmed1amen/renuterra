"use client";

import { CalendarPlus, OctagonAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { StreamTag } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAppointmentStore,
  useCustomers,
  useServiceItems,
  useServicePoints,
  useTechnicians,
} from "@/features/field-service";
import type {
  AppointmentServiceType,
  ArrivalWindow,
  Customer,
  ServicePoint,
} from "@/mocks";
import {
  type BookingPreset,
  useBookAppointmentModal,
} from "@/stores/book-appointment-modal";
import { addDays, dubaiDateTime, formatKg, TODAY, toDayKey } from "../utils";
import {
  APPOINTMENT_TYPE,
  SERVICE_TYPE_LABEL,
  WINDOW_HOURS,
  WINDOW_LABEL,
} from "./appointment-meta";
import { FREQUENCY_LABEL } from "./customer-meta";
import { ChoiceChips, Field } from "./form-field";
import { formatCountUnit } from "./work-order-meta";

const SERVICE_TYPES = (
  Object.keys(SERVICE_TYPE_LABEL) as AppointmentServiceType[]
).map((id) => ({ id, label: SERVICE_TYPE_LABEL[id] }));

const WINDOWS = (Object.keys(WINDOW_LABEL) as ArrivalWindow[]).map((id) => ({
  id,
  label: WINDOW_LABEL[id],
}));

/**
 * Book a visit for a customer: pick the service point and contracted service,
 * then when and who. Mounted once per screen; opened through
 * `useBookAppointmentModal` so callers can pre-fill the customer or service point.
 *
 * Prototype-grade: the booking goes into the session store and shows up in
 * every appointment list until reload. No slot checks or capacity rules.
 */
export function BookAppointmentDialog() {
  const { open, preset, close } = useBookAppointmentModal();
  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      {open ? <BookingForm preset={preset} onDone={close} /> : null}
    </Dialog>
  );
}

function BookingForm({
  preset,
  onDone,
}: {
  preset: BookingPreset;
  onDone: () => void;
}) {
  const id = useId();
  const router = useRouter();
  const book = useAppointmentStore((s) => s.book);
  const customers = useCustomers();
  const servicePoints = useServicePoints();
  const pros = useTechnicians();
  const serviceItems = useServiceItems();
  const itemOf = (id: string) => serviceItems.data?.find((i) => i.id === id);

  const [customerId, setCustomerId] = useState(preset.customerId ?? "");
  const [servicePointId, setServicePointId] = useState(
    preset.servicePointId ?? "",
  );
  const [serviceLineId, setServiceLineId] = useState(
    preset.serviceLineId ?? "",
  );
  const [serviceType, setServiceType] =
    useState<AppointmentServiceType>("collection");
  const [day, setDay] = useState(toDayKey(addDays(TODAY, 1)));
  const [arrivalWindow, setArrivalWindow] = useState<ArrivalWindow | null>(
    null,
  );
  const [serviceProId, setServiceProId] = useState("");
  const [notes, setNotes] = useState("");

  const customer: Customer | undefined = customers.data?.find(
    (c) => c.id === customerId,
  );
  const servicePointsForCustomer = useMemo(
    () =>
      (servicePoints.data ?? []).filter(
        (sp) => sp.customerId === customerId && sp.status === "active",
      ),
    [servicePoints.data, customerId],
  );
  const servicePoint: ServicePoint | undefined = servicePointsForCustomer.find(
    (sp) => sp.id === servicePointId,
  );
  const line = servicePoint?.serviceLines.find((l) => l.id === serviceLineId);
  const item = line ? itemOf(line.serviceItemId) : undefined;
  // Default the window to the contracted one until the user picks another.
  const effectiveWindow = arrivalWindow ?? line?.window ?? "AM";
  const type = preset.type ?? "standard";
  const blocked = customer?.flags.includes("do_not_service") ?? false;
  const ready =
    Boolean(customer && servicePoint && line && item && day) && !blocked;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!customer || !servicePoint || !line || !item) return;

    const [from, to] = WINDOW_HOURS[effectiveWindow];
    const appointment = book({
      customerId: customer.id,
      servicePointId: servicePoint.id,
      serviceLine: line,
      serviceItem: item,
      type,
      serviceType,
      window: effectiveWindow,
      windowStart: dubaiDateTime(day, from),
      windowEnd: dubaiDateTime(day, to),
      serviceProId: serviceProId || null,
      notes: notes.trim() || undefined,
      originalAppointmentId: preset.originalAppointmentId,
    });
    onDone();
    toast.success(`${appointment.ref} booked`, {
      description: `${servicePoint.name} · ${WINDOW_LABEL[effectiveWindow]}`,
      action: {
        label: "View",
        onClick: () =>
          router.push(`/field-service/appointments/${appointment.id}`),
      },
    });
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={submit} className="grid gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-4" aria-hidden />
            {type === "standard"
              ? "Book appointment"
              : `Book ${APPOINTMENT_TYPE[type].label.toLowerCase()} visit`}
          </DialogTitle>
          <DialogDescription>
            Schedule a service pro to visit one of the customer's service
            points.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          <Field label="Customer" htmlFor={`${id}-customer`}>
            <NativeSelect
              id={`${id}-customer`}
              className="w-full"
              value={customerId}
              disabled={Boolean(preset.customerId)}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setServicePointId("");
                setServiceLineId("");
              }}
            >
              <NativeSelectOption value="">
                Select a customer…
              </NativeSelectOption>
              {(customers.data ?? [])
                .filter((c) => c.status === "active")
                .map((c) => (
                  <NativeSelectOption key={c.id} value={c.id}>
                    {c.name}
                  </NativeSelectOption>
                ))}
            </NativeSelect>
          </Field>

          {blocked ? (
            <Alert variant="destructive">
              <OctagonAlert aria-hidden />
              <AlertTitle>Do not service</AlertTitle>
              <AlertDescription>
                This customer is on hold. Clear the flag with the account
                manager before booking.
              </AlertDescription>
            </Alert>
          ) : null}

          <Field
            label="Service point"
            htmlFor={`${id}-sp`}
            hint={
              customer && !servicePointsForCustomer.length
                ? "This customer has no active service points."
                : undefined
            }
          >
            <NativeSelect
              id={`${id}-sp`}
              className="w-full"
              value={servicePointId}
              disabled={!customer}
              onChange={(e) => {
                setServicePointId(e.target.value);
                setServiceLineId("");
              }}
            >
              <NativeSelectOption value="">
                Select a service point…
              </NativeSelectOption>
              {servicePointsForCustomer.map((sp) => (
                <NativeSelectOption key={sp.id} value={sp.id}>
                  {sp.location} — {sp.area}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Service" htmlFor={`${id}-line`}>
            <NativeSelect
              id={`${id}-line`}
              className="w-full"
              value={serviceLineId}
              disabled={!servicePoint}
              onChange={(e) => {
                setServiceLineId(e.target.value);
                setArrivalWindow(null);
              }}
            >
              <NativeSelectOption value="">
                Select a service…
              </NativeSelectOption>
              {servicePoint?.serviceLines.map((l) => {
                const lineItem = itemOf(l.serviceItemId);
                return (
                  <NativeSelectOption key={l.id} value={l.id}>
                    {lineItem?.name ?? l.serviceItemId} ·{" "}
                    {FREQUENCY_LABEL[l.frequency]}
                  </NativeSelectOption>
                );
              })}
            </NativeSelect>
            {line && item ? (
              <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-xs">
                <StreamTag stream={item.stream} />
                {formatCountUnit(line.quantity, item.countUnit)} per visit ·
                est. {formatKg(line.quantity * item.estKgPerUnit)}
              </p>
            ) : null}
          </Field>

          <Field label="Visit type">
            <ChoiceChips
              label="Visit type"
              options={SERVICE_TYPES}
              value={serviceType}
              onChange={setServiceType}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Date" htmlFor={`${id}-day`}>
              <Input
                id={`${id}-day`}
                type="date"
                value={day}
                min={toDayKey(TODAY)}
                onChange={(e) => setDay(e.target.value)}
              />
            </Field>
            <Field label="Arrival window">
              <ChoiceChips
                label="Arrival window"
                options={WINDOWS}
                value={effectiveWindow}
                onChange={setArrivalWindow}
              />
            </Field>
          </div>

          <Field
            label="Service pro"
            htmlFor={`${id}-pro`}
            hint="Leave on auto-assign to let dispatch place it on a route."
          >
            <NativeSelect
              id={`${id}-pro`}
              className="w-full"
              value={serviceProId}
              onChange={(e) => setServiceProId(e.target.value)}
            >
              <NativeSelectOption value="">Auto-assign</NativeSelectOption>
              {(pros.data ?? []).map((p) => (
                <NativeSelectOption key={p.id} value={p.id}>
                  {p.name} — {p.zone}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Notes for the service pro" htmlFor={`${id}-notes`}>
            <Textarea
              id={`${id}-notes`}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gate code, contact on site, what to expect…"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready}>
            Book appointment
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
