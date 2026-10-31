"use client";

import { useCallback } from "react";
import { useAppointmentStore } from "./appointment-store";
import { type GenerationSummary, generateInstances } from "./dispatch-engine";
import { useVehicles } from "./fleet-store";
import { useContainerTypes, useServiceItems } from "./hooks/use-catalog";
import { useOpsMasters } from "./hooks/use-routes-query";
import { useServicePoints } from "./hooks/use-service-points";
import { useTechnicians } from "./hooks/use-technicians";
import {
  useRouteInstanceStore,
  useRouteInstances,
} from "./route-instance-store";
import { useRouteAssignments, useRoutes } from "./route-store";
import { useShifts } from "./shift-store";

/**
 * Runs the dispatch engine on everything currently loaded (session edits
 * included) and writes the result into session state: the prototype's
 * stand-in for the nightly D-1 20:00 job.
 */
export function useInstanceGenerator() {
  const routes = useRoutes();
  const assignments = useRouteAssignments();
  const masters = useOpsMasters();
  const vehicles = useVehicles();
  const pros = useTechnicians();
  const servicePoints = useServicePoints();
  const items = useServiceItems();
  const containerTypes = useContainerTypes();
  const instances = useRouteInstances();
  const { shiftOf } = useShifts();
  const addInstance = useRouteInstanceStore((s) => s.add);
  const addAppointments = useAppointmentStore((s) => s.addMany);

  const ready = Boolean(
    routes.data &&
      assignments.data &&
      masters.data &&
      vehicles.data &&
      pros.data &&
      servicePoints.data &&
      items.data &&
      containerTypes.data &&
      instances.data,
  );

  const generate = useCallback(
    (days: string[]): GenerationSummary | null => {
      if (
        !routes.data ||
        !assignments.data ||
        !masters.data ||
        !vehicles.data ||
        !pros.data ||
        !servicePoints.data ||
        !items.data ||
        !containerTypes.data ||
        !instances.data
      )
        return null;
      const result = generateInstances({
        days,
        routes: routes.data,
        assignments: assignments.data,
        masters: masters.data,
        vehicles: vehicles.data,
        pros: pros.data,
        servicePoints: servicePoints.data,
        items: items.data,
        containerTypes: containerTypes.data,
        existing: instances.data,
        shiftOf,
      });
      addAppointments(result.appointments);
      for (const instance of result.instances) addInstance(instance);
      return result.summary;
    },
    [
      routes.data,
      assignments.data,
      masters.data,
      vehicles.data,
      pros.data,
      servicePoints.data,
      items.data,
      containerTypes.data,
      instances.data,
      shiftOf,
      addInstance,
      addAppointments,
    ],
  );

  return { generate, ready };
}
