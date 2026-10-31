"use client";

import { ChevronDown, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type OpenSlot, slotLabel } from "./dispatch-meta";

/**
 * "Staff…" for one empty slot: the spec's "resolve manually" loop. Eligible
 * assets first; the rest are greyed with the reason they can't go.
 */
export function StaffSlotMenu({
  slot,
  onStaff,
  disabled = false,
}: {
  slot: OpenSlot;
  onStaff: (assetId: string) => void;
  disabled?: boolean;
}) {
  const eligible = slot.options.filter((o) => o.eligible);
  const ineligible = slot.options.filter((o) => !o.eligible);
  const noun = slot.kind === "truck" ? "trucks" : `${slot.kind}s`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button variant="outline" size="xs" />}
      >
        <UserPlus data-icon="inline-start" />
        Staff…
        <ChevronDown data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Eligible {noun} for {slotLabel(slot.slot)}
          </DropdownMenuLabel>
          {eligible.length === 0 ? (
            <DropdownMenuItem disabled>
              No eligible {noun} free this shift
            </DropdownMenuItem>
          ) : (
            eligible.map((o) => (
              <DropdownMenuItem key={o.id} onClick={() => onStaff(o.id)}>
                <span
                  className={
                    slot.kind === "truck" ? "font-mono text-xs" : "truncate"
                  }
                >
                  {o.name}
                </span>
                <span className="text-muted-foreground ml-auto truncate text-xs">
                  {o.detail}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
        {ineligible.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Not eligible</DropdownMenuLabel>
              {ineligible.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  disabled
                  className="items-start"
                  title={o.reason}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        slot.kind === "truck"
                          ? "block font-mono text-xs"
                          : "block truncate"
                      }
                    >
                      {o.name}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {o.reason}
                    </span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
