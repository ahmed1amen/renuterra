"use client";

import { CheckCheck, ChevronDown, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * The planning actions, pinned above the route list where the dispatcher is
 * already working — the header keeps only the date and board-level links.
 */
export function SidebarActions({
  routes,
  ready,
  backlog,
  optimizable,
  onPlaceBacklog,
  onOptimizeAll,
  onConfirmAllReady,
}: {
  routes: number;
  /** Instances with nothing blocking Confirm. */
  ready: number;
  backlog: number;
  /** Unconfirmed, open instances Optimize all would re-sequence. */
  optimizable: number;
  onPlaceBacklog: () => void;
  onOptimizeAll: () => void;
  onConfirmAllReady: () => void;
}) {
  return (
    <div className="border-border space-y-2.5 border-b px-3 py-3">
      <p className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          <span className="text-foreground font-semibold tabular-nums">
            {routes}
          </span>{" "}
          {routes === 1 ? "route" : "routes"} on this day
        </span>
        <span>
          <span className="text-foreground font-semibold tabular-nums">
            {ready}
          </span>{" "}
          ready to confirm
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {/* The old Auto-Plan: place the backlog, or re-sequence every route. */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" className="w-full" />}>
            <Wand2 data-icon="inline-start" />
            Auto-Plan
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuItem
              disabled={backlog === 0}
              onClick={onPlaceBacklog}
              className="items-start"
            >
              <Wand2 className="mt-0.5" aria-hidden />
              <span className="min-w-0">
                <span className="block">
                  Place backlog{backlog > 0 ? ` (${backlog})` : ""}
                </span>
                <span className="text-muted-foreground block text-xs">
                  Default route's instance first, else a compatible one
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={optimizable === 0}
              onClick={onOptimizeAll}
              className="items-start"
            >
              <Sparkles className="mt-0.5" aria-hidden />
              <span className="min-w-0">
                <span className="block">
                  Optimize all{optimizable > 0 ? ` (${optimizable})` : ""}
                </span>
                <span className="text-muted-foreground block text-xs">
                  Re-sequence every unconfirmed instance by window, then nearest
                  stop. Confirmed ones are skipped.
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onConfirmAllReady}
          disabled={ready === 0}
          title="Confirm every staffed instance inside capacity"
        >
          <CheckCheck data-icon="inline-start" />
          Confirm ready
        </Button>
      </div>
    </div>
  );
}
