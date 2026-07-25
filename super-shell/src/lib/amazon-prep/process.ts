import { readExifSummary } from "./exif";
import { heicToJpegBlob, isHeicFile } from "./heic";
import type { ProcessFileResult, ProcessOptions } from "./types";

const DEFAULT_UPSCALE_MIN = 1600;

export async function processImageFile(
  file: File,
  options: ProcessOptions,
): Promise<ProcessFileResult> {
  const exif = await readExifSummary(file);
  const sourceBlob = isHeicFile(file) ? await heicToJpegBlob(file) : file;
  const bitmap = await createImageBitmap(sourceBlob);

  try {
    const { canvas, width, height } = drawToCanvas(bitmap, options);
    const blob = await encodeUnderMaxBytes(canvas, options.maxBytes);
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const safe = base.replace(/[^\w.-]+/g, "_").slice(0, 80);
    const prefix = (options.filenamePrefix ?? "amazon").replace(/-+$/g, "");
    const outputName = `${prefix}-${safe}.jpg`;

    return {
      blob,
      outputName,
      row: {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        outputName,
        camera: exif.camera,
        gps: exif.gps,
        dateTaken: exif.dateTaken,
        otherFields: exif.otherFields,
        inputBytes: file.size,
        outputBytes: blob.size,
        width,
        height,
      },
    };
  } finally {
    bitmap.close();
  }
}

function drawToCanvas(
  bitmap: ImageBitmap,
  options: ProcessOptions,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const { targetPx, resizeMode, whiteBackground, upscaleBelowZoom, upscaleMinPx } = options;
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  const longest = Math.max(srcW, srcH);

  const scaled = scaleDimensions(srcW, srcH, longest, {
    targetPx,
    resizeMode,
    upscaleBelowZoom,
    upscaleMinPx: upscaleMinPx ?? DEFAULT_UPSCALE_MIN,
    forceContainInSquare: resizeMode === "square" || whiteBackground,
  });

  if (resizeMode === "square" || whiteBackground) {
    const out = targetPx;
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = mustCtx(canvas);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out, out);

    let w = scaled.w;
    let h = scaled.h;
    if (Math.max(w, h) > out) {
      const down = out / Math.max(w, h);
      w = Math.max(1, Math.round(w * down));
      h = Math.max(1, Math.round(h * down));
    }

    const x = Math.round((out - w) / 2);
    const y = Math.round((out - h) / 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, x, y, w, h);
    if (whiteBackground) flattenNearWhite(ctx, out, out);
    return { canvas, width: out, height: out };
  }

  const canvas = document.createElement("canvas");
  canvas.width = scaled.w;
  canvas.height = scaled.h;
  const ctx = mustCtx(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, scaled.w, scaled.h);
  return { canvas, width: scaled.w, height: scaled.h };
}

function scaleDimensions(
  srcW: number,
  srcH: number,
  longest: number,
  opts: {
    targetPx: number;
    resizeMode: ProcessOptions["resizeMode"];
    upscaleBelowZoom: boolean;
    upscaleMinPx: number;
    forceContainInSquare: boolean;
  },
): { w: number; h: number } {
  const { targetPx, upscaleBelowZoom, upscaleMinPx } = opts;
  let scale = 1;

  if (longest > targetPx) {
    scale = targetPx / longest;
  } else if (upscaleBelowZoom && longest < upscaleMinPx) {
    scale = Math.min(targetPx, upscaleMinPx) / longest;
  } else if (!opts.forceContainInSquare && longest !== targetPx) {
    // longest mode without white pad: leave in sweet spot untouched
    scale = 1;
  }

  return {
    w: Math.max(1, Math.round(srcW * scale)),
    h: Math.max(1, Math.round(srcH * scale)),
  };
}

function mustCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported in this browser");
  return ctx;
}

/** Push near-white studio pixels to pure RGB 255 (not AI matting). */
function flattenNearWhite(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const threshold = 245;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] >= threshold && d[i + 1] >= threshold && d[i + 2] >= threshold) {
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

async function encodeUnderMaxBytes(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  let lo = 0.5;
  let hi = 0.95;
  let best: Blob | null = null;

  for (let i = 0; i < 14; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToJpeg(canvas, q);
    if (blob.size <= maxBytes) {
      best = blob;
      lo = q;
    } else {
      hi = q;
    }
  }

  return best ?? canvasToJpeg(canvas, 0.45);
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("JPEG encode failed"));
      },
      "image/jpeg",
      quality,
    );
  });
}
