/**
 * Pin positions are stored as percentages of the page content area so they
 * survive different screen sizes and zoom levels.
 */

export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Round to 2 decimals — plenty for pin placement, keeps rows tidy. */
export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Convert a client-space point into % of the content rect, clamped to 0-100. */
export function pointToPercent(
  clientX: number,
  clientY: number,
  rect: Rect,
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  return {
    x: roundPercent(clampPercent(((clientX - rect.left) / rect.width) * 100)),
    y: roundPercent(clampPercent(((clientY - rect.top) / rect.height) * 100)),
  };
}

/** CSS offsets for a stored pin. The pin element centers itself on the point. */
export function percentToCss(
  x: number,
  y: number,
): { left: string; top: string } {
  return {
    left: `${clampPercent(x)}%`,
    top: `${clampPercent(y)}%`,
  };
}
