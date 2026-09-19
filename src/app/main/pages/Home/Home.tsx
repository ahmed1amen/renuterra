"use client";

import { Pin, Search, SearchX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { STORAGE_KEYS } from "@/constants";
import { useLocalStorage } from "@/hooks";
import { USERS } from "@/mocks";
import { APP_CATEGORIES } from "./apps";
import { AppCard } from "./components/app-card";

const CURRENT_USER = USERS[0];

function greetingFor(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useLocalStorage<string[]>(
    STORAGE_KEYS.pinnedApps,
    [],
  );
  const searchRef = useRef<HTMLInputElement>(null);

  // Time-based greeting is set after mount so the static prerender never
  // mismatches the client clock.
  const [greeting, setGreeting] = useState("Welcome back");
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  // `/` focuses search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        e.key !== "/" ||
        e.metaKey ||
        e.ctrlKey ||
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable))
      ) {
        return;
      }
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const togglePin = (id: string) =>
    setPinnedIds(
      pinnedIds.includes(id)
        ? pinnedIds.filter((p) => p !== id)
        : [...pinnedIds, id],
    );

  const term = query.trim().toLowerCase();
  const matches = (name: string) => !term || name.toLowerCase().includes(term);

  const pinnedApps = pinnedIds
    .map((id) => {
      const category = APP_CATEGORIES.find((c) =>
        c.apps.some((a) => a.id === id),
      );
      const app = category?.apps.find((a) => a.id === id);
      return app && category ? { app, tone: category.tone } : undefined;
    })
    .filter((entry) => entry !== undefined)
    .filter((entry) => matches(entry.app.name));

  const visibleCategories = APP_CATEGORIES.map((category) => ({
    ...category,
    apps: category.apps.filter((a) => matches(a.name)),
  })).filter((category) => category.apps.length > 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}, {CURRENT_USER.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            Here are your applications.
          </p>
        </div>
        <span className="relative flex w-full sm:w-72">
          <Search
            className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
            aria-label="Search apps"
            className="h-9 ps-9 pe-8"
          />
          <kbd className="border-border text-muted-foreground pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 rounded border px-1.5 font-mono text-[10px]">
            /
          </kbd>
        </span>
      </header>

      {pinnedApps.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Pin className="size-3 -rotate-45" aria-hidden />
            Pinned
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {pinnedApps.map(({ app, tone }) => (
              <li key={app.id}>
                <AppCard
                  app={app}
                  tone={tone}
                  pinned
                  onTogglePin={() => togglePin(app.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visibleCategories.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No apps match"
          description={`Nothing named "${query.trim()}". Try a different search.`}
        />
      ) : (
        <div className="gap-x-10 space-y-8 lg:columns-2">
          {visibleCategories.map((category) => (
            <section
              key={category.id}
              className="mb-8 break-inside-avoid space-y-3 last:mb-0"
            >
              <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {category.label}
              </h2>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {category.apps.map((app) => (
                  <li key={app.id}>
                    <AppCard
                      app={app}
                      tone={category.tone}
                      pinned={pinnedIds.includes(app.id)}
                      onTogglePin={() => togglePin(app.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
