"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import { findSection, STYLEGUIDE_SECTIONS } from "./sections";

export default function Styleguide({ section }: { section?: string }) {
  const [search, setSearch] = useState("");

  const activeSection = findSection(section);
  const ActiveComponent = activeSection.component;

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return STYLEGUIDE_SECTIONS;
    return STYLEGUIDE_SECTIONS.filter((s) =>
      s.label.toLowerCase().includes(term),
    );
  }, [search]);

  return (
    <div className="bg-muted/40 flex min-h-screen flex-col">
      <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-base leading-tight font-bold">
            {APP_NAME} Styleguide
          </h1>
          <span className="text-muted-foreground text-xs">
            Design tokens &amp; components
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
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
        <aside className="border-border bg-background flex w-60 shrink-0 flex-col gap-3 self-start rounded-2xl border p-4 shadow-xs">
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components…"
              aria-label="Search components"
              className="h-8 ps-8 text-xs"
            />
          </div>

          <nav className="flex flex-col gap-1">
            {filteredSections.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeSection.id;
              return (
                <Link
                  key={item.id}
                  href={`/styleguide/${item.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {filteredSections.length === 0 ? (
              <p className="text-muted-foreground px-3 py-2 text-xs">
                No matching sections.
              </p>
            ) : null}
          </nav>
        </aside>

        <main className="border-border bg-background min-h-[600px] flex-1 rounded-2xl border p-8 shadow-xs">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
