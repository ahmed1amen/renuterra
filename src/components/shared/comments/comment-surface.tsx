"use client";

import { MessagesSquare, SquarePen } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  commentsEnabled,
  groupThreads,
  percentToCss,
  pointToPercent,
  useAddComment,
  useComments,
  useDeleteComment,
  useDisplayName,
  useRealtimeComments,
  useUpdateComment,
} from "@/features/comments";
import { cn } from "@/lib/utils";
import { ImageDropzone, useImageAttachment } from "./comment-image";
import { CommentPanel } from "./comment-panel";
import { CommentPin } from "./comment-pin";
import { NameDialog } from "./name-dialog";

type Draft = { x: number; y: number; body: string };

/**
 * Wraps page content with the PM review layer: a comment-mode toggle (button
 * or `c`) that lets reviewers pin threads anywhere on the page. Renders
 * children untouched when Supabase env vars are absent. Reads search params,
 * so it provides its own Suspense boundary.
 */
export function CommentSurface({ children }: { children: ReactNode }) {
  if (!commentsEnabled()) return <>{children}</>;
  return (
    <Suspense fallback={children}>
      <EnabledSurface>{children}</EnabledSurface>
    </Suspense>
  );
}

function EnabledSurface({ children }: { children: ReactNode }) {
  const page = usePathname();
  const searchParams = useSearchParams();

  const { data, isSuccess } = useComments(page);
  useRealtimeComments(page);
  const addComment = useAddComment(page);
  const updateComment = useUpdateComment(page);
  const deleteComment = useDeleteComment(page);
  const { name, setName } = useDisplayName();

  const [commentMode, setCommentMode] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const attachment = useImageAttachment();
  const resetAttachment = attachment.reset;

  const comments = data ?? [];
  const threads = groupThreads(comments);
  const openCount = threads.filter((t) => !t.root.resolved).length;

  // Keyboard: `c` toggles comment mode unless focus is in a form field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "c" || e.key === "C") setCommentMode((m) => !m);
      if (e.key === "Escape") {
        setCommentMode(false);
        setDraft(null);
        resetAttachment();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetAttachment]);

  // A miss when dropping a screenshot would otherwise make the browser
  // navigate to the file and lose the draft. The dropzone's own handler runs
  // first (target phase), so this only swallows the misses.
  const composerOpen = draft !== null || openThreadId !== null;
  useEffect(() => {
    if (!composerOpen) return;
    const swallow = (e: Event) => e.preventDefault();
    window.addEventListener("dragover", swallow);
    window.addEventListener("drop", swallow);
    return () => {
      window.removeEventListener("dragover", swallow);
      window.removeEventListener("drop", swallow);
    };
  }, [composerOpen]);

  // Deep link: ?comment=<id> opens the thread and scrolls its pin into view.
  const consumedDeepLink = useRef(false);
  const commentParam = searchParams.get("comment");
  useEffect(() => {
    if (!commentParam || !isSuccess || consumedDeepLink.current) return;
    const target = comments.find((c) => c.id === commentParam);
    if (!target) return;
    consumedDeepLink.current = true;
    const rootId = target.parentId ?? target.id;
    setShowPanel(true);
    setOpenThreadId(rootId);
    setTimeout(() => {
      document
        .getElementById(`comment-pin-${rootId}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 200);
  }, [commentParam, isSuccess, comments]);

  const placeDraft = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { x, y } = pointToPercent(e.clientX, e.clientY, rect);
    setDraft({ x, y, body: "" });
    setOpenThreadId(null);
  };

  const submitDraft = (author: string) => {
    if (!draft || !draft.body.trim()) return;
    addComment.mutate({
      page,
      x: draft.x,
      y: draft.y,
      author,
      body: draft.body.trim(),
      image: attachment.image,
    });
    setDraft(null);
    attachment.reset();
    setCommentMode(false);
  };

  const trySubmitDraft = () => {
    if (name) submitDraft(name);
    else setNameDialogOpen(true);
  };

  const selectThread = (id: string) => {
    setOpenThreadId(id);
    document
      .getElementById(`comment-pin-${id}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className="relative flex min-h-full flex-col">
      {children}

      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-only
          click-capture surface for pin placement; the accessible path is the
          floating Comment button and the pins themselves are buttons. */}
      <div
        data-testid="comment-layer"
        role="presentation"
        className={cn(
          "absolute inset-0 z-30",
          commentMode ? "cursor-crosshair" : "pointer-events-none",
        )}
        onClick={commentMode ? placeDraft : undefined}
      >
        {/* Resolved threads stay out of the page; the panel still lists them
            (numbering follows the full thread list so pins and panel match). */}
        {threads.map((thread, i) =>
          thread.root.resolved ? null : (
            <CommentPin
              key={thread.root.id}
              thread={thread}
              index={i + 1}
              open={openThreadId === thread.root.id}
              onOpenChange={(open) =>
                setOpenThreadId(open ? thread.root.id : null)
              }
              currentUser={name}
              onReply={(body, image) => {
                if (!name) {
                  setNameDialogOpen(true);
                  return;
                }
                addComment.mutate({
                  page,
                  x: thread.root.x,
                  y: thread.root.y,
                  author: name,
                  body,
                  image,
                  parentId: thread.root.id,
                });
              }}
              onToggleResolved={() =>
                updateComment.mutate({
                  id: thread.root.id,
                  patch: { resolved: !thread.root.resolved },
                })
              }
              onDelete={() => {
                setOpenThreadId(null);
                deleteComment.mutate(thread.root.id);
              }}
            />
          ),
        )}

        {draft ? (
          <Popover
            open
            onOpenChange={(open) => {
              if (!open) {
                setDraft(null);
                attachment.reset();
              }
            }}
          >
            <PopoverTrigger
              render={
                <button
                  type="button"
                  data-comment-pin
                  aria-label="New comment pin"
                  style={percentToCss(draft.x, draft.y)}
                  className="border-background bg-primary text-primary-foreground pointer-events-auto absolute z-40 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow-md"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              +
            </PopoverTrigger>
            <PopoverContent side="left" align="start" sideOffset={10}>
              <Textarea
                value={draft.body}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, body: e.target.value } : d))
                }
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || e.shiftKey) return;
                  if (e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  trySubmitDraft();
                }}
                onPaste={attachment.onPaste}
                placeholder="Leave a comment…  ⏎ to send, ⇧⏎ for a new line"
                aria-label="New comment"
                autoFocus
                className="min-h-20 text-sm"
              />
              <ImageDropzone attachment={attachment} />
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(null);
                    attachment.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!draft.body.trim()}
                  onClick={trySubmitDraft}
                >
                  Comment
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {/* Floating review controls */}
      <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2">
        <Button
          size="sm"
          variant={commentMode ? "default" : "outline"}
          aria-pressed={commentMode}
          onClick={() => setCommentMode((m) => !m)}
          title="Toggle comment mode (c)"
          data-testid="comment-mode-toggle"
          className="shadow-md"
        >
          <SquarePen className="size-3.5" />
          {commentMode ? "Click anywhere to comment" : "Comment"}
          <kbd
            className={cn(
              "rounded border px-1 font-mono text-[10px]",
              commentMode
                ? "border-primary-foreground/40"
                : "border-border text-muted-foreground",
            )}
          >
            C
          </kbd>
        </Button>
        <Button
          size="sm"
          variant={showPanel ? "secondary" : "outline"}
          aria-pressed={showPanel}
          onClick={() => setShowPanel((s) => !s)}
          data-testid="comment-panel-toggle"
          className="shadow-md"
        >
          <MessagesSquare className="size-3.5" />
          Comments
          {openCount > 0 ? (
            <Badge variant="default" className="h-4 min-w-4 px-1 text-[10px]">
              {openCount}
            </Badge>
          ) : null}
        </Button>
      </div>

      {showPanel ? (
        <CommentPanel
          threads={threads}
          openThreadId={openThreadId}
          onSelect={selectThread}
          onReopen={(id) =>
            updateComment.mutate({ id, patch: { resolved: false } })
          }
          onClose={() => setShowPanel(false)}
        />
      ) : null}

      <NameDialog
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        onSubmit={(newName) => {
          setName(newName);
          submitDraft(newName);
        }}
      />
    </div>
  );
}
