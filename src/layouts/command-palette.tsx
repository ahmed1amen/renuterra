"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "cn";
import { CornerDownLeft, type LucideIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { APP_NAVS, PLATFORM_NAV } from "./nav";

type Command = {
  id: string;
  label: string;
  /** Where the page lives, shown as the subtitle and used for matching. */
  section: string;
  href: string;
  icon: LucideIcon;
};

/** Every nav destination across the platform and its apps, flattened once. */
const COMMANDS: Command[] = [PLATFORM_NAV, ...APP_NAVS].flatMap((nav) =>
  nav.groups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.href,
      label: item.label,
      section: [nav.label ?? "Platform", group.label]
        .filter(Boolean)
        .join(" · "),
      href: item.href,
      icon: item.icon,
    })),
  ),
);

function matches(command: Command, query: string) {
  const haystack = `${command.label} ${command.section}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/**
 * ⌘K / Ctrl+K jump-to-page palette. Prototype scope: navigation only —
 * records search can plug in as another command source later.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(
    () => (query.trim() ? COMMANDS.filter((c) => matches(c, query)) : COMMANDS),
    [query],
  );

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setActive(0);
    }
  };

  const run = (command: Command | undefined) => {
    if (!command) return;
    setOpen(false);
    router.push(command.href);
  };

  const move = (delta: number) => {
    if (!results.length) return;
    const next = (active + delta + results.length) % results.length;
    setActive(next);
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={changeOpen}>
      <DialogPrimitive.Trigger
        className="group flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none"
        aria-label="Search pages"
      >
        <SearchIcon className="size-4 shrink-0" aria-hidden />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 duration-150 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup
          aria-label="Command palette"
          className="fixed top-[18vh] left-1/2 z-50 flex max-h-[60vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex items-center gap-3 border-b border-border px-5">
            <SearchIcon
              className="size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              // biome-ignore lint/a11y/noAutofocus: the palette exists to be typed into.
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  move(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  move(-1);
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  run(results[active]);
                }
              }}
              placeholder="Jump to a page…"
              aria-label="Search pages"
              aria-activedescendant={
                results[active] ? `cmd-${active}` : undefined
              }
              aria-controls="command-results"
              role="combobox"
              aria-expanded
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div
            ref={listRef}
            id="command-results"
            role="listbox"
            className="overflow-y-auto p-2"
          >
            {results.length ? (
              results.map((command, index) => {
                const Icon = command.icon;
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: keys are handled by the input via aria-activedescendant.
                  <div
                    key={command.id}
                    id={`cmd-${index}`}
                    data-index={index}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(command)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5",
                      index === active && "bg-muted",
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {command.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {command.section}
                      </span>
                    </span>
                    {index === active ? (
                      <CornerDownLeft
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No pages match “{query}”
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
            <span>
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> to navigate
            </span>
            <span>
              <Kbd>↵</Kbd> to open
            </span>
            <span>
              <Kbd>esc</Kbd> to close
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-sans text-[11px] font-medium shadow-xs">
      {children}
    </kbd>
  );
}
