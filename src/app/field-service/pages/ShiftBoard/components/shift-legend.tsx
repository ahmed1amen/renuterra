import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHIFT_TYPE, SHIFT_TYPE_ORDER } from "../../../components";
import { TONE_BLOCK } from "./board-meta";

/** What the block colours and markers on the board mean. */
export function ShiftLegend() {
  return (
    <ul className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
      {SHIFT_TYPE_ORDER.map((type) => {
        const { label, tone, icon: Icon } = SHIFT_TYPE[type];
        return (
          <li key={type} className="flex items-center gap-1.5">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded",
                TONE_BLOCK[tone],
              )}
            >
              <Icon className="size-3" aria-hidden />
            </span>
            {label}
          </li>
        );
      })}
      <li className="flex items-center gap-1.5">
        <Clock className="text-warning size-3.5" aria-hidden />
        Overtime
      </li>
      <li className="flex items-center gap-1.5">
        <AlertTriangle className="text-destructive size-3.5" aria-hidden />
        On a route without a working shift
      </li>
    </ul>
  );
}
