"use client";

import { CalendarClock, CalendarX2, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Appointment, WasteStreamId } from "@/mocks";
import { canOptimize, RouteSidebar, RouteTimeline } from "../../components";
import { parseDayKey, TODAY, toDayKey } from "../../utils";
import {
  BoardSkeleton,
  DispatchHeader,
  DispatchMap,
  formatDayKey,
  GenerateDialog,
  HORIZON,
  SelectedAppointmentCard,
  SidebarActions,
} from "./components";
import {
  type GenerationResult,
  useBoardActions,
  useDispatchDay,
  useGenerate,
} from "./hooks";

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** `?date=YYYY-MM-DD`, else today; a malformed value falls back to today. */
function dateFromParam(value: string | null) {
  if (!value || !DAY_KEY.test(value)) return TODAY;
  const date = parseDayKey(value);
  return Number.isNaN(date.getTime()) ? TODAY : date;
}

// `useSearchParams` needs a Suspense boundary for the route to prerender.
export default function Dispatch() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
          <BoardSkeleton />
        </div>
      }
    >
      <Board />
    </Suspense>
  );
}

function Board() {
  // The day lives in the URL so a board link opens on the same day.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const date = dateFromParam(searchParams.get("date"));
  const [stream, setStream] = useState<WasteStreamId | null>(null);
  const [selectedAppointmentId, setSelectedAppointment] = useState<
    string | null
  >(null);
  const [selectedRouteId, setSelectedRoute] = useState<string | null>(null);
  const [tab, setTab] = useState<"routes" | "backlog">("routes");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const dayKey = toDayKey(date);
  const day = useDispatchDay(dayKey);
  const { plans, backlog, overdue, defaultRoutes, dueRoutes } = day;
  const { confirmAllReady, placeBacklog, optimizeAll, ...actions } =
    useBoardActions(plans, backlog, defaultRoutes);
  const generator = useGenerate();

  const runGeneration = (days: string[]) => {
    const summary = generator.run(days);
    if (!summary) return;
    setResult(summary);
    setGenerating(true);
  };

  const matches = useCallback(
    (apt: Appointment) => stream === null || apt.stream === stream,
    [stream],
  );

  const changeDate = (next: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", toDayKey(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setSelectedAppointment(null);
    setSelectedRoute(null);
  };

  const ready = plans.filter(
    (p) => p.plannable && !p.locked && p.blockers.length === 0,
  ).length;

  const selectedPlan = plans.find((p) =>
    p.stops.some((a) => a.id === selectedAppointmentId),
  );
  const selected =
    selectedPlan?.stops.find((a) => a.id === selectedAppointmentId) ??
    [...backlog, ...overdue].find((a) => a.id === selectedAppointmentId);

  // The day has due Routes but no instances: the D-1 job hasn't run yet.
  const inHorizon = HORIZON.includes(dayKey);
  const notGenerated = plans.length === 0 && dueRoutes.length > 0;
  const emptyDay = notGenerated ? (
    <EmptyState
      icon={CalendarClock}
      title="Not generated yet"
      description={
        inHorizon
          ? `${dueRoutes.length} ${dueRoutes.length === 1 ? "route is" : "routes are"} due on ${formatDayKey(dayKey)}. Instances are generated automatically at 20:00 the day before, or now if you want to plan ahead.`
          : `${dueRoutes.length} ${dueRoutes.length === 1 ? "route is" : "routes are"} due on ${formatDayKey(dayKey)}, but instances can only be generated up to 7 days ahead.`
      }
      className="px-6 py-8"
      action={
        inHorizon ? (
          <Button
            size="sm"
            disabled={!generator.ready}
            onClick={() => runGeneration([dayKey])}
          >
            <Sparkles data-icon="inline-start" />
            Generate this day
          </Button>
        ) : undefined
      }
    />
  ) : (
    <EmptyState
      icon={CalendarX2}
      title="No routes due on this day"
      description={
        backlog.length > 0
          ? `${backlog.length} backlog ${backlog.length === 1 ? "job is" : "jobs are"} waiting, but no Active Route runs this day.`
          : "No Active Route is scheduled. Pick another day on the date strip."
      }
      className="px-6 py-8"
    />
  );

  return (
    // The topbar is 56px; the board takes the rest of the viewport.
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {day.isPending ? (
        <BoardSkeleton />
      ) : day.error ? (
        <div className="flex flex-1 items-center justify-center">
          <ErrorState
            title="Couldn't load the dispatch board"
            error={day.error}
            onRetry={day.refetch}
          />
        </div>
      ) : (
        <>
          <DispatchHeader
            date={date}
            onDateChange={changeDate}
            routes={plans.length}
            stops={plans.reduce((sum, p) => sum + p.activeStops, 0)}
            unstaffed={plans.filter((p) => p.openSlots.length > 0).length}
            onGenerate={() => {
              setResult(null);
              setGenerating(true);
            }}
          />

          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <DispatchMap
                plans={plans}
                backlog={backlog}
                stream={stream}
                onStreamChange={setStream}
                onShowBacklog={() => setTab("backlog")}
                matches={matches}
                isToday={day.isToday}
                selectedRouteId={selectedRouteId}
                selectedAppointmentId={selectedAppointmentId}
                onSelectRoute={setSelectedRoute}
                onSelectAppointment={setSelectedAppointment}
              />

              <RouteTimeline
                plans={plans}
                backlog={backlog}
                isToday={day.isToday}
                matches={matches}
                selectedRouteId={selectedRouteId}
                selectedAppointmentId={selectedAppointmentId}
                onSelectRoute={setSelectedRoute}
                onSelectAppointment={setSelectedAppointment}
                onMove={actions.assign}
                empty={emptyDay}
              />
            </div>

            <RouteSidebar
              plans={plans}
              backlog={backlog}
              overdue={overdue}
              selectedRouteId={selectedRouteId}
              tab={tab}
              onTabChange={setTab}
              onSelectRoute={setSelectedRoute}
              onSelectAppointment={setSelectedAppointment}
              actions={actions}
              defaultRoutes={defaultRoutes}
              routesEmpty={emptyDay}
              top={
                <>
                  <SidebarActions
                    routes={plans.length}
                    ready={ready}
                    backlog={backlog.length}
                    optimizable={plans.filter(canOptimize).length}
                    onPlaceBacklog={placeBacklog}
                    onOptimizeAll={optimizeAll}
                    onConfirmAllReady={confirmAllReady}
                  />
                  {selected ? (
                    <SelectedAppointmentCard
                      appointment={selected}
                      plan={selectedPlan}
                      plans={plans}
                      onAssign={(routeId) =>
                        actions.assign(selected.id, routeId)
                      }
                      onClose={() => setSelectedAppointment(null)}
                    />
                  ) : null}
                </>
              }
            />
          </div>

          <GenerateDialog
            open={generating}
            onOpenChange={(open) => {
              setGenerating(open);
              if (!open) setResult(null);
            }}
            defaultDay={inHorizon ? dayKey : HORIZON[0]}
            result={result}
            ready={generator.ready}
            onGenerate={runGeneration}
            onJump={(next) => {
              setGenerating(false);
              setResult(null);
              changeDate(parseDayKey(next));
              setTab("routes");
            }}
          />
        </>
      )}
    </div>
  );
}
