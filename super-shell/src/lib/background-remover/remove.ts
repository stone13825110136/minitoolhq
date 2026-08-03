/**
 * In-browser background removal → white (#FFFFFF) JPG or transparent PNG.
 * Model: onnx-community/ormbg-ONNX (Apache-2.0) via @huggingface/transformers.
 */

export type BgOutputMode = "white-jpg" | "png";

export type ProgressInfo = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

const MODEL_ID = "onnx-community/ormbg-ONNX";
const MAX_EDGE = 2048;

type Cutout = { toCanvas: () => HTMLCanvasElement; toBlob?: () => Promise<Blob> };
/** Single image → RawImage; array → RawImage[] (Transformers.js typing). */
type Segmenter = (input: string | string[]) => Promise<Cutout | Cutout[]>;

let segmenterPromise: Promise<Segmenter> | null = null;

/** Clear cached model loader (e.g. after a failed download so retry can work). */
export function resetSegmenter(): void {
  segmenterPromise = null;
}

function isHeicLike(file: File): boolean {
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".heic") ||
    n.endsWith(".heif") ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

export function isSupportedBgInput(file: File): boolean {
  if (isHeicLike(file)) return false;
  const n = file.name.toLowerCase();
  if (/\.(jpe?g|png|webp)$/i.test(n)) return true;
  return /image\/(jpeg|png|webp)/i.test(file.type);
}

export { isHeicLike };

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

/** Downscale so longest edge ≤ MAX_EDGE (memory / speed). */
export async function prepareInputCanvas(file: File): Promise<HTMLCanvasElement> {
  const bmp = await loadImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(bmp, 0, 0, w, h);
    return c;
  } finally {
    bmp.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

export function compositeWhiteJpg(
  cutout: HTMLCanvasElement,
  quality = 0.92,
): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = cutout.width;
  c.height = cutout.height;
  const ctx = c.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas unavailable"));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(cutout, 0, 0);
  return canvasToBlob(c, "image/jpeg", quality);
}

/** HF Hub first (best for US); China-friendly mirror if Hub fetch fails — no VPN required. */
const MODEL_HOSTS = ["https://huggingface.co/", "https://hf-mirror.com/"] as const;

async function loadPipelineFromHost(
  remoteHost: string,
  onProgress?: (info: ProgressInfo) => void,
): Promise<Segmenter> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.remoteHost = remoteHost;
  env.remotePathTemplate = "{model}/resolve/{revision}/";

  // q8 ≈ 42MB vs fp32 ≈ 168MB — faster first download; still Apache-2.0 ormbg
  const pipe = await (pipeline as Function)("background-removal", MODEL_ID, {
    device: "wasm",
    dtype: "q8",
    progress_callback: (x: ProgressInfo) => onProgress?.(x),
  });
  return pipe as Segmenter;
}

export async function getSegmenter(
  onProgress?: (info: ProgressInfo) => void,
  onStatus?: (msg: string) => void,
): Promise<Segmenter> {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      let lastErr: unknown;
      for (let i = 0; i < MODEL_HOSTS.length; i++) {
        const host = MODEL_HOSTS[i];
        try {
          if (i > 0) {
            onStatus?.("Retrying model download from alternate CDN…");
          }
          return await loadPipelineFromHost(host, onProgress);
        } catch (err) {
          lastErr = err;
        }
      }
      segmenterPromise = null;
      throw lastErr instanceof Error
        ? lastErr
        : new Error("Could not download AI model — check your network and retry");
    })();
  }
  return segmenterPromise;
}

export async function removeBackgroundFile(
  file: File,
  opts: {
    mode: BgOutputMode;
    quality?: number;
    onProgress?: (info: ProgressInfo) => void;
    onStatus?: (msg: string) => void;
  },
): Promise<{ blob: Blob; outName: string }> {
  if (isHeicLike(file)) {
    throw new Error("HEIC/HEIF — convert with HEIC to JPG first");
  }
  if (!isSupportedBgInput(file)) {
    throw new Error("Unsupported format — use JPG, PNG, or WebP");
  }

  opts.onStatus?.("Loading model (first run downloads once)…");
  const segmenter = await getSegmenter(opts.onProgress, opts.onStatus);

  opts.onStatus?.("Preparing image…");
  const prepared = await prepareInputCanvas(file);
  const inputBlob = await canvasToBlob(prepared, "image/png");
  const objectUrl = URL.createObjectURL(inputBlob);

  try {
    opts.onStatus?.("Removing background…");
    // Single input returns one RawImage (not an array) — do not use output[0]
    const output = await segmenter(objectUrl);
    const raw = Array.isArray(output) ? output[0] : output;
    const cutout = raw?.toCanvas?.();
    if (!cutout) throw new Error("Model returned no image");

    const stem = file.name.replace(/\.[^.]+$/, "") || "product";
    if (opts.mode === "png") {
      const blob = await canvasToBlob(cutout, "image/png");
      return { blob, outName: `${stem}-no-bg.png` };
    }
    const blob = await compositeWhiteJpg(cutout, opts.quality ?? 0.92);
    return { blob, outName: `${stem}-white.jpg` };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Sample corner pixels of a white JPG — used in E2E. */
export async function sampleCornerRgb(blob: Blob): Promise<[number, number, number]> {
  const bmp = await createImageBitmap(blob);
  try {
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(bmp, 0, 0);
    const { data } = ctx.getImageData(2, 2, 1, 1);
    return [data[0], data[1], data[2]];
  } finally {
    bmp.close();
  }
}
