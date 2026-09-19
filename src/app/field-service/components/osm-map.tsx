"use client";

import { Minus, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { env } from "@/env";
import { cn } from "@/lib/utils";

const TILE_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

/** How far the zoom animation closes on its target each frame. */
const ZOOM_EASING = 0.3;
/** Wheel pixels per zoom level — Leaflet's default feel. */
const WHEEL_PX_PER_ZOOM = 60;

/**
 * Carto's basemaps — OpenStreetMap data in a pale, low-contrast style that
 * lets route lines and job pins read on top of it. A light and a dark tileset
 * rather than a CSS filter, so labels stay legible in both themes.
 *
 * The raster tiles want an API key; without one they come back stamped with an
 * "API key required" watermark, so the key is appended when it is configured.
 */
const TILE_SUBDOMAINS = ["a", "b", "c", "d"];
const TILE_KEY = env.NEXT_PUBLIC_CARTO_BASEMAP_KEY;

function tileUrl(theme: "light" | "dark", z: number, x: number, y: number) {
  const subdomain = TILE_SUBDOMAINS[(x + y) % TILE_SUBDOMAINS.length];
  const style = theme === "dark" ? "dark_all" : "light_all";
  const retina = typeof window !== "undefined" && window.devicePixelRatio > 1;
  const key = TILE_KEY ? `?key=${TILE_KEY}` : "";
  return `https://${subdomain}.basemaps.cartocdn.com/${style}/${z}/${x}/${y}${retina ? "@2x" : ""}.png${key}`;
}

export type LatLng = { lat: number; lng: number };

type Point = { x: number; y: number };

/** Web Mercator: world pixel coordinates at a zoom level. */
function project({ lat, lng }: LatLng, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function unproject({ x, y }: Point, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  return {
    lng: (x / scale) * 360 - 180,
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
  };
}

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

type View = { center: LatLng; zoom: number };

/** What overlays need to place themselves over the tiles. */
export type MapApi = {
  /** Position of a coordinate in the map's own pixel box. */
  toScreen: (at: LatLng) => Point;
  zoom: number;
};

/**
 * Slippy map over Carto's OpenStreetMap basemaps — drag to pan, wheel to zoom.
 * Deliberately dependency-free: tiles are plain <img> elements positioned in
 * world pixel space, which keeps overlays (job pins, technician markers) a
 * matter of absolute positioning on the same transform.
 *
 * Zoom is fractional and animated. Tiles only exist at integer zooms, so the
 * layer for the nearest integer is CSS-scaled by the remainder — the same
 * trick Leaflet and MapLibre use to make a wheel gesture continuous instead of
 * snapping one level at a time. The previous integer layer is kept underneath
 * until the new one has loaded, so zooming never flashes empty background.
 */
export function OsmMap({
  center,
  zoom: initialZoom = 11,
  className,
  children,
}: {
  /** Starting centre. Panning takes over from here; remount to reset it. */
  center: LatLng;
  /** Starting zoom, 3–18. */
  zoom?: number;
  className?: string;
  /**
   * Overlays ride above the tiles. Pass a function to receive the projection
   * so markers can be placed by coordinate.
   */
  children?: React.ReactNode | ((api: MapApi) => React.ReactNode);
}) {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState<View>({ center, zoom: initialZoom });
  const drag = useRef<Point | null>(null);

  const tileZoom = clampZoom(Math.round(view.zoom));

  // The integer layer to keep underneath until the current one has loaded.
  const [baseZoom, setBaseZoom] = useState<number | null>(null);
  const lastTileZoom = useRef(tileZoom);
  if (lastTileZoom.current !== tileZoom) {
    // Render-phase swap, so the outgoing layer is never unmounted for a frame.
    setBaseZoom(lastTileZoom.current);
    lastTileZoom.current = tileZoom;
  }

  // Measure the viewport so only the visible tiles are requested.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * Zoom toward a point on screen, keeping the place under it fixed — what
   * makes wheel zoom feel anchored to the cursor rather than recentring.
   */
  const zoomAround = useCallback(
    (nextZoom: number, anchor: Point | null, current: View): View => {
      const zoom = clampZoom(nextZoom);
      if (!anchor || !size.width) return { ...current, zoom };

      // Offset of the anchor from the viewport centre, in screen pixels.
      const dx = anchor.x - size.width / 2;
      const dy = anchor.y - size.height / 2;

      const from = project(current.center, current.zoom);
      const held = unproject({ x: from.x + dx, y: from.y + dy }, current.zoom);

      // Put that same place back under the anchor at the new zoom.
      const to = project(held, zoom);
      return { center: unproject({ x: to.x - dx, y: to.y - dy }, zoom), zoom };
    },
    [size.width, size.height],
  );

  // Animated zoom: input sets a target, a frame loop eases the view toward it.
  const target = useRef<{ zoom: number; anchor: Point | null } | null>(null);
  const frame = useRef(0);

  const step = useCallback(() => {
    frame.current = 0;
    setView((current) => {
      const goal = target.current;
      if (!goal) return current;

      const delta = goal.zoom - current.zoom;
      if (Math.abs(delta) < 0.002) {
        target.current = null;
        return zoomAround(goal.zoom, goal.anchor, current);
      }

      frame.current = requestAnimationFrame(step);
      return zoomAround(
        current.zoom + delta * ZOOM_EASING,
        goal.anchor,
        current,
      );
    });
  }, [zoomAround]);

  const zoomBy = useCallback(
    (delta: number, anchor: Point | null) => {
      const from = target.current?.zoom ?? view.zoom;
      target.current = { zoom: clampZoom(from + delta), anchor };
      if (!frame.current) frame.current = requestAnimationFrame(step);
    },
    [view.zoom, step],
  );

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    },
    [],
  );

  // Bound manually because React's onWheel is passive: it cannot
  // preventDefault, so the page would scroll behind the map.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomBy(-e.deltaY / WHEEL_PX_PER_ZOOM, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setView((current) => {
      const origin = project(current.center, current.zoom);
      return {
        ...current,
        center: unproject({ x: origin.x - dx, y: origin.y - dy }, current.zoom),
      };
    });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const screenCentre = { x: size.width / 2, y: size.height / 2 };

  /** Coordinate -> position inside this element, at the live fractional zoom. */
  const toScreen = (at: LatLng): Point => {
    const origin = project(view.center, view.zoom);
    const point = project(at, view.zoom);
    return {
      x: point.x - origin.x + screenCentre.x,
      y: point.y - origin.y + screenCentre.y,
    };
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-muted relative touch-none overflow-hidden select-none",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="application"
      aria-label={`Map centred on ${view.center.lat.toFixed(3)}, ${view.center.lng.toFixed(3)}`}
    >
      {/* The outgoing layer stays put until the incoming one has loaded. */}
      {baseZoom !== null && baseZoom !== tileZoom ? (
        <TileLayer
          key={`base-${baseZoom}`}
          zoom={baseZoom}
          view={view}
          size={size}
          theme={theme}
        />
      ) : null}

      <TileLayer
        key={`live-${tileZoom}`}
        zoom={tileZoom}
        view={view}
        size={size}
        theme={theme}
        onReady={() => setBaseZoom(null)}
      />

      {typeof children === "function"
        ? size.width > 0
          ? children({ toScreen, zoom: view.zoom })
          : null
        : children}

      <div className="border-border bg-card absolute top-3 right-3 flex flex-col overflow-hidden rounded-lg border shadow-sm">
        <ZoomButton
          label="Zoom in"
          icon={Plus}
          disabled={view.zoom >= MAX_ZOOM}
          onClick={() => zoomBy(1, screenCentre)}
        />
        <span className="bg-border h-px" aria-hidden />
        <ZoomButton
          label="Zoom out"
          icon={Minus}
          disabled={view.zoom <= MIN_ZOOM}
          onClick={() => zoomBy(-1, screenCentre)}
        />
      </div>

      <p className="bg-card/80 text-muted-foreground absolute right-0 bottom-0 px-1.5 py-0.5 text-[10px] backdrop-blur">
        ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OpenStreetMap
        </a>{" "}
        contributors ©{" "}
        <a
          href="https://carto.com/attributions"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          CARTO
        </a>
      </p>
    </div>
  );
}

/**
 * The tiles for one integer zoom, CSS-scaled to match the view's fractional
 * zoom. Reports `onReady` once every tile it rendered has decoded, which is
 * what lets the map drop the layer underneath.
 */
function TileLayer({
  zoom,
  view,
  size,
  theme,
  onReady,
}: {
  zoom: number;
  view: View;
  size: { width: number; height: number };
  theme: "light" | "dark";
  onReady?: () => void;
}) {
  const loaded = useRef(new Set<string>());
  const [, bumpLoaded] = useState(0);

  const scale = 2 ** (view.zoom - zoom);
  // The layer is laid out at its own zoom, then scaled into place.
  const width = size.width / scale;
  const height = size.height / scale;

  const origin = project(view.center, zoom);
  const left = origin.x - width / 2;
  const top = origin.y - height / 2;
  const tileCount = 2 ** zoom;

  const tiles: { key: string; x: number; y: number; url: string }[] = [];
  if (size.width && size.height) {
    const lastX = Math.floor((left + width) / TILE_SIZE);
    const lastY = Math.floor((top + height) / TILE_SIZE);
    for (let x = Math.floor(left / TILE_SIZE); x <= lastX; x++) {
      for (let y = Math.floor(top / TILE_SIZE); y <= lastY; y++) {
        if (y < 0 || y >= tileCount) continue;
        // Wrap horizontally so panning past the date line keeps rendering.
        const wrappedX = ((x % tileCount) + tileCount) % tileCount;
        tiles.push({
          key: `${zoom}/${x}/${y}`,
          x: x * TILE_SIZE - left,
          y: y * TILE_SIZE - top,
          url: tileUrl(theme, zoom, wrappedX, y),
        });
      }
    }
  }

  const allLoaded =
    tiles.length > 0 && tiles.every((tile) => loaded.current.has(tile.url));

  useEffect(() => {
    if (allLoaded) onReady?.();
  }, [allLoaded, onReady]);

  return (
    <div
      className="absolute top-1/2 left-1/2 origin-center"
      style={{
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transform: `scale(${scale})`,
        willChange: "transform",
      }}
    >
      {tiles.map((tile) => (
        // biome-ignore lint/performance/noImgElement: Carto serves fixed-size tiles; next/image would proxy every one.
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          aria-hidden
          draggable={false}
          width={TILE_SIZE}
          height={TILE_SIZE}
          onLoad={() => {
            if (loaded.current.has(tile.url)) return;
            loaded.current.add(tile.url);
            bumpLoaded((n) => n + 1);
          }}
          className={cn(
            "absolute max-w-none transition-opacity duration-200",
            loaded.current.has(tile.url) ? "opacity-100" : "opacity-0",
          )}
          style={{ left: tile.x, top: tile.y }}
        />
      ))}
    </div>
  );
}

function ZoomButton({
  label,
  icon: Icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: typeof Plus;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-8 items-center justify-center transition-colors disabled:opacity-40"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
