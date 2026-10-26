"use client";

import { CalendarX2, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { Appointment, WasteStreamId } from "@/mocks";
import { RouteSidebar, RouteTimeline } from "../../components";
import { TODAY, toDayKey } from "../../utils";
import {
  BoardSkeleton,
  DispatchHeader,
  DispatchMap,
  NewRouteDialog,
  SelectedAppointmentCard,
} from "./components";
import { useBoardActions, useDispatchDay } from "./hooks";

export default function Dispatch() {
  const [date, setDate] = useState(TODAY);
  const [stream, setStream] = useState<WasteStreamId | null>(null);
  const [selectedAppointmentId, setSelectedAppointment] = useState<
    string | null
  >(null);
  const [selectedRouteId, setSelectedRoute] = useState<string | null>(null);
  const [tab, setTab] = useState<"routes" | "backlog">("routes");
  const [creatingRoute, setCreatingRoute] = useState(false);

  const day = useDispatchDay(toDayKey(date));
  const { plans, backlog, overdue } = day;
  const { autoPlan, ...actions } = useBoardActions(plans, backlog);

  const matches = useCallback(
    (apt: Appointment) => stream === null || apt.stream === stream,
    [stream],
  );

  const changeDate = (next: Date) => {
    setDate(next);
    setSelectedAppointment(null);
    setSelectedRoute(null);
  };

  const selectedPlan = plans.find((p) =>
    p.stops.some((a) => a.id === selectedAppointmentId),
  );
  const selected =
    selectedPlan?.stops.find((a) => a.id === selectedAppointmentId) ??
    [...backlog, ...overdue].find((a) => a.id === selectedAppointmentId);

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
            stream={stream}
            onStreamChange={setStream}
            routes={plans.length}
            stops={plans.reduce((sum, p) => sum + p.activeStops, 0)}
            backlog={backlog.length}
            onAutoPlan={autoPlan}
            onNewRoute={() => setCreatingRoute(true)}
            onOptimizeAll={() =>
              toast.success(
                `Optimized ${plans.filter((p) => !p.locked).length} unlocked routes`,
                {
                  description:
                    "Prototype only — the stop order would be re-sequenced for the shortest drive.",
                },
              )
            }
          />

          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <DispatchMap
                plans={plans}
                backlog={backlog}
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
                empty={
                  <EmptyState
                    icon={CalendarX2}
                    title="No routes on this day"
                    description={
                      backlog.length > 0
                        ? `${backlog.length} backlog ${backlog.length === 1 ? "appointment is" : "appointments are"} waiting, but there is no route to put them on.`
                        : "Nothing is scheduled. Pick another day on the date strip."
                    }
                    className="py-8"
                    action={
                      <Button size="sm" onClick={() => setCreatingRoute(true)}>
                        <Plus data-icon="inline-start" />
                        New route
                      </Button>
                    }
                  />
                }
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
              top={
                selected ? (
                  <SelectedAppointmentCard
                    appointment={selected}
                    plan={selectedPlan}
                    plans={plans}
                    onAssign={(routeId) => actions.assign(selected.id, routeId)}
                    onClose={() => setSelectedAppointment(null)}
                  />
                ) : null
              }
            />
          </div>

          <NewRouteDialog
            open={creatingRoute}
            onOpenChange={setCreatingRoute}
            day={toDayKey(date)}
            plans={plans}
            onCreated={(route) => {
              setCreatingRoute(false);
              setTab("routes");
              setSelectedRoute(route.id);
            }}
          />
        </>
      )}
    </div>
  );
}
