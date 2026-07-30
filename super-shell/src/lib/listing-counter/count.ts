import type { FieldDef, FieldKind } from "./limits";

export type CountResult = {
  used: number;
  remaining: number;
  over: boolean;
  kind: FieldKind;
  /** For tag lines: per-line overages */
  tagStats?: { index: number; text: string; used: number; over: boolean }[];
  tagCount?: number;
  softNote?: string;
};

/** Amazon/Etsy-style character count: JS string length (UTF-16 code units). */
export function charCount(text: string): number {
  return text.length;
}

/** Backend search terms: UTF-8 byte length. */
export function byteCount(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function measure(text: string, kind: FieldKind): number {
  return kind === "bytes" ? byteCount(text) : charCount(text);
}

export function evaluateField(text: string, field: FieldDef): CountResult {
  if (field.lineMode === "tags") {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const maxLines = field.maxLines ?? 13;
    const tagLimit = field.tagLimit ?? field.limit;
    const tagStats = lines.slice(0, maxLines + 5).map((t, index) => {
      const used = charCount(t);
      return { index: index + 1, text: t, used, over: used > tagLimit };
    });
    const over =
      tagStats.some((t) => t.over) || lines.length > maxLines;
    let softNote: string | undefined;
    if (lines.length > maxLines) {
      softNote = `More than ${maxLines} tags — trim to ${maxLines}.`;
    }
    return {
      used: lines.length,
      remaining: Math.max(0, maxLines - lines.length),
      over,
      kind: "chars",
      tagStats,
      tagCount: lines.length,
      softNote,
    };
  }

  const used = measure(text, field.kind);
  const remaining = field.limit - used;
  const over = used > field.limit;
  let softNote: string | undefined;
  if (field.softMin != null && field.softMax != null && text.length > 0 && !over) {
    if (used < field.softMin || used > field.softMax) {
      softNote = `Soft guidance: about ${field.softMin}–${field.softMax} characters often works better on mobile.`;
    }
  }
  return {
    used,
    remaining,
    over,
    kind: field.kind,
    softNote,
  };
}

export function truncatePreview(text: string, n: number): { shown: string; truncated: boolean } {
  if (text.length <= n) return { shown: text, truncated: false };
  return { shown: text.slice(0, n), truncated: true };
}
