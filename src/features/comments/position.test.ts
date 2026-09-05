import { describe, expect, it } from "vitest";
import {
  clampPercent,
  percentToCss,
  pointToPercent,
  roundPercent,
} from "./position";

const rect = { left: 100, top: 50, width: 400, height: 800 };

describe("pointToPercent", () => {
  it("maps the rect corners to 0 and 100", () => {
    expect(pointToPercent(100, 50, rect)).toEqual({ x: 0, y: 0 });
    expect(pointToPercent(500, 850, rect)).toEqual({ x: 100, y: 100 });
  });

  it("maps the center to 50/50", () => {
    expect(pointToPercent(300, 450, rect)).toEqual({ x: 50, y: 50 });
  });

  it("clamps points outside the rect", () => {
    expect(pointToPercent(0, 0, rect)).toEqual({ x: 0, y: 0 });
    expect(pointToPercent(10_000, 10_000, rect)).toEqual({ x: 100, y: 100 });
  });

  it("returns the origin for a degenerate rect instead of NaN", () => {
    expect(
      pointToPercent(10, 10, { left: 0, top: 0, width: 0, height: 0 }),
    ).toEqual({ x: 0, y: 0 });
  });

  it("rounds to two decimals", () => {
    const { x } = pointToPercent(233.3333, 50, rect); // 133.3333/400
    expect(x).toBe(33.33);
  });
});

describe("percentToCss", () => {
  it("emits percentage offsets", () => {
    expect(percentToCss(12.5, 80)).toEqual({ left: "12.5%", top: "80%" });
  });

  it("clamps stored values defensively", () => {
    expect(percentToCss(-5, 130)).toEqual({ left: "0%", top: "100%" });
  });
});

describe("clampPercent / roundPercent", () => {
  it("keeps values in 0-100", () => {
    expect(clampPercent(-1)).toBe(0);
    expect(clampPercent(101)).toBe(100);
    expect(clampPercent(42)).toBe(42);
  });

  it("rounds to 2 decimals", () => {
    expect(roundPercent(33.33333)).toBe(33.33);
    expect(roundPercent(66.666)).toBe(66.67);
  });
});
