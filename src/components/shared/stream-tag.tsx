import { cn } from "@/lib/utils";

/** Waste streams the business handles. Colour is fixed per stream, everywhere. */
export type WasteStream =
  | "recyclable"
  | "food"
  | "medical"
  | "hazardous"
  | "cd"
  | "general";

export const WASTE_STREAMS: {
  id: WasteStream;
  label: string;
  token: string;
  swatchClass: string;
}[] = [
  {
    id: "recyclable",
    label: "Recyclable",
    token: "--stream-recyclable",
    swatchClass: "bg-stream-recyclable",
  },
  {
    id: "food",
    label: "Food waste",
    token: "--stream-food",
    swatchClass: "bg-stream-food",
  },
  {
    id: "medical",
    label: "Medical",
    token: "--stream-medical",
    swatchClass: "bg-stream-medical",
  },
  {
    id: "hazardous",
    label: "Hazardous",
    token: "--stream-hazardous",
    swatchClass: "bg-stream-hazardous",
  },
  {
    id: "cd",
    label: "Construction & demolition",
    token: "--stream-cd",
    swatchClass: "bg-stream-cd",
  },
  {
    id: "general",
    label: "General",
    token: "--stream-general",
    swatchClass: "bg-stream-general",
  },
];

export function findStream(id: WasteStream) {
  return WASTE_STREAMS.find((s) => s.id === id) ?? WASTE_STREAMS[5];
}

/** Square swatch in the stream colour. */
export function StreamSwatch({
  stream,
  className,
}: {
  stream: WasteStream;
  className?: string;
}) {
  const s = findStream(stream);
  return (
    <span
      title={s.label}
      className={cn(
        "inline-block size-2 shrink-0 rounded-[2px]",
        s.swatchClass,
        className,
      )}
    />
  );
}

/** Outline tag with the stream swatch — never a fill. */
export function StreamTag({
  stream,
  className,
}: {
  stream: WasteStream;
  className?: string;
}) {
  const s = findStream(stream);
  return (
    <span
      className={cn(
        "border-border text-foreground inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <StreamSwatch stream={stream} />
      {s.label}
    </span>
  );
}
