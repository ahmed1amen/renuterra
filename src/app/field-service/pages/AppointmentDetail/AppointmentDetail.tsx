"use client";

import {
  CalendarClock,
  CalendarPlus,
  Camera,
  CircleCheck,
  FileSearch,
  MapPin,
  MoreHorizontal,
  OctagonAlert,
  Phone,
  ShieldCheck,
  Truck,
  UserPlus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useAppointment,
  useAppointmentStore,
  useDirectory,
  useTechnicians,
} from "@/features/field-service";
import {
  type Appointment,
  type CancelReason,
  type FailedReason,
  MOCK_NOW,
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
  SERVICE_TYPE_LABEL,
  ServicePointMap,
  SOURCE_LABEL,
  TechnicianIdentity,
  TIER_LABEL,
  WINDOW_HOURS,
  WINDOW_LABEL,
} from "../../components";
import {
  dubaiDateTime,
  formatDate,
  formatDateTime,
  formatDuration,
  formatTime,
  formatWindowRange,
} from "../../utils";
import {
  CompleteDialog,
  ReasonDialog,
  RescheduleDialog,
  VisitProgress,
} from "./components";

type DialogId = "reschedule" | "cancel" | "fail" | "complete" | null;

/** What happens next, by status — the one button the header leads with. */
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
 * When a field action "happens" — the mock now, or the planned arrival for a
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
  const pros = useTechnicians();
  const update = useAppointmentStore((s) => s.update);
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  const [dialog, setDialog] = useState<DialogId>(null);
  const [notes, setNotes] = useState<{ text: string; at: string }[]>([]);
  const [draftNote, setDraftNote] = useState("");

  const customer = directory.customer(apt.customerId);
  const site = directory.servicePoint(apt.servicePointId);
  const pro = directory.servicePro(apt.serviceProId);
  const closed = CLOSED_STATUSES.includes(apt.status);
  const next = NEXT_STEP[apt.status];
  const primaryContact = customer?.contacts.find((c) => c.isPrimary);

  function patch(changes: Partial<Appointment>, message: string) {
    update(apt.id, changes);
    setDialog(null);
    toast.success(message);
  }

  function advance() {
    if (!next) return;
    patch(
      {
        status: next.status,
        startedAt:
          next.status === "in-progress" ? actionTime(apt) : apt.startedAt,
      },
      `${apt.ref} ${next.done}`,
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
              ) : (
                <Button size="sm" onClick={() => setDialog("complete")}>
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
                  <DropdownMenuItem onClick={() => setDialog("reschedule")}>
                    <CalendarClock />
                    Reschedule
                  </DropdownMenuItem>
                  {next ? (
                    <DropdownMenuItem onClick={() => setDialog("complete")}>
                      <CircleCheck />
                      Complete visit
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={() => setDialog("fail")}>
                    <OctagonAlert />
                    Report failed visit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDialog("cancel")}
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
                Failed visit — {FAILED_REASON[apt.failedReason]}
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
                Cancelled — {CANCEL_REASON[apt.cancelReason]}
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
                {WINDOW_LABEL[apt.window].toLowerCase()} window{" "}
                {formatWindowRange(apt.windowStart, apt.windowEnd)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <VisitProgress status={apt.status} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Fact label="Stream">
                  <StreamTag stream={apt.stream} />
                </Fact>
                <Fact label="Visit type">
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

          <Card>
            <CardHeader>
              <CardTitle>Work orders</CardTitle>
              <CardDescription>
                What the service pro does on this visit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Work</TableHead>
                    <TableHead className="text-right">Planned</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apt.workOrders.map((wo) => (
                    <TableRow key={wo.ref}>
                      <TableCell className="font-mono text-xs">
                        {wo.ref}
                      </TableCell>
                      <TableCell className="text-sm">
                        {wo.description}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {wo.quantityPlanned} {wo.uom}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {wo.quantityActual === null
                          ? "—"
                          : `${wo.quantityActual} ${wo.uom}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
              <CardTitle>Service pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {pro ? (
                <TechnicianIdentity technician={pro} showPhone />
              ) : (
                <p className="text-muted-foreground">
                  Not assigned yet — dispatch will place this on a route.
                </p>
              )}
              {apt.vehiclePlate ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Truck className="size-3.5" aria-hidden />
                  <span className="font-mono">{apt.vehiclePlate}</span>
                </p>
              ) : null}
              {!closed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="sm" className="w-full" />
                    }
                  >
                    <UserPlus data-icon="inline-start" />
                    {pro ? "Reassign" : "Assign service pro"}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                      {(pros.data ?? []).map((p) => (
                        <DropdownMenuItem
                          key={p.id}
                          disabled={p.id === apt.serviceProId}
                          onClick={() =>
                            patch(
                              { serviceProId: p.id },
                              `${apt.ref} assigned to ${p.name}`,
                            )
                          }
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-muted-foreground ml-auto text-xs">
                            {p.zone}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {dialog === "reschedule" ? (
        <RescheduleDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          appointment={apt}
          onConfirm={(day, window, note) => {
            const [from, to] = WINDOW_HOURS[window];
            patch(
              {
                window,
                windowStart: dubaiDateTime(day, from),
                windowEnd: dubaiDateTime(day, to),
                plannedStart: dubaiDateTime(day, from),
                status: "scheduled",
                notes: note || apt.notes,
              },
              `${apt.ref} moved to ${formatDate(dubaiDateTime(day, from))}`,
            );
          }}
        />
      ) : null}
      {dialog === "cancel" ? (
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
              },
              `${apt.ref} cancelled`,
            )
          }
        />
      ) : null}
      {dialog === "fail" ? (
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
                workOrders: apt.workOrders.map((wo) => ({
                  ...wo,
                  quantityActual: 0,
                })),
              },
              `${apt.ref} marked as failed visit`,
            )
          }
        />
      ) : null}
      {dialog === "complete" ? (
        <CompleteDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          appointment={apt}
          onConfirm={(actuals) =>
            patch(
              {
                status: "completed",
                startedAt: apt.startedAt ?? actionTime(apt),
                completedAt: actionTime(apt),
                workOrders: apt.workOrders.map((wo, i) => ({
                  ...wo,
                  quantityActual: actuals[i],
                })),
              },
              `${apt.ref} completed`,
            )
          }
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
          {apt.completedAt ? formatDateTime(apt.completedAt) : "—"}.
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
