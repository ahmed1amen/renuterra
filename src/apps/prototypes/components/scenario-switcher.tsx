"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isMockScenario, MOCK_SCENARIOS, type MockScenario } from "@/mocks";
import { usePlaygroundParams } from "../hooks";

const LABELS: Record<MockScenario, string> = {
  default: "Live data",
  empty: "Empty",
  error: "Error",
  loading: "Loading",
};

/** Forces every mock request into a state so reviewers can see each one. */
export function ScenarioSwitcher() {
  const { scenario, setScenario } = usePlaygroundParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label="Data scenario" />
        }
      >
        {LABELS[scenario]}
        <ChevronDown className="size-3.5" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup
          value={scenario}
          onValueChange={(value) => {
            if (isMockScenario(value)) setScenario(value);
          }}
        >
          {MOCK_SCENARIOS.map((id) => (
            <DropdownMenuRadioItem key={id} value={id}>
              {LABELS[id]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
