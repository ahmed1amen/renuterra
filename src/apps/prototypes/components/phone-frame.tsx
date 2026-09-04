import { BatteryFull, Signal, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Viewport } from "../viewports";

type PhoneFrameProps = {
  device?: Viewport;
  children: ReactNode;
};

/**
 * Device chrome around a prototype. The content area is the scroll container;
 * the screen inside renders exactly as it would in a real mobile browser and
 * never needs to know about the frame.
 */
export function PhoneFrame({ device = "iphone", children }: PhoneFrameProps) {
  if (device === "bare") {
    return (
      <div
        data-testid="phone-frame"
        data-device={device}
        className="bg-background ring-border h-[844px] w-[390px] shrink-0 overflow-y-auto rounded-lg ring-1"
      >
        <div className="flex min-h-full flex-col">{children}</div>
      </div>
    );
  }

  const isIphone = device === "iphone";

  return (
    <div
      data-testid="phone-frame"
      data-device={device}
      className={cn(
        "relative shrink-0 bg-neutral-950 shadow-2xl ring-1 ring-neutral-800",
        isIphone
          ? "h-[844px] w-[390px] rounded-[3.25rem] p-3"
          : "h-[800px] w-[360px] rounded-[2.25rem] p-2",
      )}
    >
      {/* Hardware buttons */}
      <span
        aria-hidden
        className={cn(
          "absolute -left-0.5 w-0.5 rounded-l bg-neutral-800",
          isIphone ? "top-28 h-8" : "top-24 h-6",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute -left-0.5 w-0.5 rounded-l bg-neutral-800",
          isIphone ? "top-40 h-14" : "top-32 h-16",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute -right-0.5 w-0.5 rounded-r bg-neutral-800",
          isIphone ? "top-44 h-20" : "top-36 h-12",
        )}
      />

      <div
        className={cn(
          "bg-background relative flex h-full w-full flex-col overflow-hidden [--safe-area-bottom:1.25rem]",
          isIphone ? "rounded-[2.5rem]" : "rounded-[1.75rem]",
        )}
      >
        <StatusBar variant={isIphone ? "iphone" : "android"} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">{children}</div>
        </div>

        {/* Home indicator */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center"
        >
          <span
            className={cn(
              "bg-foreground/80 rounded-full",
              isIphone ? "h-1.5 w-32" : "h-1 w-24",
            )}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ variant }: { variant: "iphone" | "android" }) {
  const isIphone = variant === "iphone";
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-between font-semibold",
        isIphone ? "h-12 px-8 pt-2 text-sm" : "h-9 px-5 pt-1 text-xs",
      )}
    >
      <span className="tabular-nums">9:41</span>

      {isIphone ? (
        <span className="absolute top-2.5 left-1/2 h-[34px] w-[120px] -translate-x-1/2 rounded-full bg-neutral-950" />
      ) : (
        <span className="absolute top-2 left-1/2 size-3 -translate-x-1/2 rounded-full bg-neutral-950" />
      )}

      <span className="flex items-center gap-1">
        <Signal className={isIphone ? "size-4" : "size-3.5"} />
        <Wifi className={isIphone ? "size-4" : "size-3.5"} />
        <BatteryFull className={isIphone ? "size-5" : "size-4"} />
      </span>
    </div>
  );
}
