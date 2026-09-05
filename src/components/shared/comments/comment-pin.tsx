"use client";

import { Check, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  type CommentThread,
  initialsOf,
  type PageComment,
  percentToCss,
  relativeTime,
} from "@/features/comments";
import { cn } from "@/lib/utils";

/**
 * A numbered pin anchored at the thread's stored percentage position, with the
 * whole thread in a popover. Interactive in and out of comment mode.
 */
export function CommentPin({
  thread,
  index,
  open,
  onOpenChange,
  currentUser,
  onReply,
  onToggleResolved,
  onDelete,
}: {
  thread: CommentThread;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: string;
  onReply: (body: string) => void;
  onToggleResolved: () => void;
  onDelete: () => void;
}) {
  const { root } = thread;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            id={`comment-pin-${root.id}`}
            data-comment-pin
            aria-label={`Comment ${index} by ${root.author}`}
            style={percentToCss(root.x, root.y)}
            className={cn(
              "pointer-events-auto absolute z-40 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow-md transition-transform hover:scale-110",
              root.resolved
                ? "border-background bg-muted text-muted-foreground"
                : "border-background bg-primary text-primary-foreground",
              open && "scale-110 ring-3 ring-ring/50",
            )}
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        {index}
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={10}
        className="w-80 p-0"
      >
        <ThreadView
          thread={thread}
          currentUser={currentUser}
          onReply={onReply}
          onToggleResolved={onToggleResolved}
          onDelete={onDelete}
        />
      </PopoverContent>
    </Popover>
  );
}

function CommentRow({
  comment,
  isReply = false,
}: {
  comment: PageComment;
  isReply?: boolean;
}) {
  return (
    <div className={cn("flex gap-2.5", isReply && "ps-3")}>
      <span className="bg-info-bg text-info flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {initialsOf(comment.author)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 text-xs">
          <span className="truncate font-semibold">{comment.author}</span>
          <span className="text-muted-foreground shrink-0">
            {relativeTime(comment.createdAt)}
          </span>
        </p>
        <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>
    </div>
  );
}

export function ThreadView({
  thread,
  currentUser,
  onReply,
  onToggleResolved,
  onDelete,
}: {
  thread: CommentThread;
  currentUser: string;
  onReply: (body: string) => void;
  onToggleResolved: () => void;
  onDelete: () => void;
}) {
  const { root, replies } = thread;
  const [reply, setReply] = useState("");
  const canDelete = currentUser !== "" && currentUser === root.author;

  const submitReply = () => {
    const body = reply.trim();
    if (!body) return;
    onReply(body);
    setReply("");
  };

  return (
    <div className="flex flex-col">
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-3">
        <CommentRow comment={root} />
        {replies.map((r) => (
          <CommentRow key={r.id} comment={r} isReply />
        ))}
      </div>

      <div className="border-border flex flex-col gap-2 border-t p-3">
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitReply();
          }}
          placeholder="Reply…"
          aria-label="Reply"
          className="min-h-16 text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleResolved}
              aria-label={root.resolved ? "Reopen" : "Resolve"}
            >
              {root.resolved ? (
                <>
                  <RotateCcw className="size-3.5" /> Reopen
                </>
              ) : (
                <>
                  <Check className="size-3.5" /> Resolve
                </>
              )}
            </Button>
            {canDelete ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Delete thread"
                className="text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <Button size="sm" disabled={!reply.trim()} onClick={submitReply}>
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
