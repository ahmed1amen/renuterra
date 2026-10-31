"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  activationChecks,
  type RouteContext,
  useRouteStore,
} from "@/features/field-service";
import type { Route } from "@/mocks";
import {
  isBlocked,
  logRouteEvent,
  RuleCheckList,
  TODAY_KEY,
} from "../../../components";

/** Draft → Active, behind the R2/R3/R12/R21/R22 checklist. */
export function ActivateDialog({
  open,
  onOpenChange,
  route,
  ctx,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: Route;
  ctx: RouteContext;
}) {
  const patchRoute = useRouteStore((s) => s.patchRoute);
  const checks = activationChecks(route, ctx);
  const blocked = isBlocked(checks);
  const failing = checks.filter((c) => !c.ok && c.severity === "block");

  function activate() {
    const validFrom = route.validFrom < TODAY_KEY ? TODAY_KEY : route.validFrom;
    patchRoute(route.id, { status: "active", validFrom });
    logRouteEvent(
      route.id,
      "Route activated",
      `${route.code} v${route.version}`,
    );
    toast.success(`${route.code} is active`, {
      description: `The code is now locked. Instances generate from ${validFrom}.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Activate {route.code}</DialogTitle>
          <DialogDescription>
            A route goes live only when the definition, its resources and the
            stream mix all pass.
          </DialogDescription>
        </DialogHeader>
        <RuleCheckList checks={checks} />
        {route.serviceLineIds.length === 0 ? (
          <p className="text-warning text-sm">
            No service lines attached yet — instances will have no stops.
          </p>
        ) : null}
        <DialogFooter>
          {blocked ? (
            <p className="text-destructive me-auto self-center text-xs">
              {failing.length} {failing.length === 1 ? "check" : "checks"} to
              fix first
            </p>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={activate} disabled={blocked}>
            Activate route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
