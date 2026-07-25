export type ResizeMode = "square" | "longest";

export interface ProcessOptions {
  resizeMode: ResizeMode;
  targetPx: number;
  maxBytes: number;
  whiteBackground: boolean;
  upscaleBelowZoom: boolean;
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
export const DEFAULT_OPTIONS: ProcessOptions = {
  resizeMode: "square",
  targetPx: 2000,
  maxBytes: 5 * 1024 * 1024,
  whiteBackground: true,
  upscaleBelowZoom: true,
};
