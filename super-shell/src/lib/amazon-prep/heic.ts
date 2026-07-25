const HEIC_RE = /\.(heic|heif)$/i;

export function isHeicFile(file: File): boolean {
  if (HEIC_RE.test(file.name)) return true;
  const t = file.type.toLowerCase();
  return t === "image/heic" || t === "image/heif";
}

/** Decode HEIC to a browser-friendly Blob (JPEG) via heic-to (lazy). */
export async function heicToJpegBlob(file: File): Promise<Blob> {
  const { heicTo } = await import("heic-to");
  const result = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.95,
  });
  if (result instanceof Blob) return result;
  throw new Error("HEIC conversion failed");
}
