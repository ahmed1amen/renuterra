"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServicePoint } from "@/mocks";
import { OsmMap } from "./osm-map";

/** Centre of a set of points — good enough at city scale. */
function centreOf(points: ServicePoint[]) {
  if (!points.length) return { lat: 25.2, lng: 55.27 };
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

/** Rough zoom that keeps every pin on screen. */
function zoomFor(points: ServicePoint[]) {
  if (points.length < 2) return 14;
  const span = Math.max(
    Math.max(...points.map((p) => p.lat)) -
      Math.min(...points.map((p) => p.lat)),
    Math.max(...points.map((p) => p.lng)) -
      Math.min(...points.map((p) => p.lng)),
  );
  if (span > 0.4) return 9;
  if (span > 0.15) return 10;
  if (span > 0.05) return 11;
  return 13;
}

/** Service point pins on the basemap; click a pin to select it. */
export function ServicePointMap({
  points,
  selectedId,
  onSelect,
  className,
}: {
  points: ServicePoint[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <OsmMap
      // Remount when the set changes so the view re-centres on it.
      key={points.map((p) => p.id).join()}
      center={centreOf(points)}
      zoom={zoomFor(points)}
      className={cn("overflow-hidden rounded-lg border", className)}
    >
      {({ toScreen }) =>
        points.map((point) => {
          const at = toScreen(point);
          const selected = point.id === selectedId;
          return (
            <button
              key={point.id}
              type="button"
              title={point.name}
              aria-label={point.name}
              aria-pressed={onSelect ? selected : undefined}
              onClick={() => onSelect?.(point.id)}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-full outline-none",
                selected ? "z-20" : "z-10",
              )}
              style={{ left: at.x, top: at.y }}
            >
              <MapPin
                aria-hidden
                className={cn(
                  "text-foreground drop-shadow-sm transition-transform",
                  selected
                    ? "fill-primary size-9 -translate-y-0.5"
                    : "fill-card size-7",
                  point.status === "inactive" && "opacity-50",
                )}
              />
            </button>
          );
        })
      }
    </OsmMap>
  );
}
