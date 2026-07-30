export type CompressFormat = "jpg" | "png" | "webp" | "same";

export type CompressMode = "quality" | "target";

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

function detectInputFormat(file: File): "jpg" | "png" | "webp" {
  const t = (file.type || "").toLowerCase();
  if (t === "image/png" || /\.png$/i.test(file.name)) return "png";
  if (t === "image/webp" || /\.webp$/i.test(file.name)) return "webp";
  return "jpg";
}

export function resolveOutputFormat(
  file: File,
  chosen: CompressFormat,
): "jpg" | "png" | "webp" {
  if (chosen === "same") return detectInputFormat(file);
  return chosen;
}

export function mimeFor(format: "jpg" | "png" | "webp"): string {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}

export function extFor(format: "jpg" | "png" | "webp"): string {
  return format === "jpg" ? ".jpg" : `.${format}`;
}

export function outputName(inputName: string, format: "jpg" | "png" | "webp"): string {
  return inputName.replace(/\.(png|jpe?g|webp)$/i, "") + extFor(format);
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

function canvasFromImage(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("Invalid image dimensions");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: "jpg" | "png" | "webp",
  quality: number,
): Promise<Blob> {
  const mime = mimeFor(format);
  const q = format === "png" ? undefined : Math.min(1, Math.max(0.4, quality));

  if (format === "jpg") {
    const filled = document.createElement("canvas");
    filled.width = canvas.width;
    filled.height = canvas.height;
    const ctx = filled.getContext("2d");
    if (!ctx) return Promise.reject(new Error("Canvas unavailable"));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, filled.width, filled.height);
    ctx.drawImage(canvas, 0, 0);
    return new Promise((resolve, reject) => {
      filled.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
        mime,
        q,
      );
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error(`${format.toUpperCase()} encode failed`))),
      mime,
      q,
    );
  });
}

export type CompressOptions = {
  mode: CompressMode;
  /** 0–1 for quality mode / search start */
  quality: number;
  /** Target max bytes for target mode */
  targetBytes?: number;
  format: CompressFormat;
};

export type CompressResult = {
  blob: Blob;
  outName: string;
  format: "jpg" | "png" | "webp";
  inputBytes: number;
  outputBytes: number;
};

async function compressToQuality(
  canvas: HTMLCanvasElement,
  format: "jpg" | "png" | "webp",
  quality: number,
): Promise<Blob> {
  return encodeCanvas(canvas, format, quality);
}

async function compressToTarget(
  canvas: HTMLCanvasElement,
  format: "jpg" | "png" | "webp",
  targetBytes: number,
): Promise<Blob> {
  if (format === "png") {
    // PNG has no useful quality knob on canvas — single encode
    return encodeCanvas(canvas, format, 1);
  }

  let lo = 0.4;
  let hi = 0.95;
  let best = await encodeCanvas(canvas, format, hi);
  if (best.size <= targetBytes) return best;

  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encodeCanvas(canvas, format, mid);
    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid;
    } else {
      hi = mid;
      best = blob;
    }
  }

  // Prefer the smallest that still meets target if we found one under target
  const floor = await encodeCanvas(canvas, format, 0.4);
  if (best.size > targetBytes && floor.size < best.size) return floor;
  return best;
}

export async function compressImageFile(
  file: File,
  opts: CompressOptions,
): Promise<CompressResult> {
  const format = resolveOutputFormat(file, opts.format);
  const img = await loadImageFromBlob(file);
  const canvas = canvasFromImage(img);

  let blob: Blob;
  if (opts.mode === "target" && opts.targetBytes && opts.targetBytes > 0) {
    blob = await compressToTarget(canvas, format, opts.targetBytes);
  } else {
    blob = await compressToQuality(canvas, format, opts.quality);
  }

  // If re-encode grew the file, keep original when same container format
  const sameContainer = resolveOutputFormat(file, "same") === format;
  if (sameContainer && blob.size >= file.size) {
    blob = file;
  }

  return {
    blob,
    outName: outputName(file.name, format),
    format,
    inputBytes: file.size,
    outputBytes: blob.size,
  };
}
