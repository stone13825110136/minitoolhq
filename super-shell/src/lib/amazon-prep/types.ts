export type ResizeMode = "square" | "longest";

export interface ProcessOptions {
  resizeMode: ResizeMode;
  targetPx: number;
  maxBytes: number;
  whiteBackground: boolean;
  upscaleBelowZoom: boolean;
  /** Floor used when upscaling small sources (Amazon zoom ~1600; TikTok often target itself). */
  upscaleMinPx?: number;
  /** Output filename prefix before basename, e.g. amazon- / tiktok-shop- */
  filenamePrefix?: string;
}

export interface ExifSummary {
  camera: string;
  gps: string;
  dateTaken: string;
  otherFields: string;
  hadExif: boolean;
}

export interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface ProcessResultRow {
  id: string;
  name: string;
  outputName: string;
  camera: string;
  gps: string;
  dateTaken: string;
  otherFields: string;
  inputBytes: number;
  outputBytes: number;
  width: number;
  height: number;
}

export interface ProcessFileResult {
  blob: Blob;
  outputName: string;
  row: ProcessResultRow;
}

export const FREE_BATCH_LIMIT = 10;

/** Site-wide Pro — paste Lemon Squeezy / Gumroad URL when checkout is live. */
export const PRO_CHECKOUT_URL = "";
export const PRO_PRICE_LABEL = "$4.99/mo";

export const DEFAULT_OPTIONS: ProcessOptions = {
  resizeMode: "square",
  targetPx: 2000,
  maxBytes: 5 * 1024 * 1024,
  whiteBackground: true,
  upscaleBelowZoom: true,
  upscaleMinPx: 1600,
  filenamePrefix: "amazon",
};
