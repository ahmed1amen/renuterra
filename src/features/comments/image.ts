/** Longest edge of a stored screenshot, in px. */
const MAX_EDGE = 1400;
/** JPEG quality for the re-encode. */
const QUALITY = 0.72;
/** Refuse anything that would still bloat the row after compression. */
export const MAX_IMAGE_BYTES = 1_500_000;

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });

/**
 * Turn a pasted or picked image file into a base64 data URL small enough to
 * live in a `page_comments` row: downscaled to `MAX_EDGE` and re-encoded as
 * JPEG. Throws if the result is still too big to store.
 */
export async function fileToStoredImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only images can be attached");
  }

  const original = await readAsDataUrl(file);
  const img = await loadImage(original);

  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  // JPEG has no alpha; paint white so transparent screenshots don't go black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const encoded = canvas.toDataURL("image/jpeg", QUALITY);
  const result = encoded.length < original.length ? encoded : original;

  if (result.length > MAX_IMAGE_BYTES) {
    throw new Error("That image is too large — try a smaller crop");
  }
  return result;
}

/** First image file on a paste/drop event, if any. */
export function imageFromDataTransfer(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const item of Array.from(data.files)) {
    if (item.type.startsWith("image/")) return item;
  }
  return null;
}
