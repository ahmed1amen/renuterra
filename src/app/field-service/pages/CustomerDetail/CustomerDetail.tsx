"use client";

import {
  Building2,
  CalendarPlus,
  Mail,
  OctagonAlert,
  Phone,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
} from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAppointments,
  useCustomer,
  useServicePoints,
} from "@/features/field-service";
import { cn } from "@/lib/utils";
import { type Customer, findUser, MOCK_NOW } from "@/mocks";
import { useBookAppointmentModal } from "@/stores/book-appointment-modal";
import {
  AppointmentsTable,
  BookAppointmentDialog,
  CLOSED_STATUSES,
  CONTACT_ROLE,
  CustomerFlags,
  CustomerStatusPill,
  ServicePointMap,
  TIER_LABEL,
} from "../../components";
import { formatAed, formatCount, formatDate } from "../../utils";
import { ServicePointsTab } from "./components";

type Tab = "overview" | "service-points" | "appointments" | "contacts";
type Period = "upcoming" | "past";

export default function CustomerDetail({ id }: { id: string }) {
  const customer = useCustomer(id);

  if (customer.isPending) return <DetailSkeleton />;
  if (customer.isError) {
    return (
      <ErrorState error={customer.error} onRetry={() => customer.refetch()} />
    );
  }
  if (!customer.data) {
    return (
      <EmptyState
        icon={Building2}
        title="Customer not found"
        description="It may have been merged into another account, or the link is wrong."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/field-service/customers" />}
          >
            Back to customers
          </Button>
        }
      />
    );
  }

  return <Detail customer={customer.data} />;
}

function Detail({ customer }: { customer: Customer }) {
  const servicePoints = useServicePoints();
  const appointments = useAppointments();
  const openBooking = useBookAppointmentModal((s) => s.openModal);
  const [tab, setTab] = useState<Tab>("overview");
  const [period, setPeriod] = useState<Period>("upcoming");

  const sites = useMemo(
    () =>
      (servicePoints.data ?? []).filter((sp) => sp.customerId === customer.id),
    [servicePoints.data, customer.id],
  );
  const visits = useMemo(
    () => (appointments.data ?? []).filter((a) => a.customerId === customer.id),
    [appointments.data, customer.id],
  );

  const stats = useMemo(() => {
    const upcoming = visits.filter(
      (a) => !CLOSED_STATUSES.includes(a.status) && a.windowEnd >= MOCK_NOW,
    );
    const past = visits.filter((a) => a.windowEnd < MOCK_NOW);
    const done = past.filter((a) => a.status === "completed").length;
    const attempted = past.filter(
      (a) => a.status === "completed" || a.status === "failed",
    ).length;
    return {
      upcoming,
      past: [...past].reverse(),
      failed: past.filter((a) => a.status === "failed").length,
      completionRate: attempted ? Math.round((done / attempted) * 100) : null,
      services: sites.reduce((n, sp) => n + sp.serviceLines.length, 0),
    };
  }, [visits, sites]);

  const kam = findUser(customer.kamId);
  const onHold = customer.flags.includes("do_not_service");
  const loaded = servicePoints.isSuccess && appointments.isSuccess;
  const activeSites = sites.filter((sp) => sp.status === "active");

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Customers", href: "/field-service/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={`${customer.number} · ${customer.industry} · ${customer.emirate}`}
        actions={
          customer.status === "active" && !onHold ? (
            <Button
              size="sm"
              onClick={() => openBooking({ customerId: customer.id })}
            >
              <CalendarPlus data-icon="inline-start" />
              Book appointment
            </Button>
          ) : null
        }
      />

      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-1.5">
        <CustomerStatusPill status={customer.status} />
        <span className="border-border inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium">
          <Star className="size-3" aria-hidden />
          {TIER_LABEL[customer.tier]}
        </span>
        <CustomerFlags flags={customer.flags} />
      </div>

      {onHold ? (
        <Alert variant="destructive" className="mb-4">
          <OctagonAlert aria-hidden />
          <AlertTitle>Do not service</AlertTitle>
          <AlertDescription>
            This account is on hold. No visits can be booked until the account
            manager clears it.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Service points"
          value={loaded ? formatCount(activeSites.length) : undefined}
          hint={
            loaded
              ? `${formatCount(stats.services)} contracted services`
              : undefined
          }
        />
        <KpiCard
          label="Upcoming visits"
          value={loaded ? formatCount(stats.upcoming.length) : undefined}
          hint={
            loaded && stats.upcoming[0]
              ? `Next ${formatDate(stats.upcoming[0].windowStart)}`
              : "Nothing booked"
          }
        />
        <KpiCard
          label="Completion rate"
          value={
            loaded
              ? stats.completionRate === null
                ? "—"
                : `${stats.completionRate}%`
              : undefined
          }
          hint="Visits attempted, last 7 days"
        />
        <KpiCard
          label="Failed visits"
          value={loaded ? formatCount(stats.failed) : undefined}
          hint="Last 7 days"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as Tab)}
        className="mt-6"
      >
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="service-points">
            Service points
            <span className="font-mono text-[11px] tabular-nums opacity-70">
              {sites.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            <span className="font-mono text-[11px] tabular-nums opacity-70">
              {visits.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Service points</CardTitle>
                <CardDescription>
                  {activeSites.length} active{" "}
                  {activeSites.length === 1 ? "site" : "sites"} across{" "}
                  {[...new Set(sites.map((sp) => sp.area))].join(", ") || "—"}.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTab("service-points")}
                  >
                    View all
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {servicePoints.isPending ? (
                  <Skeleton className="h-64 w-full" />
                ) : sites.length ? (
                  <ServicePointMap
                    points={sites}
                    onSelect={() => setTab("service-points")}
                    className="h-64"
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No service points yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <Fact label="Key account manager">{kam?.name ?? "—"}</Fact>
                  <Fact label="Payment terms">{customer.paymentTerms}</Fact>
                  <Fact label="Credit limit">
                    {formatAed(customer.creditLimit)}
                  </Fact>
                  <Fact label="TRN">
                    <span className="font-mono text-xs">{customer.trn}</span>
                  </Fact>
                  <Fact label="Head office">{customer.address}</Fact>
                  <Fact label="Customer since">
                    {formatDate(customer.createdAt)}{" "}
                    {customer.createdAt.slice(0, 4)}
                  </Fact>
                </dl>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Next visits</CardTitle>
                <CardDescription>
                  What's booked across all service points.
                </CardDescription>
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTab("appointments")}
                  >
                    All appointments
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {appointments.isPending ? (
                  <Skeleton className="h-40 w-full" />
                ) : stats.upcoming.length ? (
                  <AppointmentsTable
                    appointments={stats.upcoming.slice(0, 5)}
                    showCustomer={false}
                  />
                ) : (
                  <EmptyState
                    icon={CalendarPlus}
                    title="Nothing booked"
                    description="Recurring visits appear here once a contract is active."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="service-points" className="pt-4">
          {servicePoints.isPending ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <ServicePointsTab
              servicePoints={sites}
              bookable={customer.status === "active" && !onHold}
            />
          )}
        </TabsContent>

        <TabsContent value="appointments" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
              <CardAction>
                <fieldset
                  className="flex gap-1"
                  aria-label="Upcoming or past appointments"
                >
                  {(["upcoming", "past"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={period === p}
                      onClick={() => setPeriod(p)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-sm font-medium capitalize transition-colors",
                        period === p
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </fieldset>
              </CardAction>
            </CardHeader>
            <CardContent>
              {appointments.isPending ? (
                <Skeleton className="h-64 w-full" />
              ) : stats[period].length ? (
                <AppointmentsTable
                  appointments={stats[period]}
                  showCustomer={false}
                />
              ) : (
                <EmptyState
                  title={
                    period === "upcoming"
                      ? "No upcoming visits"
                      : "No past visits"
                  }
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customer.contacts.map((contact) => (
              <Card key={contact.email}>
                <CardHeader>
                  <CardTitle className="text-sm">{contact.name}</CardTitle>
                  <CardDescription>{contact.title}</CardDescription>
                  {contact.isPrimary ? (
                    <CardAction>
                      <span className="text-info text-xs font-medium">
                        Primary
                      </span>
                    </CardAction>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p className="text-muted-foreground text-xs">
                    {CONTACT_ROLE[contact.role]}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone
                      className="text-muted-foreground size-3.5"
                      aria-hidden
                    />
                    {contact.phone}
                  </p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-info flex items-center gap-1.5 hover:underline"
                  >
                    <Mail className="size-3.5" aria-hidden />
                    <span className="truncate">{contact.email}</span>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <BookAppointmentDialog />
    </>
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
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <output className="block space-y-4" aria-busy aria-label="Loading customer">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-80" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </output>
  );
}
