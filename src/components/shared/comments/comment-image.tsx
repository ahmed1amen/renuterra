"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import {
  type ClipboardEvent,
  type DragEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { fileToStoredImage, imageFromDataTransfer } from "@/features/comments";
import { cn } from "@/lib/utils";

/**
 * Draft-attachment state for a comment composer: one optional image, held as a
 * base64 data URL until the comment is submitted.
 */
export function useImageAttachment() {
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const attach = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      setImage(await fileToStoredImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not attach that image");
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  /** Wire onto the composer's textarea so screenshots can be pasted in. */
  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const file = imageFromDataTransfer(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      void attach(file);
    },
    [attach],
  );

  return { image, error, busy, attach, reset, onPaste };
}

type Attachment = ReturnType<typeof useImageAttachment>;

/**
 * Drop / click / paste target for the one image a comment can carry. Once an
 * image is attached it becomes its own preview, and dropping again replaces it.
 */
export function ImageDropzone({
  attachment,
  compact = false,
}: {
  attachment: Attachment;
  /** Tighter single-line variant for the reply box inside a thread. */
  compact?: boolean;
}) {
  const { image, error, busy, attach, reset } = attachment;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // dragenter/leave fire for every child, so count depth instead of toggling.
  const depth = useRef(0);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    const file = imageFromDataTransfer(e.dataTransfer);
    if (file) void attach(file);
  };

  const dragProps = {
    onDragEnter: (e: DragEvent) => {
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (e: DragEvent) => e.preventDefault(),
    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) setDragging(false);
    },
    onDrop,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void attach(file);
          e.target.value = "";
        }}
      />

      {image ? (
        <div
          {...dragProps}
          className={cn(
            "border-border relative w-fit overflow-hidden rounded-lg border transition-colors",
            dragging && "border-primary ring-primary/40 ring-2",
          )}
        >
          {/* biome-ignore lint/performance/noImgElement: base64 data URL, not a
              remote asset next/image can optimise. */}
          <img
            src={image}
            alt="Attachment preview"
            className={cn("object-cover", compact ? "max-h-20" : "max-h-28")}
          />
          <Button
            size="icon-sm"
            variant="secondary"
            type="button"
            aria-label="Remove image"
            className="absolute top-1 right-1 size-5 shadow-sm"
            onClick={reset}
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          {...dragProps}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-border text-muted-foreground hover:border-primary/60 hover:bg-muted/50 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors",
            compact ? "px-2 py-1.5 text-[11px]" : "px-3 py-3 text-xs",
            dragging && "border-primary bg-primary/5 text-foreground",
            busy && "opacity-60",
          )}
        >
          {busy ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <ImagePlus className="size-3.5" />
              {dragging
                ? "Drop to attach"
                : compact
                  ? "Drop, paste or browse"
                  : "Drop an image, paste, or click to browse"}
            </>
          )}
        </button>
      )}

      {error ? <p className="text-destructive text-[11px]">{error}</p> : null}
    </div>
  );
}

/** A stored attachment inside a posted comment; click opens it full size. */
export function CommentImage({
  image,
  className,
}: {
  image: string;
  className?: string;
}) {
  return (
    <a
      href={image}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "border-border mt-1.5 block w-fit overflow-hidden rounded-lg border",
        className,
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: base64 data URL, not a
          remote asset next/image can optimise. */}
      <img src={image} alt="Comment attachment" className="max-h-40" />
    </a>
  );
}
