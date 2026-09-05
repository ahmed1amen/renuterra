"use client";

import { MessageSquare, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type CommentThread,
  filterThreads,
  initialsOf,
  relativeTime,
  type ThreadFilter,
} from "@/features/comments";
import { cn } from "@/lib/utils";

const FILTERS: { id: ThreadFilter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

/** Floating panel listing every thread on the current page. */
export function CommentPanel({
  threads,
  openThreadId,
  onSelect,
  onReopen,
  onClose,
}: {
  threads: CommentThread[];
  openThreadId: string | null;
  onSelect: (id: string) => void;
  /** Resolved pins are hidden on the page, so reopening happens here. */
  onReopen: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<ThreadFilter>("open");
  const visible = filterThreads(threads, filter);

  return (
    <aside
      aria-label="Comments"
      className="border-border bg-background fixed top-20 right-4 bottom-20 z-50 flex w-80 flex-col gap-3 overflow-hidden rounded-2xl border p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Comments</h3>
        <div className="flex items-center gap-1">
          <div className="border-border bg-muted/40 flex items-center gap-0.5 rounded-lg border p-0.5">
            {FILTERS.map((f) => (
              <Button
                key={f.id}
                size="sm"
                variant={filter === f.id ? "secondary" : "ghost"}
                aria-pressed={filter === f.id}
                className="h-6 px-2 text-xs"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Close comments"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={filter === "open" ? "No open comments" : "Nothing here"}
          description="Press C or use the comment button, then click anywhere on the page to pin feedback."
        />
      ) : (
        <ul className="-mx-2 flex flex-col gap-1 overflow-y-auto px-2">
          {visible.map((thread) => {
            const index = threads.indexOf(thread) + 1;
            const active = openThreadId === thread.root.id;
            return (
              <li key={thread.root.id}>
                {/* The select button stretches over the row via ::after so the
                    Reopen button can sit beside it without nesting buttons. */}
                <div
                  className={cn(
                    "hover:bg-muted relative flex flex-col gap-1 rounded-lg p-2.5 transition-colors",
                    active && "bg-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(thread.root.id)}
                    className="flex w-full items-center gap-2 text-left after:absolute after:inset-0 after:rounded-lg"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        thread.root.resolved
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {index}
                    </span>
                    <span className="truncate text-xs font-semibold">
                      {thread.root.author}
                    </span>
                    <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">
                      {relativeTime(thread.root.createdAt)}
                    </span>
                  </button>
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {thread.root.body}
                  </span>
                  <span className="flex items-center gap-2">
                    {thread.root.resolved ? (
                      <>
                        <Badge variant="success" className="h-4 text-[10px]">
                          Resolved
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="relative z-10 h-5 px-1.5 text-[11px]"
                          onClick={() => onReopen(thread.root.id)}
                        >
                          <RotateCcw className="size-3" />
                          Reopen
                        </Button>
                      </>
                    ) : null}
                    {thread.replies.length > 0 ? (
                      <span className="text-muted-foreground text-[11px]">
                        {thread.replies.length}{" "}
                        {thread.replies.length === 1 ? "reply" : "replies"}
                      </span>
                    ) : null}
                    <span className="bg-info-bg text-info ml-auto flex size-4 items-center justify-center rounded-full text-[9px] font-semibold">
                      {initialsOf(thread.root.author)}
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
