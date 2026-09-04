"use client";

import { usePlaygroundParams } from "../hooks";
import type { Prototype } from "../registry";
import { PhoneFrame } from "./phone-frame";
import { ScenarioSwitcher } from "./scenario-switcher";
import { ScenarioSync } from "./scenario-sync";
import { StatusBadge } from "./status-badge";
import { ViewportSwitcher } from "./viewport-switcher";

/** Toolbar plus the selected prototype rendered inside the device frame. */
export function PrototypeStage({ prototype }: { prototype: Prototype }) {
  const { device } = usePlaygroundParams();
  const Component = prototype.component;

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {prototype.title}
            </h2>
            <StatusBadge status={prototype.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {prototype.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScenarioSwitcher />
          <ViewportSwitcher />
        </div>
      </div>

      <div className="bg-muted/40 flex flex-1 justify-center overflow-auto rounded-xl bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:16px_16px] p-8">
        <ScenarioSync />
        <PhoneFrame device={device} key={device}>
          <Component />
        </PhoneFrame>
      </div>
    </div>
  );
}
