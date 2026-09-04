"use client";

import { ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";
import { BrandLogo, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  findSection,
  STYLEGUIDE_GROUPS,
  STYLEGUIDE_SECTIONS,
} from "./sections";

export default function Styleguide({ section }: { section?: string }) {
  const activeSection = findSection(section);
  const ActiveComponent = activeSection.component;

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-border bg-background/85 sticky top-0 z-50 flex h-[60px] shrink-0 items-center justify-between gap-4 border-b px-7 backdrop-blur-[10px]">
        <div className="flex items-center gap-3.5">
          <BrandLogo height={26} plate />
          <span className="bg-border h-[22px] w-px" aria-hidden />
          <h1 className="text-sm font-semibold tracking-[-.01em]">
            CRM Style Guide
          </h1>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-mono text-[11px]">
            v1.0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/prototypes" />}
          >
            <Smartphone className="size-4" />
            Prototypes
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
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-[220px_minmax(0,1fr)]">
        <nav
          aria-label="Sections"
          className="border-border sticky top-[60px] h-[calc(100vh-60px)] overflow-auto border-r py-7 pr-4 pl-7"
        >
          {STYLEGUIDE_GROUPS.map((group) => (
            <div key={group} className="mb-[22px] last:mb-0">
              <div className="text-muted-foreground mb-2 ml-2.5 font-mono text-[10.5px] tracking-[.1em] uppercase">
                {group}
              </div>
              <div className="flex flex-col gap-0.5">
                {STYLEGUIDE_SECTIONS.filter((s) => s.group === group).map(
                  (item) => {
                    const isActive = item.id === activeSection.id;
                    return (
                      <Link
                        key={item.id}
                        href={`/styleguide/${item.id}`}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </nav>

        <main className="min-w-0 px-10 pt-10 pb-24">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
