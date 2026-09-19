"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { Job, Technician } from "@/mocks";
import { useJobs } from "./hooks/use-jobs";
import { useTechnicians } from "./hooks/use-technicians";

/**
 * Dispatch assignments made during this session. Prototype-grade: the fixtures
 * stay untouched and everything resets on reload — there is no backend to
 * write to.
 */
type DispatchState = {
  /** jobId -> technicianId, or null when the job was sent back to the queue. */
  assignments: Record<string, string | null>;
  assign: (jobId: string, technicianId: string | null) => void;
  reset: () => void;
};

export const useDispatchStore = create<DispatchState>((set) => ({
  assignments: {},
  assign: (jobId, technicianId) =>
    set((state) => ({
      assignments: { ...state.assignments, [jobId]: technicianId },
    })),
  reset: () => set({ assignments: {} }),
}));

/** A job that has been touched this session reflects its new owner and status. */
function withAssignment(
  job: Job,
  assignments: Record<string, string | null>,
): Job {
  if (!(job.id in assignments)) return job;
  const technicianId = assignments[job.id];
  if (technicianId === job.technicianId) return job;
  return {
    ...job,
    technicianId,
    status: technicianId ? "scheduled" : "unassigned",
  };
}

export type TechnicianLane = {
  technician: Technician;
  jobs: Job[];
  /** Minutes of work booked onto the tech today. */
  bookedMins: number;
};

/**
 * Everything the dispatch board and the field service dashboard read: the two
 * queries, merged with this session's assignments and grouped per technician.
 */
export function useDispatchBoard() {
  const jobsQuery = useJobs();
  const techniciansQuery = useTechnicians();
  const assignments = useDispatchStore((s) => s.assignments);
  const assign = useDispatchStore((s) => s.assign);

  const jobs = useMemo(
    () => (jobsQuery.data ?? []).map((job) => withAssignment(job, assignments)),
    [jobsQuery.data, assignments],
  );

  const technicians = techniciansQuery.data ?? [];

  const lanes = useMemo<TechnicianLane[]>(
    () =>
      technicians.map((technician) => {
        const laneJobs = jobs.filter((j) => j.technicianId === technician.id);
        return {
          technician,
          jobs: laneJobs,
          bookedMins: laneJobs
            .filter((j) => j.status !== "completed")
            .reduce((sum, j) => sum + j.durationMins, 0),
        };
      }),
    [technicians, jobs],
  );

  const unassigned = useMemo(
    () => jobs.filter((j) => j.technicianId === null),
    [jobs],
  );

  return {
    jobs,
    technicians,
    lanes,
    unassigned,
    assign,
    isPending: jobsQuery.isPending || techniciansQuery.isPending,
    isError: jobsQuery.isError || techniciansQuery.isError,
    error: jobsQuery.error ?? techniciansQuery.error,
    refetch: () => {
      jobsQuery.refetch();
      techniciansQuery.refetch();
    },
  };
}
