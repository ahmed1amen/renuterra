"use client";

import { CalendarRange, Pencil, Phone, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  PageHeader,
  StatusPill,
} from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultScheduleOf,
  isWorkingShift,
  useDefaultScheduleStore,
  useOpsMasters,
  useRouteInstances,
  useShifts,
  useShiftTemplates,
  useTechnicians,
  useVehicles,
} from "@/features/field-service";
import type { Technician } from "@/mocks";
import {
  licenceState,
  proRole,
  routeRoleOf,
  ShiftSummary,
  shiftHours,
  TechnicianStatusPill,
} from "../../components";
import {
  addDays,
  formatCount,
  startOfWeek,
  TODAY,
  toDayKey,
} from "../../utils";
import {
  DefaultScheduleCard,
  LicencesTab,
  RoutesTab,
  WeekSchedule,
} from "./components";

type Tab = "schedule" | "licences" | "routes";

/** Short enough for the KPI numeral; the hint carries the detail. */
const LICENCE_KPI = {
  success: "Valid",
  warning: "Expiring",
  destructive: "Expired",
} as const;

/** The expiry-tracked skill code closest to (or furthest past) its expiry. */
function worstSkillCode(pro: Technician) {
  const dated = (pro.skillCodes ?? []).filter(
    (s): s is { code: string; expiresOn: string } => s.expiresOn !== null,
  );
  if (!dated.length) return null;
  const worst = [...dated].sort((a, b) =>
    a.expiresOn.localeCompare(b.expiresOn),
  )[0];
  return { ...worst, state: licenceState(worst.expiresOn) };
}

const rangeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "30 Aug – 5 Sep" for a Sunday-first week. */
const weekRange = (start: Date) =>
  `${rangeFormat.format(start)} – ${rangeFormat.format(addDays(start, 6))}`;

const weekDays = (start: Date) =>
  Array.from({ length: 7 }, (_, i) => toDayKey(addDays(start, i)));

export default function ServiceProDetail({ id }: { id: string }) {
  const pros = useTechnicians();
  const pro = pros.data?.find((p) => p.id === id);

  if (pros.isPending) return <DetailSkeleton />;
  if (pros.isError) {
    return <ErrorState error={pros.error} onRetry={() => pros.refetch()} />;
  }
  if (!pro) {
    return (
      <EmptyState
        icon={UserX}
        title="Service pro not found"
        description="They may have left the team, or the link is wrong."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/field-service/service-pros" />}
          >
            Back to service pros
          </Button>
        }
      />
    );
  }

  return <Detail pro={pro} />;
}

function Detail({ pro }: { pro: Technician }) {
  const shifts = useShifts();
  const routes = useRouteInstances();
  const vehicles = useVehicles();
  const templates = useShiftTemplates();
  const schedules = useDefaultScheduleStore((s) => s.schedules);
  const masters = useOpsMasters();
  const [tab, setTab] = useState<Tab>("schedule");
  const [weekOffset, setWeekOffset] = useState(0);

  const thisWeek = startOfWeek(TODAY);
  const weekStart = addDays(thisWeek, weekOffset * 7);
  const days = weekDays(weekStart);
  const nextWeekStart = addDays(weekStart, 7);

  /** Every route the pro is primary or crew on, oldest first. */
  const proRoutes = useMemo(
    () =>
      (routes.data ?? [])
        .filter((r) => routeRoleOf(r, pro.id))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [routes.data, pro.id],
  );

  const shiftOn = (date: string) => shifts.shiftOf(pro.id, date);
  const routesOn = (date: string) => proRoutes.filter((r) => r.date === date);

  const inWeek = proRoutes.filter(
    (r) => r.date >= days[0] && r.date <= days[6],
  );
  const hours = days.reduce((sum, day) => {
    const shift = shifts.shiftOf(pro.id, day);
    return isWorkingShift(shift) && shift ? sum + shiftHours(shift) : sum;
  }, 0);
  const week = {
    hours,
    routes: inWeek.length,
    stops: inWeek.reduce((n, r) => n + r.appointmentIds.length, 0),
  };

  const vehicleOf = (vehicleId: string | null) =>
    vehicles.data?.find((v) => v.id === vehicleId);

  const schedule = defaultScheduleOf(pro, schedules);
  const worst = worstSkillCode(pro);
  const skillCount = pro.skillCodes?.length ?? 0;
  const entityName = pro.entity
    ? (masters.data?.entities.find((e) => e.code === pro.entity)?.name ??
      pro.entity)
    : null;
  const loaded = shifts.isSuccess && routes.isSuccess;
  const thisWeekLabel = weekOffset === 0 ? "this week" : weekRange(weekStart);
  const todayShift = shifts.shiftOf(pro.id, toDayKey(TODAY));

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Service pros", href: "/field-service/service-pros" },
          { label: pro.name },
        ]}
        title={pro.name}
        description={[proRole(pro), pro.zone, pro.employeeId, pro.entity]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(`Edit ${pro.name}`, {
                  description: "Prototype: profile editing isn't built yet.",
                })
              }
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/field-service/shift-board" />}
            >
              <CalendarRange data-icon="inline-start" />
              Open shift board
            </Button>
          </>
        }
      />

      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-1.5">
        <TechnicianStatusPill status={pro.status} />
        {pro.skills.map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
        <span className="text-muted-foreground ms-1 inline-flex items-center gap-1 text-sm">
          <Phone className="size-3.5" aria-hidden />
          {pro.phone}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Hours ${thisWeekLabel}`}
          value={loaded ? `${week.hours} h` : undefined}
          hint="Scheduled shift hours"
        />
        <KpiCard
          label={`Routes ${thisWeekLabel}`}
          value={loaded ? formatCount(week.routes) : undefined}
          hint="As primary or crew"
        />
        <KpiCard
          label={`Stops ${thisWeekLabel}`}
          value={loaded ? formatCount(week.stops) : undefined}
          hint="Appointments on those routes"
        />
        <KpiCard
          label="Licence status"
          value={worst ? LICENCE_KPI[worst.state.tone] : "-"}
          hint={
            worst
              ? worst.state.tone !== "success"
                ? `${worst.code}: ${worst.state.label.toLowerCase()}`
                : `${skillCount} skill codes on file`
              : skillCount
                ? "No expiring skill codes"
                : "None on file"
          }
        />
      </div>

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList variant="line">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="licences">
              Licences & skills
              <span className="font-mono text-[11px] tabular-nums opacity-70">
                {skillCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="routes">
              Routes
              <span className="font-mono text-[11px] tabular-nums opacity-70">
                {proRoutes.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 pt-4">
            {shifts.isPending || routes.isPending || templates.isPending ? (
              <output
                className="block space-y-4"
                aria-busy
                aria-label="Loading schedule"
              >
                <Skeleton className="h-52 w-full" />
                <Skeleton className="h-80 w-full" />
              </output>
            ) : shifts.isError || routes.isError || templates.isError ? (
              <ErrorState
                error={shifts.error ?? routes.error ?? templates.error}
                onRetry={() => {
                  shifts.refetch();
                  routes.refetch();
                  templates.refetch();
                }}
              />
            ) : (
              <>
                <WeekSchedule
                  proId={pro.id}
                  days={days}
                  shiftOf={shiftOn}
                  routesOn={routesOn}
                  rangeLabel={weekRange(weekStart)}
                  onShiftWeek={(delta) =>
                    setWeekOffset((w) => (delta === 0 ? 0 : w + delta))
                  }
                />
                <DefaultScheduleCard
                  key={pro.id}
                  pro={pro}
                  schedule={schedule}
                  templates={templates.data ?? []}
                  nextWeek={weekDays(nextWeekStart)}
                  nextWeekLabel={weekRange(nextWeekStart)}
                  shiftOf={shiftOn}
                  onViewWeek={() => setWeekOffset((w) => w + 1)}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="licences" className="pt-4">
            <LicencesTab pro={pro} />
          </TabsContent>

          <TabsContent value="routes" className="pt-4">
            {routes.isPending ? (
              <Skeleton className="h-72 w-full" />
            ) : routes.isError ? (
              <ErrorState
                error={routes.error}
                onRetry={() => routes.refetch()}
              />
            ) : (
              <RoutesTab
                proId={pro.id}
                routes={proRoutes}
                vehicleOf={vehicleOf}
              />
            )}
          </TabsContent>
        </Tabs>

        <Card className="sticky top-4">
          <CardHeader className="flex-row items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="text-sm font-semibold">
                {pro.initials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="leading-tight">
              {pro.name}
              <span className="text-muted-foreground block text-xs font-normal">
                {proRole(pro)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <Fact label="Today">
                {shifts.isPending ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <ShiftSummary shift={todayShift} />
                )}
              </Fact>
              <Fact label="Employee ID">
                {pro.employeeId ? (
                  <span className="font-mono">{pro.employeeId}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </Fact>
              <Fact label="Entity">
                {entityName ? (
                  <>
                    <span className="font-mono">{pro.entity}</span>
                    <span className="text-muted-foreground block text-xs">
                      {entityName}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </Fact>
              <Fact label="Zone">{pro.zone}</Fact>
              <Fact label="Phone">{pro.phone}</Fact>
              <Fact label="Can be primary">
                {pro.role === "driver" ? (
                  <StatusPill tone="success">Yes, drives</StatusPill>
                ) : (
                  <span className="text-muted-foreground">
                    No, rides as crew
                  </span>
                )}
              </Fact>
              <Fact label="Working days">
                {Object.keys(schedule).length} a week
              </Fact>
            </dl>
          </CardContent>
        </Card>
      </div>
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
    <output
      className="block space-y-4"
      aria-busy
      aria-label="Loading service pro"
    >
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
