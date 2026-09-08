"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { USERS } from "@/mocks";
import { isNavItemActive, NAV_GROUPS } from "./nav-items";

const CURRENT_USER = USERS[0];

/**
 * Below `lg` the navigation rail is hidden, so the same links live in a
 * drawer behind the topbar's menu button. Navigating closes it.
 */
export function AppMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            className="lg:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="bg-sidebar">
        <div className="border-sidebar-border flex h-14 shrink-0 items-center border-b px-4">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Link
            href="/"
            aria-label="Renuterra home"
            className="flex"
            onClick={close}
          >
            <BrandLogo
              height={40}
              plate
              className="dark:px-1.5 dark:py-[3px]"
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group, groupIndex) => (
            <nav
              key={group.label ?? "main"}
              aria-label={group.label ?? "Main"}
              className={groupIndex > 0 ? "mt-6" : undefined}
            >
              {group.label ? (
                <p className="text-muted-foreground/80 mb-1 px-2.5 text-[10.5px] font-medium tracking-[0.08em] uppercase">
                  {group.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavItemActive(item, pathname);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
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
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="border-sidebar-border flex shrink-0 items-center gap-2.5 border-t px-4 py-3">
          <Avatar size="sm" className="size-8">
            <AvatarFallback className="bg-lime-200 text-[11px] font-semibold text-lime-900">
              {CURRENT_USER.initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium">
              {CURRENT_USER.name}
            </p>
            <p className="text-muted-foreground text-[11.5px]">
              Account executive
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
