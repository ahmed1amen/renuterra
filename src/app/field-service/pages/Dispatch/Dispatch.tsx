"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useDispatchBoard } from "@/features/field-service";
import { cn } from "@/lib/utils";
import { MOCK_NOW } from "@/mocks";
import {
  DateStrip,
  JobPin,
  MapLegend,
  OsmMap,
  type Route,
  type RouteLine,
  RouteLines,
  RouteSidebar,
  RouteTimeline,
  routeColors,
  VehicleMarker,
} from "../../components";
import { isSameDay } from "../../utils";

/** Dubai — where the service points in the fixtures are. */
const MAP_CENTER = { lat: 25.14, lng: 55.23 };

export default function Dispatch() {
  const [date, setDate] = useState(() => new Date(MOCK_NOW));
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const { jobs, technicians, isPending } = useDispatchBoard();

  const dayJobs = useMemo(
    () => jobs.filter((job) => isSameDay(new Date(job.scheduledFor), date)),
    [jobs, date],
  );

  /** One route per technician: their stops for the selected day, in order. */
  const routes = useMemo<Route[]>(
    () =>
      technicians.map((technician) => {
        const laneJobs = dayJobs.filter(
          (job) => job.technicianId === technician.id,
        );
        return {
          technician,
          jobs: laneJobs,
          bookedMins: laneJobs
            .filter((job) => job.status !== "completed")
            .reduce((sum, job) => sum + job.durationMins, 0),
        };
      }),
    [technicians, dayJobs],
  );

  const unassigned = useMemo(
    () => dayJobs.filter((job) => job.technicianId === null),
    [dayJobs],
  );

  /**
   * Stop order and route colour, per job. Only jobs on a route get an entry —
   * the rest are drawn as alerts, since nobody is scheduled to drive to them.
   */
  const stops = useMemo(() => {
    const map = new Map<string, { stop: number; fill: string }>();
    routes.forEach((route, routeIndex) => {
      const { fill } = routeColors(routeIndex);
      route.jobs.forEach((job, index) => {
        map.set(job.id, { stop: index + 1, fill });
      });
    });
    return map;
  }, [routes]);

  /** A selected route dims everything that is not on it. */
  const isDimmed = (technicianId: string | null) =>
    selectedRoute !== null && technicianId !== selectedRoute;

  return (
    // The topbar is 56px; the board takes the rest of the viewport.
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <header className="border-border bg-background flex shrink-0 items-center justify-center border-b px-4 py-2">
        <DateStrip value={date} onChange={setDate} />
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <OsmMap center={MAP_CENTER} zoom={10} className="min-h-0 flex-1">
            {({ toScreen }) => (
              <>
                {/* The planned run for each route, drawn beneath the pins. */}
                <RouteLines
                  lines={routes
                    .filter((route) => route.jobs.length > 0)
                    .map<RouteLine>((route, index) => {
                      const nextStop = route.jobs.find(
                        (job) => job.status !== "completed",
                      );
                      return {
                        id: route.technician.id,
                        stroke: routeColors(index).stroke,
                        points: route.jobs.map((job) => toScreen(job)),
                        from: nextStop ? toScreen(route.technician) : undefined,
                        dimmed: isDimmed(route.technician.id),
                      };
                    })}
                />

                {technicians.map((technician) => {
                  const at = toScreen(technician);
                  return (
                    <span
                      key={technician.id}
                      className={cn(
                        "pointer-events-none absolute transition-opacity",
                        isDimmed(technician.id) && "opacity-30",
                      )}
                      style={{ left: at.x, top: at.y }}
                    >
                      <span className="pointer-events-auto">
                        <VehicleMarker
                          technician={technician}
                          onClick={() =>
                            setSelectedRoute(
                              selectedRoute === technician.id
                                ? null
                                : technician.id,
                            )
                          }
                        />
                      </span>
                    </span>
                  );
                })}

                {dayJobs.map((job) => {
                  const at = toScreen(job);
                  return (
                    <span
                      key={job.id}
                      className={cn(
                        "pointer-events-none absolute transition-opacity",
                        isDimmed(job.technicianId) && "opacity-30",
                      )}
                      style={{ left: at.x, top: at.y }}
                    >
                      <span className="pointer-events-auto">
                        <JobPin
                          job={job}
                          stop={stops.get(job.id)?.stop}
                          fill={stops.get(job.id)?.fill}
                          selected={selectedJob === job.id}
                          onClick={() =>
                            setSelectedJob(
                              selectedJob === job.id ? null : job.id,
                            )
                          }
                        />
                      </span>
                    </span>
                  );
                })}

                <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-2">
                  <Badge
                    variant="neutral"
                    className="bg-card/90 pointer-events-auto backdrop-blur"
                  >
                    {isPending
                      ? "Loading jobs…"
                      : `${dayJobs.length} ${dayJobs.length === 1 ? "job" : "jobs"}`}
                  </Badge>
                  <MapLegend className="pointer-events-auto" />
                </div>
              </>
            )}
          </OsmMap>

          <RouteTimeline
            routes={routes}
            unassigned={unassigned}
            date={date}
            selectedRouteId={selectedRoute}
            selectedJobId={selectedJob}
            onSelectRoute={setSelectedRoute}
            onSelectJob={setSelectedJob}
          />
        </div>

        <RouteSidebar
          routes={routes}
          unassigned={unassigned}
          selectedRouteId={selectedRoute}
          onSelectRoute={setSelectedRoute}
          onSelectJob={setSelectedJob}
        />
      </div>
    </div>
  );
}
