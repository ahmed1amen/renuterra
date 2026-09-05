"use client";

import { Pin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AppEntry } from "../apps";

const STATUS_BADGE = {
  live: { label: "Live", variant: "success" as const },
  beta: { label: "Beta", variant: "info" as const },
  soon: { label: "Soon", variant: "neutral" as const },
};

/** One tile in the launcher grid. Dummy apps explain themselves via a toast. */
export function AppCard({
  app,
  tone,
  pinned,
  onTogglePin,
}: {
  app: AppEntry;
  /** Icon-tile token classes, inherited from the category. */
  tone: string;
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const Icon = app.icon;
  const badge = STATUS_BADGE[app.status];

  const body = (
    <>
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl",
          tone,
          app.status === "soon" && "opacity-60 group-hover/app:opacity-100",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="text-sm font-medium">{app.name}</span>
    </>
  );

  return (
    <Card className="group/app relative h-32 flex-col items-center justify-center gap-2.5 p-4 transition-shadow hover:shadow-sm hover:ring-foreground/20">
      <Badge
        variant={badge.variant}
        className="absolute top-2.5 left-2.5 h-4 px-1.5 text-[10px]"
      >
        {badge.label}
      </Badge>
      <button
        type="button"
        aria-label={pinned ? `Unpin ${app.name}` : `Pin ${app.name}`}
        aria-pressed={pinned}
        onClick={onTogglePin}
        className={cn(
          "hover:bg-muted absolute top-1.5 right-1.5 z-10 flex size-7 items-center justify-center rounded-lg transition-all",
          pinned
            ? "text-foreground"
            : "text-muted-foreground opacity-0 group-hover/app:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Pin
          className={cn("size-3.5 -rotate-45", pinned && "fill-current")}
          aria-hidden
        />
      </button>

      {app.href ? (
        <Link
          href={app.href}
          className="flex flex-col items-center gap-2.5 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {body}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() =>
            toast(`${app.name} isn't built yet`, {
              description:
                "It's on the platform map — this tile is a placeholder.",
            })
          }
          className="flex flex-col items-center gap-2.5 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
        >
          {body}
        </button>
      )}
    </Card>
  );
}
