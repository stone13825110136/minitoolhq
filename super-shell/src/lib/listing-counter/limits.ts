/** Marketplace listing field limits — defaults locked in docs/specs/07-listing-character-counter.md */

export type PlatformId = "amazon" | "etsy" | "tiktok-shop";

export type FieldKind = "chars" | "bytes";

export type FieldDef = {
  id: string;
  label: string;
  kind: FieldKind;
  limit: number;
  /** Soft guidance only (does not fail) */
  softMin?: number;
  softMax?: number;
  /** Characters shown in mobile-style truncate preview; omit = no preview */
  previewChars?: number;
  placeholder?: string;
  rows?: number;
  /** Multi-line: one tag per line (Etsy) */
  lineMode?: "tags";
  tagLimit?: number;
  maxLines?: number;
};

export type PlatformDef = {
  id: PlatformId;
  label: string;
  blurb: string;
  fields: FieldDef[];
};

export const PLATFORMS: Record<PlatformId, PlatformDef> = {
  amazon: {
    id: "amazon",
    label: "Amazon",
    blurb:
      "US defaults as of Jul 27, 2026: title 75 characters (non-media), Item Highlights 125. Confirm your category in Seller Central.",
    fields: [
      {
        id: "title",
        label: "Product title",
        kind: "chars",
        limit: 75,
        previewChars: 75,
        placeholder: "Brand + product type + key attribute…",
        rows: 2,
      },
      {
        id: "itemHighlights",
        label: "Item Highlights",
        kind: "chars",
        limit: 125,
        placeholder: "Materials, use cases, extra specs…",
        rows: 3,
      },
      {
        id: "bullet1",
        label: "Bullet 1",
        kind: "chars",
        limit: 500,
        placeholder: "About this item…",
        rows: 3,
      },
      {
        id: "bullet2",
        label: "Bullet 2",
        kind: "chars",
        limit: 500,
        rows: 3,
      },
      {
        id: "bullet3",
        label: "Bullet 3",
        kind: "chars",
        limit: 500,
        rows: 3,
      },
      {
        id: "bullet4",
        label: "Bullet 4",
        kind: "chars",
        limit: 500,
        rows: 3,
      },
      {
        id: "bullet5",
        label: "Bullet 5",
        kind: "chars",
        limit: 500,
        rows: 3,
      },
      {
        id: "description",
        label: "Product description",
        kind: "chars",
        limit: 2000,
        rows: 5,
      },
      {
        id: "backend",
        label: "Backend search terms",
        kind: "bytes",
        limit: 249,
        placeholder: "Keywords separated by spaces (no commas)…",
        rows: 3,
      },
    ],
  },
  etsy: {
    id: "etsy",
    label: "Etsy",
    blurb: "Etsy listing title hard-stops at 140 characters. Tags are commonly 20 characters each, up to 13 tags.",
    fields: [
      {
        id: "title",
        label: "Listing title",
        kind: "chars",
        limit: 140,
        previewChars: 60,
        placeholder: "Lead with your strongest keyword…",
        rows: 3,
      },
      {
        id: "tags",
        label: "Tags (one per line)",
        kind: "chars",
        limit: 20,
        lineMode: "tags",
        tagLimit: 20,
        maxLines: 13,
        placeholder: "handmade gift\nwedding favor\n…",
        rows: 8,
      },
    ],
  },
  "tiktok-shop": {
    id: "tiktok-shop",
    label: "TikTok Shop",
    blurb:
      "Hard max commonly 255 characters. TikTok Seller University often prefers roughly 40–150 characters; front-load the first ~60 for mobile cards.",
    fields: [
      {
        id: "title",
        label: "Product title",
        kind: "chars",
        limit: 255,
        softMin: 40,
        softMax: 150,
        previewChars: 60,
        placeholder: "Brand + product + key feature…",
        rows: 3,
      },
    ],
  },
};

export function isPlatformId(v: string): v is PlatformId {
  return v === "amazon" || v === "etsy" || v === "tiktok-shop";
}
