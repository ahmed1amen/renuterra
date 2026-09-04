"use client";

import { ArrowLeft, LayoutGrid, Palette } from "lucide-react";
import Link from "next/link";
import { BrandLogo, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import { usePlaygroundParams } from "../hooks";
import { findPrototype, PROTOTYPE_STATUSES, PROTOTYPES } from "../registry";
import { PrototypeIndex } from "./prototype-index";
import { PrototypeStage } from "./prototype-stage";

const STATUS_DOT = {
  draft: "bg-muted-foreground/40",
  review: "bg-chart-2",
  approved: "bg-primary",
} as const;

export function PrototypeShell({ slug }: { slug?: string }) {
  const { withParams } = usePlaygroundParams();
  const active = findPrototype(slug);

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3.5">
          <BrandLogo height={26} plate />
          <span className="bg-border h-[22px] w-px" aria-hidden />
          <div>
            <h1 className="text-sm leading-tight font-semibold tracking-[-.01em]">
              {APP_NAME} Prototypes
            </h1>
            <span className="text-muted-foreground text-xs">
              Mobile CRM screens for review
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/styleguide" />}
          >
            <Palette className="size-4" />
            Styleguide
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-4" />
            Back to app
          </Button>
        </div>
      </header>

      <div className="flex flex-1 gap-6 p-6">
        <aside className="border-border bg-background flex w-60 shrink-0 flex-col gap-4 self-start rounded-2xl border p-4 shadow-xs">
          <Link
            href={withParams("/prototypes")}
            aria-current={active ? undefined : "page"}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              active
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "bg-primary text-primary-foreground font-semibold shadow-xs",
            )}
          >
            <LayoutGrid className="size-4 shrink-0" aria-hidden />
            All prototypes
          </Link>

          {PROTOTYPE_STATUSES.map((group) => {
            const entries = PROTOTYPES.filter((p) => p.status === group.id);
            if (entries.length === 0) return null;
            return (
              <nav key={group.id} aria-label={group.label}>
                <p className="text-muted-foreground mb-1 flex items-center justify-between px-3 text-[0.65rem] font-semibold tracking-wide uppercase">
                  {group.label}
                  <span className="tabular-nums">{entries.length}</span>
                </p>
                <ul className="flex flex-col gap-1">
                  {entries.map((p) => {
                    const isActive = p.slug === active?.slug;
                    return (
                      <li key={p.slug}>
                        <Link
                          href={withParams(`/prototypes/${p.slug}`)}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              isActive
                                ? "bg-primary-foreground"
                                : STATUS_DOT[p.status],
                            )}
                          />
                          {p.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })}
        </aside>

        <main className="border-border bg-background min-h-[600px] flex-1 rounded-2xl border p-6 shadow-xs">
          {active ? <PrototypeStage prototype={active} /> : <PrototypeIndex />}
        </main>
      </div>
    </div>
  );
}
