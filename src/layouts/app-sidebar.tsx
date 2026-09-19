"use client";

import { ChevronsLeft, ChevronsRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STORAGE_KEYS } from "@/constants";
import { cn } from "@/lib/utils";
import { USERS } from "@/mocks";
import { useAgreementModal } from "@/stores/agreement-modal";
import { type NavAction, type NavItem, navForPath } from "./nav";

const CURRENT_USER = USERS[0];

/**
 * Desktop navigation rail. The nav swaps per app — `navForPath` picks the
 * entry that owns the current pathname, so entering an app replaces the
 * platform links with that app's own. Collapses to icons only; the choice
 * persists in localStorage (prototype-grade persistence, no backend).
 */
export function AppSidebar() {
  const pathname = usePathname();
  const nav = navForPath(pathname);
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
        {nav.label ? (
          <div className={cn("mb-4", collapsed ? "px-0" : "px-1")}>
            <Link
              href="/"
              title={collapsed ? "All apps" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-medium transition-colors",
                collapsed && "justify-center",
              )}
            >
              <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
              {collapsed ? (
                <span className="sr-only">All apps</span>
              ) : (
                "All apps"
              )}
            </Link>
            {collapsed ? null : (
              <p className="mt-2 px-1 text-sm font-semibold">{nav.label}</p>
            )}
          </div>
        ) : null}

        {nav.action ? (
          <ActionButton action={nav.action} collapsed={collapsed} />
        ) : null}

        {nav.groups.map((group, groupIndex) => (
          <nav
            key={group.label ?? "main"}
            aria-label={group.label ?? "Main"}
            className={groupIndex > 0 ? "mt-7" : undefined}
          >
            {group.label ? (
              collapsed ? (
                <div className="border-sidebar-border mx-1 mb-2 border-t" />
              ) : (
                <p className="text-muted-foreground mb-2 px-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase">
                  {group.label}
                </p>
              )
            ) : null}
            <ul className="flex flex-col gap-1">
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
                        "flex h-10 items-center gap-3 rounded-lg border border-transparent text-sm transition-colors",
                        collapsed ? "justify-center" : "px-3",
                        active
                          ? "bg-sidebar-accent border-sidebar-border text-sidebar-accent-foreground font-semibold"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 font-medium",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[18px] shrink-0",
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

/**
 * The app's primary action, sitting above its nav — full width when the rail
 * is open, an icon square when it is collapsed.
 */
function ActionButton({
  action,
  collapsed,
}: {
  action: NavAction;
  collapsed: boolean;
}) {
  const openAgreement = useAgreementModal((s) => s.openModal);
  const Icon = action.icon;
  const className = cn(
    "bg-primary text-primary-foreground hover:bg-primary/90 mb-5 flex h-10 items-center rounded-lg text-sm font-semibold transition-colors",
    collapsed ? "w-full justify-center" : "w-full justify-center gap-2 px-3",
  );
  const body = (
    <>
      <Icon className="size-[18px] shrink-0" aria-hidden />
      {collapsed ? (
        <span className="sr-only">{action.label}</span>
      ) : (
        <span className="whitespace-nowrap">{action.label}</span>
      )}
    </>
  );

  if (action.opens === "new-agreement") {
    return (
      <button
        type="button"
        title={collapsed ? action.label : undefined}
        onClick={() => openAgreement()}
        className={className}
      >
        {body}
      </button>
    );
  }

  if (action.href) {
    return (
      <Link
        href={action.href}
        title={collapsed ? action.label : undefined}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      title={collapsed ? action.label : undefined}
      onClick={() =>
        toast(`${action.label} isn't built yet`, {
          description:
            "It's on the platform map — this button is a placeholder.",
        })
      }
      className={className}
    >
      {body}
    </button>
  );
}
