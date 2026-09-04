"use client";

import { Button } from "@/components/ui/button";
import { usePlaygroundParams } from "../hooks";
import { VIEWPORTS } from "../viewports";

/** iPhone / Android / bare toggle, persisted as `?device=` in the URL. */
export function ViewportSwitcher() {
  const { device, setDevice } = usePlaygroundParams();

  return (
    <fieldset className="border-border bg-background flex items-center gap-0.5 rounded-lg border p-0.5">
      <legend className="sr-only">Viewport</legend>
      {VIEWPORTS.map(({ id, label, icon: Icon }) => {
        const active = id === device;
        return (
          <Button
            key={id}
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => setDevice(id)}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </Button>
        );
      })}
    </fieldset>
  );
}
