"use client";

import {
  CalendarClock,
  CalendarPlus,
  Camera,
  CircleCheck,
  ClipboardCheck,
  FileSearch,
  MapPin,
  MoreHorizontal,
  OctagonAlert,
  Phone,
  Route as RouteIcon,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StreamTag,
} from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  isWorkOrderClosed,
  newWorkOrder,
  useAppointment,
  useAppointmentStore,
  useCatalogItems,
  useDirectory,
  useDispatchActions,
  useRouteInstances,
} from "@/features/field-service";
import {
  type Appointment,
  type CancelReason,
  type FailedReason,
  MOCK_NOW,
  type WorkOrder,
} from "@/mocks";
import { useBookAppointmentModal } from "@/stores/book-appointment-modal";
import {
  APPOINTMENT_TYPE,
  AppointmentStatusPill,
  BookAppointmentDialog,
  CANCEL_REASON,
  CLOSED_STATUSES,
  CustomerFlags,
  FAILED_REASON,
  fitsVehicle,
  InstanceStatusPill,
  SERVICE_TYPE_LABEL,
  ServicePointMap,
  SOURCE_LABEL,
  STAFFING_SOURCE,
  TechnicianIdentity,
  TIER_LABEL,
  VEHICLE_CLASS,
  WINDOW_HOURS,
  WINDOW_LABEL,
} from "../../components";
import {
  dubaiDateTime,
  formatDate,
  formatDateTime,
  formatDuration,
  formatKg,
  formatTime,
  formatWindowRange,
  toDubaiDayKey,
} from "../../utils";
import {
  AddWorkOrderDialog,
  ReasonDialog,
  RecordWorkOrderDialog,
  RescheduleDialog,
  VisitProgress,
  WorkOrdersCard,
} from "./components";

type DialogId =
  | { kind: "reschedule" | "cancel" | "fail" | "add-work-order" }
  | { kind: "record"; workOrderId: string }
  | null;

/** What happens next, by status: the one button the header leads with. */
const NEXT_STEP: Partial<
  Record<
    Appointment["status"],
    { label: string; done: string; status: Appointment["status"] }
  >
> = {
  scheduled: {
    label: "Confirm with customer",
    done: "confirmed with customer",
    status: "confirmed",
  },
  confirmed: {
    label: "Mark en route",
    done: "service pro en route",
    status: "en-route",
  },
  "en-route": {
    label: "Check in on site",
    done: "checked in on site",
    status: "in-progress",
  },
};

/**
 * When a field action "happens": the mock now, or the planned arrival for a
 * future visit, so a completed visit never predates its own slot.
 */
function actionTime(apt: Appointment) {
  return apt.plannedStart > MOCK_NOW ? apt.plannedStart : MOCK_NOW;
}

export default function AppointmentDetail({ id }: { id: string }) {
  const appointment = useAppointment(id);
  const directory = useDirectory();

  if (appointment.isPending || directory.isPending) {
    return <DetailSkeleton />;
  }
  if (appointment.isError) {
    return (
      <ErrorState
        error={appointment.error}
        onRetry={() => appointment.refetch()}
      />
    );
  }
  if (!appointment.data) {
    return (
      <EmptyState
        icon={FileSearch}
        title="Appointment not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/field-service/appointments" />}
          >
            Back to appointments
          </Button>
        }
      />
    );
  }

  return <Detail appointment={appointment.data} />;
}

function Detail({ appointment: apt }: { appointment: Appointment }) {
  const directory = useDirectory();
  const routes = useRouteInstances();
  const { move } = useDispatchActions();
  // Includes items added in Settings this session.
  const serviceItems = useCatalogItems();
  const update = useAppointmentStore((s) => s.update);
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [notes, setNotes] = useState<{ text: string; at: string }[]>([]);
  const [draftNote, setDraftNote] = useState("");

  const customer = directory.customer(apt.customerId);
  const site = directory.servicePoint(apt.servicePointId);
  const route = directory.routeInstance(apt.routeInstanceId);
  const pro = directory.servicePro(route?.primaryServiceProId);
  const vehicle = directory.vehicle(route?.vehicleId);
  const sameDayRoutes = (routes.data ?? []).filter(
    (r) => r.date === toDubaiDayKey(apt.windowStart),
  );
  const closed = CLOSED_STATUSES.includes(apt.status);
  const next = NEXT_STEP[apt.status];
  const primaryContact = customer?.contacts.find((c) => c.isPrimary);
  const onSite = apt.status === "in-progress";
  const openWorkOrders = apt.workOrders.filter((wo) => !isWorkOrderClosed(wo));
  const recording =
    dialog?.kind === "record"
      ? apt.workOrders.find((wo) => wo.id === dialog.workOrderId)
      : undefined;
  const collectedKg = apt.workOrders.reduce(
    (sum, wo) => sum + (wo.weightKg ?? 0),
    0,
  );

  function patch(changes: Partial<Appointment>, message: string) {
    update(apt.id, changes);
    setDialog(null);
    toast.success(message);
  }

  /** Apply `change` to every still-open work order. */
  function closeOpenWorkOrders(change: Partial<WorkOrder>) {
    return apt.workOrders.map((wo) =>
      isWorkOrderClosed(wo) ? wo : { ...wo, ...change },
    );
  }

  function advance() {
    if (!next) return;
    const checkIn = next.status === "in-progress";
    patch(
      {
        status: next.status,
        startedAt: checkIn ? actionTime(apt) : apt.startedAt,
        workOrders: checkIn
          ? closeOpenWorkOrders({ status: "in-progress" })
          : apt.workOrders,
      },
      `${apt.ref} ${next.done}`,
    );
  }

  function patchWorkOrder(
    id: string,
    changes: Partial<WorkOrder>,
    message: string,
  ) {
    const workOrders = apt.workOrders.map((wo) =>
      wo.id === id ? { ...wo, ...changes } : wo,
    );
    update(apt.id, { workOrders });
    setDialog(null);
    const remaining = workOrders.filter((wo) => !isWorkOrderClosed(wo));
    if (onSite && !remaining.length) {
      toast.success(message, {
        description: "All work orders are closed.",
        action: {
          label: "Complete visit",
          onClick: () => completeVisit(workOrders),
        },
      });
    } else {
      toast.success(message);
    }
  }

  /**
   * Close the visit once its work orders are closed: completed if anything was
   * done, otherwise a failed visit carrying the first work order's reason.
   */
  function completeVisit(workOrders = apt.workOrders) {
    const anyDone = workOrders.some(
      (wo) => wo.status === "completed" || wo.status === "partial",
    );
    const firstReason = workOrders.find((wo) => wo.reason)?.reason;
    const failedReason: FailedReason =
      firstReason && firstReason in FAILED_REASON
        ? (firstReason as FailedReason)
        : "no_waste";
    const lastEnd = workOrders
      .map((wo) => wo.completedAt)
      .filter((at): at is string => Boolean(at))
      .sort()
      .at(-1);
    const completedAt = lastEnd ?? actionTime(apt);
    update(apt.id, {
      workOrders,
      status: anyDone ? "completed" : "failed",
      failedReason: anyDone ? null : failedReason,
      completedAt,
      durationMins: apt.startedAt
        ? Math.max(
            1,
            Math.round(
              (Date.parse(completedAt) - Date.parse(apt.startedAt)) / 60_000,
            ),
          )
        : apt.durationMins,
    });
    setDialog(null);
    toast.success(
      anyDone ? `${apt.ref} completed` : `${apt.ref} closed as failed visit`,
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Appointments", href: "/field-service/appointments" },
          { label: apt.ref },
        ]}
        title={`${SERVICE_TYPE_LABEL[apt.serviceType]} · ${apt.ref}`}
        description={site?.name}
        actions={
          closed ? (
            apt.status === "failed" ? (
              <Button
                size="sm"
                onClick={() =>
                  openBooking({
                    customerId: apt.customerId,
                    servicePointId: apt.servicePointId,
                    serviceLineId: apt.serviceLineId ?? undefined,
                    type: "reservice",
                    originalAppointmentId: apt.id,
                  })
                }
              >
                <CalendarPlus data-icon="inline-start" />
                Book reservice
              </Button>
            ) : null
          ) : (
            <>
              {next ? (
                <Button size="sm" onClick={advance}>
                  {next.label}
                </Button>
              ) : openWorkOrders.length ? (
                <Button
                  size="sm"
                  onClick={() =>
                    setDialog({
                      kind: "record",
                      workOrderId: openWorkOrders[0].id,
                    })
                  }
                >
                  <ClipboardCheck data-icon="inline-start" />
                  Record {openWorkOrders[0].ref}
                </Button>
              ) : (
                <Button size="sm" onClick={() => completeVisit()}>
                  <CircleCheck data-icon="inline-start" />
                  Complete visit
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="More actions"
                    />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() => setDialog({ kind: "reschedule" })}
                  >
                    <CalendarClock />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDialog({ kind: "fail" })}>
                    <OctagonAlert />
                    Report failed visit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDialog({ kind: "cancel" })}
                  >
                    Cancel appointment
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          {apt.status === "failed" && apt.failedReason ? (
            <Alert variant="destructive">
              <OctagonAlert aria-hidden />
              <AlertTitle>
                Failed visit: {FAILED_REASON[apt.failedReason]}
              </AlertTitle>
              <AlertDescription>
                The service pro attended but could not collect. Billed the
                collection fee only.
              </AlertDescription>
            </Alert>
          ) : null}
          {apt.status === "cancelled" && apt.cancelReason ? (
            <Alert>
              <OctagonAlert aria-hidden />
              <AlertTitle>
                Cancelled: {CANCEL_REASON[apt.cancelReason]}
              </AlertTitle>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Visit
                <AppointmentStatusPill status={apt.status} />
              </CardTitle>
              <CardDescription>
                {formatDate(apt.windowStart)} ·{" "}
                <span className="font-mono tabular-nums">
                  {formatWindowRange(apt.windowStart, apt.windowEnd)}
                </span>{" "}
                · {WINDOW_LABEL[apt.window].toLowerCase()} window
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <VisitProgress status={apt.status} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Fact label="Stream">
                  <StreamTag stream={apt.stream} />
                </Fact>
                <Fact label="Visit purpose">
                  {SERVICE_TYPE_LABEL[apt.serviceType]}
                </Fact>
                <Fact label="Appointment type">
                  {APPOINTMENT_TYPE[apt.type].label}
                </Fact>
                <Fact label="Source">{SOURCE_LABEL[apt.source]}</Fact>
                <Fact label="Planned arrival">
                  <span className="font-mono tabular-nums">
                    {formatTime(apt.plannedStart)}
                  </span>
                </Fact>
                <Fact
                  label={
                    apt.status === "completed"
                      ? "Time on site"
                      : "Est. time on site"
                  }
                >
                  {formatDuration(apt.durationMins)}
                </Fact>
                <Fact label="Booked">
                  {apt.bookedBy === "system"
                    ? "From contract schedule"
                    : formatDate(apt.createdAt)}
                </Fact>
                {apt.startedAt ? (
                  <Fact label="Checked in">
                    {formatDateTime(apt.startedAt)}
                  </Fact>
                ) : null}
                {apt.completedAt && apt.status === "completed" ? (
                  <Fact label="Completed">
                    {formatDateTime(apt.completedAt)}
                  </Fact>
                ) : null}
                {collectedKg > 0 ? (
                  <Fact label="Collected">
                    <span className="font-mono tabular-nums">
                      {formatKg(collectedKg)}
                    </span>
                  </Fact>
                ) : null}
                {apt.originalAppointmentId ? (
                  <Fact label="Follows up">
                    <Link
                      href={`/field-service/appointments/${apt.originalAppointmentId}`}
                      className="text-info font-mono text-xs hover:underline"
                    >
                      Failed visit
                    </Link>
                  </Fact>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          <WorkOrdersCard
            workOrders={apt.workOrders}
            onSite={onSite}
            editable={!closed}
            onRecord={(wo) => setDialog({ kind: "record", workOrderId: wo.id })}
            onDefer={(wo) =>
              patchWorkOrder(
                wo.id,
                { status: "deferred" },
                `${wo.ref} deferred to the next visit`,
              )
            }
            onCancel={(wo) =>
              patchWorkOrder(
                wo.id,
                { status: "cancelled" },
                `${wo.ref} cancelled`,
              )
            }
            onAdd={() => setDialog({ kind: "add-work-order" })}
          />

          {apt.status === "completed" || apt.status === "failed" ? (
            <ProofOfService
              appointment={apt}
              signedBy={
                customer?.contacts.find((c) => c.role === "operations")?.name ??
                primaryContact?.name
              }
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>
                Visible to dispatch and the service pro.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {apt.notes ? (
                <NoteItem text={apt.notes} meta="Booking note" />
              ) : null}
              {notes.map((note) => (
                <NoteItem
                  key={note.at + note.text}
                  text={note.text}
                  meta={`You · ${formatTime(note.at)}`}
                />
              ))}
              {!apt.notes && !notes.length ? (
                <p className="text-muted-foreground text-sm">No notes yet.</p>
              ) : null}
              <form
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draftNote.trim()) return;
                  setNotes((prev) => [
                    ...prev,
                    { text: draftNote.trim(), at: MOCK_NOW },
                  ]);
                  setDraftNote("");
                }}
              >
                <Textarea
                  rows={2}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Add a note…"
                  aria-label="New note"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!draftNote.trim()}
                >
                  Add note
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer ? (
                <>
                  <div>
                    <Link
                      href={`/field-service/customers/${customer.id}`}
                      className="font-medium hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <p className="text-muted-foreground font-mono text-xs">
                      {customer.number} · {TIER_LABEL[customer.tier]}
                    </p>
                  </div>
                  <CustomerFlags flags={customer.flags} />
                  {primaryContact ? (
                    <div className="border-t pt-3">
                      <p className="font-medium">{primaryContact.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {primaryContact.title}
                      </p>
                      <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                        <Phone className="size-3" aria-hidden />
                        {primaryContact.phone}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">Unknown customer</p>
              )}
            </CardContent>
          </Card>

          {site ? (
            <Card>
              <CardHeader>
                <CardTitle>Service point</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {site.number}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ServicePointMap
                  points={[site]}
                  selectedId={site.id}
                  className="h-40"
                />
                <div>
                  <p className="font-medium">{site.location}</p>
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
                    {site.address}
                  </p>
                </div>
                {site.accessNotes ? (
                  <p className="bg-muted rounded-md p-2.5 text-xs">
                    {site.accessNotes}
                  </p>
                ) : null}
                {site.attributes.length ? (
                  <div className="flex flex-wrap gap-1">
                    {site.attributes.map((a) => (
                      <Badge key={a} variant="outline">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
              {route ? (
                <CardDescription className="flex items-center gap-1.5">
                  Stop {route.appointmentIds.indexOf(apt.id) + 1} of{" "}
                  {route.appointmentIds.length}
                  <InstanceStatusPill status={route.status} />
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {route ? (
                <>
                  <div>
                    <Link
                      href="/field-service/dispatch"
                      className="block font-medium hover:underline"
                    >
                      {route.name}
                    </Link>
                    <p className="text-muted-foreground font-mono text-xs">
                      {route.id}
                    </p>
                    {route.routeId ? (
                      <Link
                        href={`/field-service/routes/${route.routeId}`}
                        className="text-info text-xs hover:underline"
                      >
                        Open route definition
                      </Link>
                    ) : null}
                  </div>
                  {pro ? (
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">
                        Driver
                        {route.staffing.driver &&
                        route.staffing.driver !== "primary"
                          ? ` · ${STAFFING_SOURCE[route.staffing.driver].toLowerCase()}`
                          : ""}
                      </p>
                      <TechnicianIdentity technician={pro} showPhone />
                    </div>
                  ) : null}
                  {route.crew.length ? (
                    <ul className="text-muted-foreground space-y-0.5 text-xs">
                      {route.crew.map((member) => (
                        <li key={member.serviceProId}>
                          {directory.servicePro(member.serviceProId)?.name} ·{" "}
                          {member.role === "trainee" ? "Trainee" : "Helper"}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {vehicle ? (
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Truck className="size-3.5" aria-hidden />
                      <span className="font-mono">{vehicle.plate}</span>·{" "}
                      {VEHICLE_CLASS[vehicle.vehicleClass]}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted-foreground">
                  In the backlog: not on a route yet. Dispatch places it, or
                  pick a route below.
                </p>
              )}
              {!closed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={Boolean(route?.lockedAt)}
                      />
                    }
                  >
                    <RouteIcon data-icon="inline-start" />
                    {route ? "Move to another route" : "Add to a route"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        Routes on {formatDate(apt.windowStart)}
                      </DropdownMenuLabel>
                      {sameDayRoutes.length ? (
                        sameDayRoutes.map((r) => (
                          <DropdownMenuItem
                            key={r.id}
                            disabled={r.id === route?.id || Boolean(r.lockedAt)}
                            onClick={() => {
                              move(apt.id, r.id);
                              toast.success(`${apt.ref} added to ${r.name}`);
                            }}
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{r.name}</span>
                              <span className="text-muted-foreground block text-xs">
                                {
                                  directory.servicePro(r.primaryServiceProId)
                                    ?.name
                                }{" "}
                                · {r.appointmentIds.length}{" "}
                                {r.appointmentIds.length === 1
                                  ? "stop"
                                  : "stops"}
                                {r.lockedAt ? " · locked" : ""}
                                {fitsVehicle(
                                  apt,
                                  directory.vehicle(r.vehicleId)?.vehicleClass,
                                )
                                  ? ""
                                  : " · vehicle mismatch"}
                              </span>
                            </span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>
                          No routes that day yet
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                    {route ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            move(apt.id, null);
                            toast.success(
                              `${apt.ref} sent back to the backlog`,
                            );
                          }}
                        >
                          Send to backlog
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              {route?.lockedAt && !closed ? (
                <p className="text-muted-foreground text-xs">
                  Unlock the route on the Dispatch board to move this visit.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {dialog?.kind === "reschedule" ? (
        <RescheduleDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          appointment={apt}
          onConfirm={({ day, window, reason, requestedBy, note }) => {
            const [from, to] = WINDOW_HOURS[window];
            patch(
              {
                window,
                windowStart: dubaiDateTime(day, from),
                windowEnd: dubaiDateTime(day, to),
                plannedStart: dubaiDateTime(day, from),
                status: "scheduled",
                rescheduled: {
                  reason,
                  requestedBy,
                  fromDay: toDubaiDayKey(apt.windowStart),
                  at: MOCK_NOW,
                },
                notes: note || apt.notes,
              },
              `${apt.ref} moved to ${formatDate(dubaiDateTime(day, from))}`,
            );
          }}
        />
      ) : null}
      {dialog?.kind === "cancel" ? (
        <ReasonDialog<CancelReason>
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title={`Cancel ${apt.ref}?`}
          description="The visit comes off the route and the customer is notified."
          reasons={CANCEL_REASON}
          confirmLabel="Cancel appointment"
          destructive
          onConfirm={(reason, note) =>
            patch(
              {
                status: "cancelled",
                cancelReason: reason,
                notes: note || apt.notes,
                workOrders: closeOpenWorkOrders({ status: "cancelled" }),
              },
              `${apt.ref} cancelled`,
            )
          }
        />
      ) : null}
      {dialog?.kind === "fail" ? (
        <ReasonDialog<FailedReason>
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Report a failed visit"
          description="The service pro attended but couldn't collect. A photo is attached from the app."
          reasons={FAILED_REASON}
          confirmLabel="Report failed visit"
          destructive
          onConfirm={(reason, note) =>
            patch(
              {
                status: "failed",
                failedReason: reason,
                notes: note || apt.notes,
                startedAt: apt.startedAt ?? actionTime(apt),
                completedAt: actionTime(apt),
                workOrders: closeOpenWorkOrders({
                  status: "not-done",
                  countDone: 0,
                  reason,
                  startedAt: apt.startedAt ?? actionTime(apt),
                  completedAt: actionTime(apt),
                  evidence: { photos: 1 },
                }),
              },
              `${apt.ref} marked as failed visit`,
            )
          }
        />
      ) : null}
      {recording ? (
        <RecordWorkOrderDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          workOrder={recording}
          item={serviceItems.data?.find(
            (i) => i.id === recording.serviceItemId,
          )}
          at={actionTime(apt)}
          onConfirm={(changes) =>
            patchWorkOrder(recording.id, changes, `${recording.ref} recorded`)
          }
        />
      ) : null}
      {dialog?.kind === "add-work-order" ? (
        <AddWorkOrderDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          items={(serviceItems.data ?? []).filter((i) => i.active)}
          onSite={onSite}
          onConfirm={(item, count) => {
            const wo = newWorkOrder(
              item,
              count,
              [],
              onSite ? "added-on-site" : "planned",
            );
            patch(
              {
                workOrders: [
                  ...apt.workOrders,
                  onSite
                    ? {
                        ...wo,
                        status: "in-progress",
                        startedAt: actionTime(apt),
                      }
                    : wo,
                ],
              },
              `${wo.ref} added`,
            );
          }}
        />
      ) : null}

      <BookAppointmentDialog />
    </>
  );
}

function ProofOfService({
  appointment: apt,
  signedBy,
}: {
  appointment: Appointment;
  signedBy?: string;
}) {
  const failed = apt.status === "failed";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4" aria-hidden />
          Proof of service
        </CardTitle>
        <CardDescription>
          Captured by the service pro's app at{" "}
          {apt.completedAt ? formatDateTime(apt.completedAt) : "-"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid grid-cols-3 gap-2">
          {(failed
            ? ["Arrival", "Access", "Container"]
            : ["Before", "After", "Container"]
          ).map((label) => (
            <li
              key={label}
              className="bg-muted text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg text-xs"
            >
              <Camera className="size-5" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Fact label="Location">
            <span className="text-success flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              At service point
            </span>
          </Fact>
          <Fact label="Signed by">
            {failed ? "Not signed" : (signedBy ?? "On-site contact")}
          </Fact>
          <Fact label="Customer report">
            {failed ? "Failed-visit notice sent" : "Included in monthly POS"}
          </Fact>
        </dl>
      </CardContent>
    </Card>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function NoteItem({ text, meta }: { text: string; meta: string }) {
  return (
    <div className="bg-muted/60 rounded-lg p-3">
      <p className="text-sm">{text}</p>
      <p className="text-muted-foreground mt-1 text-xs">{meta}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <output
      className="block space-y-4"
      aria-busy
      aria-label="Loading appointment"
    >
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-96" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </output>
  );
}
