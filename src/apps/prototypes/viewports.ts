import type { LucideIcon } from "lucide-react";
import { Bot, Maximize2, Smartphone } from "lucide-react";

export type Viewport = "iphone" | "android" | "bare";

export type ViewportSpec = {
  id: Viewport;
  label: string;
  icon: LucideIcon;
  width: number;
  height: number;
};

export const VIEWPORTS: ViewportSpec[] = [
  { id: "iphone", label: "iPhone", icon: Smartphone, width: 390, height: 844 },
  { id: "android", label: "Android", icon: Bot, width: 360, height: 800 },
  { id: "bare", label: "Bare", icon: Maximize2, width: 390, height: 844 },
];

export const DEFAULT_VIEWPORT: Viewport = "iphone";

export function isViewport(value: unknown): value is Viewport {
  return VIEWPORTS.some((v) => v.id === value);
}
