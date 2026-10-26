import { Skeleton } from "@/components/ui/skeleton";

/** The board's shape while routes and appointments load. */
export function BoardSkeleton() {
  return (
    <output
      aria-label="Loading the dispatch board"
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="border-border flex shrink-0 items-center gap-4 border-b px-4 py-2">
        <Skeleton className="h-11 w-[34rem] rounded-xl" />
        <Skeleton className="h-4 w-48" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-24" />
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
          <Skeleton className="h-8 w-full" />
          {[0, 1, 2].map((card) => (
            <Skeleton key={card} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading the dispatch board</span>
    </output>
  );
}
