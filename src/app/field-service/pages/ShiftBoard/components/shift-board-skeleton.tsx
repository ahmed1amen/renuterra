import { Skeleton } from "@/components/ui/skeleton";

const ROWS = [0, 1, 2, 3, 4, 5];
const DAYS = [0, 1, 2, 3, 4, 5, 6];

/** The grid's shape while pros, shifts and routes load. */
export function ShiftBoardSkeleton() {
  return (
    <output aria-label="Loading the shift board" className="block space-y-2">
      <div className="flex gap-2">
        <Skeleton className="h-10 w-48" />
        {DAYS.map((d) => (
          <Skeleton key={d} className="h-10 flex-1" />
        ))}
      </div>
      {ROWS.map((row) => (
        <div key={row} className="flex gap-2">
          <div className="w-48 space-y-1.5 py-1">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          {DAYS.map((d) => (
            <Skeleton
              key={d}
              className="h-20 flex-1"
              style={{ opacity: (row + d) % 4 === 0 ? 0.35 : 1 }}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading the shift board</span>
    </output>
  );
}
