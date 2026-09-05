"use client";

import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Home,
  type LucideIcon,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STORAGE_KEYS } from "@/constants";
import { cn } from "@/lib/utils";
import { USERS } from "@/mocks";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the pathname exactly instead of by prefix. */
  exact?: boolean;
};

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: "Home", href: "/", icon: Home, exact: true },
      { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
    ],
  },
  {
    label: "Design system",
    items: [{ label: "Styleguide", href: "/styleguide", icon: Palette }],
  },
];

const CURRENT_USER = USERS[0];

/**
 * Desktop navigation rail. Collapses to icons only; the choice persists in
 * localStorage (prototype-grade persistence, no backend).
 */
export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1");
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, prev ? "0" : "1");
      return !prev;
    });

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const ToggleIcon = collapsed ? ChevronsRight : ChevronsLeft;

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-dvh shrink-0 flex-col border-r transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header aligns with the 56px topbar so the border lines meet. */}
      <div
        className={cn(
          "border-sidebar-border flex h-14 shrink-0 items-center border-b",
          collapsed ? "justify-center" : "gap-2 px-4",
        )}
      >
        {collapsed ? null : (
          <Link href="/" aria-label="Renuterra home" className="flex">
            <BrandLogo
              height={40}
              plate
              className="dark:px-1.5 dark:py-[3px]"
            />
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-lg transition-colors",
            !collapsed && "ml-auto",
          )}
        >
          <ToggleIcon className="size-4" aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {NAV_GROUPS.map((group, groupIndex) => (
          <nav
            key={group.label ?? "main"}
            aria-label={group.label ?? "Main"}
            className={groupIndex > 0 ? "mt-6" : undefined}
          >
            {group.label ? (
              collapsed ? (
                <div className="border-sidebar-border mx-1 mb-2 border-t" />
              ) : (
                <p className="text-muted-foreground/80 mb-1 px-2.5 text-[10.5px] font-medium tracking-[0.08em] uppercase">
                  {group.label}
                </p>
              )
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors",
                        collapsed ? "justify-center" : "px-2.5",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active
                            ? "text-sidebar-accent-foreground"
                            : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      {collapsed ? (
                        <span className="sr-only">{item.label}</span>
                      ) : (
                        item.label
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>

      <div
        className={cn(
          "border-sidebar-border flex shrink-0 items-center border-t py-3",
          collapsed ? "justify-center" : "gap-2.5 px-4",
        )}
      >
        <Avatar size="sm" className="size-8">
          <AvatarFallback className="bg-lime-200 text-[11px] font-semibold text-lime-900">
            {CURRENT_USER.initials}
          </AvatarFallback>
        </Avatar>
        {collapsed ? null : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium">
              {CURRENT_USER.name}
            </p>
            <p className="text-muted-foreground text-[11.5px]">
              Account executive
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
