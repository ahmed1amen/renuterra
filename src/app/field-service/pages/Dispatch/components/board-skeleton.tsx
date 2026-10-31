import { Skeleton } from "@/components/ui/skeleton";

/** The board's shape while routes and appointments load. */
export function BoardSkeleton() {
  return (
    <output
      aria-label="Loading the dispatch board"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-border grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b px-4 py-2">
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-12 w-[38rem] rounded-xl" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="min-h-0 flex-1 rounded-none" />
          <div className="border-border h-[300px] shrink-0 space-y-2 border-t p-3">
            <Skeleton className="h-5 w-56" />
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-3">
                <Skeleton className="h-10 w-56" />
                <Skeleton
                  className="h-8"
                  style={{ width: `${30 + ((row * 17) % 40)}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-border w-96 shrink-0 space-y-3 border-l p-3">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9" />
            <Skeleton className="h-9" />
          </div>
          <Skeleton className="h-10 w-full" />
          {[0, 1, 2].map((card) => (
            <Skeleton key={card} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading the dispatch board</span>
    </output>
  );
}
