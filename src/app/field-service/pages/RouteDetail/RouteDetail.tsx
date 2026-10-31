"use client";

import {
  Archive,
  CirclePlay,
  Pause,
  Pencil,
  Play,
  Route as RouteIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, PageHeader } from "@/components/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type RouteContext,
  useRouteInstances,
  useRouteScoring,
  useRouteStore,
} from "@/features/field-service";
import type { Route } from "@/mocks";
import {
  logRouteEvent,
  RouteFormDialog,
  RouteScoreBadge,
  RouteStatusPill,
  SCORE_SCOPE,
  TODAY_KEY,
  useRouteContext,
} from "../../components";
import {
  ActivateDialog,
  DefinitionTab,
  HistoryTab,
  PerformanceTab,
  ResourcesTab,
  RouteFacts,
  ScheduleTab,
  ServiceLinesTab,
} from "./components";

type Tab =
  | "definition"
  | "resources"
  | "service-lines"
  | "schedule"
  | "performance"
  | "history";

const TABS: Tab[] = [
  "definition",
  "resources",
  "service-lines",
  "schedule",
  "performance",
  "history",
];

export default function RouteDetail({
  id,
  initialTab,
}: {
  id: string;
  /** From `?tab=`, so a report can link straight to e.g. Performance. */
  initialTab?: string;
}) {
  const { ctx, isPending, error, refetch } = useRouteContext();

  if (isPending) return <DetailSkeleton />;
  if (error || !ctx) return <ErrorState error={error} onRetry={refetch} />;

  const route = ctx.routes.find((r) => r.id === id);
  if (!route) {
    return (
      <EmptyState
        icon={RouteIcon}
        title="Route not found"
        description="It may have been created in another session, or the link is wrong. Routes are never deleted, only retired."
        action={
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/field-service/routes" />}
          >
            Back to routes
          </Button>
        }
      />
    );
  }

  return (
    <Detail
      route={route}
      ctx={ctx}
      initialTab={
        TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "definition"
      }
    />
  );
}

function Detail({
  route,
  ctx,
  initialTab,
}: {
  route: Route;
  ctx: RouteContext;
  initialTab: Tab;
}) {
  const patchRoute = useRouteStore((s) => s.patchRoute);
  const allInstances = useRouteInstances();
  // Derived from the live route, so attaching / detaching a line re-scores it.
  const score = useRouteScoring().routeScore(route);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [dialog, setDialog] = useState<"edit" | "activate" | "retire" | null>(
    null,
  );
  const [dialogKey, setDialogKey] = useState(0);

  const instances = useMemo(
    () => (allInstances.data ?? []).filter((i) => i.routeId === route.id),
    [allInstances.data, route.id],
  );
  const assignments = ctx.assignments.filter(
    (a) => a.routeId === route.id && a.status === "active",
  );

  const open = (d: typeof dialog) => {
    setDialogKey((k) => k + 1);
    setDialog(d);
  };
  const close = (isOpen: boolean) => {
    if (!isOpen) setDialog(null);
  };

  function setStatus(status: Route["status"], title: string, detail: string) {
    patchRoute(route.id, {
      status,
      ...(status === "retired" ? { validTo: TODAY_KEY } : {}),
    });
    logRouteEvent(route.id, title);
    toast.success(`${route.code}: ${title.toLowerCase()}`, {
      description: detail,
    });
  }

  const entity = ctx.masters.entities.find((e) => e.code === route.entity);
  const serviceType = ctx.masters.serviceTypes.find(
    (s) => s.code === route.serviceType,
  );

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Field Service", href: "/field-service" },
          { label: "Routes", href: "/field-service/routes" },
          { label: route.code },
        ]}
        title={route.name}
        actions={
          route.status === "retired" ? null : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => open("edit")}>
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
              {route.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setStatus(
                      "suspended",
                      "Route suspended",
                      "No instances generate until it's resumed.",
                    )
                  }
                >
                  <Pause data-icon="inline-start" />
                  Suspend
                </Button>
              ) : null}
              {route.status === "suspended" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setStatus(
                      "active",
                      "Route resumed",
                      "Instances generate again from the next due day.",
                    )
                  }
                >
                  <Play data-icon="inline-start" />
                  Resume
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={() => open("retire")}
              >
                <Archive data-icon="inline-start" />
                Retire
              </Button>
              {route.status === "draft" ? (
                <Button size="sm" onClick={() => open("activate")}>
                  <CirclePlay data-icon="inline-start" />
                  Activate
                </Button>
              ) : null}
            </div>
          )
        }
      />

      <div className="-mt-3 mb-5 flex flex-wrap items-center gap-1.5">
        <span className="me-1 font-mono text-sm font-medium">{route.code}</span>
        <RouteStatusPill status={route.status} />
        <RouteScoreBadge score={score} scope={SCORE_SCOPE.design} />
        <Badge variant="outline" title={entity?.name}>
          {route.entity}
        </Badge>
        <Badge variant="outline" title={serviceType?.name}>
          {route.serviceType} · {serviceType?.name}
        </Badge>
        <Badge variant="secondary" className="font-mono">
          v{route.version}
        </Badge>
      </div>

      {route.status === "retired" ? (
        <Alert className="mb-4">
          <Archive aria-hidden />
          <AlertTitle>Retired route</AlertTitle>
          <AlertDescription>
            Kept for reporting and history. It generates no instances and can't
            be edited.
          </AlertDescription>
        </Alert>
      ) : route.status === "suspended" ? (
        <Alert className="mb-4">
          <Pause aria-hidden />
          <AlertTitle>Suspended</AlertTitle>
          <AlertDescription>
            No instances generate while suspended. Resume it to dispatch again.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-[1fr_18rem] items-start gap-4">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
          className="min-w-0"
        >
          <TabsList variant="line">
            <TabsTrigger value="definition">Definition</TabsTrigger>
            <TabsTrigger value="resources">
              Resources
              <span className="font-mono text-[11px] tabular-nums opacity-70">
                {assignments.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="service-lines">
              Service lines
              <span className="font-mono text-[11px] tabular-nums opacity-70">
                {route.serviceLineIds.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="definition" className="pt-4">
            <DefinitionTab route={route} ctx={ctx} score={score} />
          </TabsContent>
          <TabsContent value="resources" className="pt-4">
            <ResourcesTab route={route} ctx={ctx} />
          </TabsContent>
          <TabsContent value="service-lines" className="pt-4">
            <ServiceLinesTab route={route} ctx={ctx} />
          </TabsContent>
          <TabsContent value="schedule" className="pt-4">
            {allInstances.isPending ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <ScheduleTab route={route} ctx={ctx} instances={instances} />
            )}
          </TabsContent>
          <TabsContent value="performance" className="pt-4">
            {allInstances.isPending ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <PerformanceTab route={route} ctx={ctx} instances={instances} />
            )}
          </TabsContent>
          <TabsContent value="history" className="pt-4">
            <HistoryTab route={route} ctx={ctx} />
          </TabsContent>
        </Tabs>

        <aside className="pt-12">
          <RouteFacts route={route} ctx={ctx} instances={instances} />
        </aside>
      </div>

      {dialog === "edit" ? (
        <RouteFormDialog
          key={dialogKey}
          open
          onOpenChange={close}
          ctx={ctx}
          route={route}
        />
      ) : null}
      {dialog === "activate" ? (
        <ActivateDialog
          key={dialogKey}
          open
          onOpenChange={close}
          route={route}
          ctx={ctx}
        />
      ) : null}

      <Dialog open={dialog === "retire"} onOpenChange={close}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retire {route.code}?</DialogTitle>
            <DialogDescription>
              Retiring ends the route today. It stops generating instances, and
              its history, instances and costs are kept. Routes are never
              deleted.
            </DialogDescription>
          </DialogHeader>
          {route.serviceLineIds.length ? (
            <p className="text-warning text-sm">
              {route.serviceLineIds.length} service lines are still attached.
              Transfer them to another route so they keep being collected.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setStatus(
                  "retired",
                  "Route retired",
                  "Kept read-only for reporting.",
                );
                setDialog(null);
              }}
            >
              Retire route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailSkeleton() {
  return (
    <output className="block space-y-4" aria-busy aria-label="Loading route">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-5 w-96" />
      <div className="grid grid-cols-[1fr_18rem] gap-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </output>
  );
}
