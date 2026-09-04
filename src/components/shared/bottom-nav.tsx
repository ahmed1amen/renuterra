import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
};

type BottomNavProps = {
  items: BottomNavItem[];
  className?: string;
};

/**
 * Mobile tab bar. Sticks to the bottom of its nearest scroll container and
 * pads for the device's home indicator via `--safe-area-bottom`.
 */
export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "border-border bg-background/95 sticky bottom-0 z-10 mt-auto border-t pb-[var(--safe-area-bottom,0px)] backdrop-blur",
        className,
      )}
    >
      <ul className="flex">
        {items.map(({ label, icon: Icon, href, active }) => (
          <li key={label} className="flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-1 pt-2 pb-1.5 text-[0.65rem] font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn("size-5", active && "stroke-[2.25]")}
                aria-hidden
              />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
