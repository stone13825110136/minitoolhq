export type OutputFormat = "jpg" | "png" | "webp";

export const INPUT_ACCEPT =
  ".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";

const HEIC_RE = /\.(heic|heif)$/i;

export function isHeicLike(file: File): boolean {
  return HEIC_RE.test(file.name) || /heic|heif/i.test(file.type);
}

export function isSupportedInput(file: File): boolean {
  if (isHeicLike(file)) return false;
  const t = (file.type || "").toLowerCase();
  if (t === "image/png" || t === "image/jpeg" || t === "image/webp") return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

export function mimeFor(format: OutputFormat): string {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}

export function extFor(format: OutputFormat): string {
  return format === "jpg" ? ".jpg" : `.${format}`;
}

export function outputName(inputName: string, format: OutputFormat): string {
  return inputName.replace(/\.(png|jpe?g|webp)$/i, "") + extFor(format);
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };
    img.src = url;
  });
}

export type ConvertOptions = {
  format: OutputFormat;
  /** 0–1 for JPG/WebP; ignored for PNG */
  quality: number;
  /** Fill behind transparent pixels when encoding JPG */
  fillHex: string;
};

export async function convertImageFile(
  file: File,
  opts: ConvertOptions,
): Promise<Blob> {
  const img = await loadImageFromBlob(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("Invalid image dimensions");

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  if (opts.format === "jpg") {
    const { r, g, b } = parseHexColor(opts.fillHex);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.drawImage(img, 0, 0);

  const mime = mimeFor(opts.format);
  const quality =
    opts.format === "png"
      ? undefined
      : Math.min(1, Math.max(0.5, opts.quality));

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`${opts.format.toUpperCase()} encode failed`))),
      mime,
      quality,
    );
  });
}
