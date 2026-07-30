import type { ProcessOptions } from "../amazon-prep/types";

export type { ProcessOptions, ProcessResultRow, QueueItem } from "../amazon-prep/types";

export type PlatformId =
  | "amazon"
  | "tiktok-shop"
  | "etsy"
  | "ebay"
  | "shopify"
  | "walmart";

export interface PlatformPreset {
  id: PlatformId;
  label: string;
  options: ProcessOptions;
  blurb: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "amazon",
    label: "Amazon",
    blurb: "Default 2000×2000 seller master · white BG (official zoom ≥1000; ~1600+ optimal)",
    options: {
      resizeMode: "square",
      targetPx: 2000,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: true,
      upscaleBelowZoom: true,
      upscaleMinPx: 1600,
      filenamePrefix: "amazon",
    },
  },
  {
    id: "tiktok-shop",
    label: "TikTok Shop",
    blurb: "1200×1200 square (min often 600) · white BG for main image",
    options: {
      resizeMode: "square",
      targetPx: 1200,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: true,
      upscaleBelowZoom: true,
      upscaleMinPx: 1200,
      filenamePrefix: "tiktok-shop",
    },
  },
  {
    id: "etsy",
    label: "Etsy",
    blurb: "2000×2000 practical listing master (Etsy recommends ~2000px; first-photo floor ~635px)",
    options: {
      resizeMode: "square",
      targetPx: 2000,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: false,
      upscaleBelowZoom: true,
      upscaleMinPx: 2000,
      filenamePrefix: "etsy",
    },
  },
  {
    id: "ebay",
    label: "eBay",
    blurb: "1600×1600 square for gallery zoom",
    options: {
      resizeMode: "square",
      targetPx: 1600,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: false,
      upscaleBelowZoom: true,
      upscaleMinPx: 1600,
      filenamePrefix: "ebay",
    },
  },
  {
    id: "shopify",
    label: "Shopify",
    blurb: "2048×2048 square storefront common",
    options: {
      resizeMode: "square",
      targetPx: 2048,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: false,
      upscaleBelowZoom: true,
      upscaleMinPx: 2048,
      filenamePrefix: "shopify",
    },
  },
  {
    id: "walmart",
    label: "Walmart",
    blurb: "2200×2200 square · white BG (Walmart Marketplace Learn)",
    options: {
      resizeMode: "square",
      targetPx: 2200,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: true,
      upscaleBelowZoom: true,
      upscaleMinPx: 1500,
      filenamePrefix: "walmart",
    },
  },
];

export function presetById(id: string | null | undefined): PlatformPreset {
  return PLATFORM_PRESETS.find((p) => p.id === id) ?? PLATFORM_PRESETS[0];
}
