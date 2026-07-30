export interface ParsedCartonRow {
  length: number;
  width: number;
  height: number;
  weight: number;
  line: number;
}

export interface CsvParseResult {
  rows: ParsedCartonRow[];
  errors: string[];
}

const HEADER_ALIASES: Record<string, "length" | "width" | "height" | "weight"> = {
  length: "length",
  len: "length",
  l: "length",
  width: "width",
  wid: "width",
  w: "width",
  height: "height",
  hei: "height",
  h: "height",
  weight: "weight",
  wt: "weight",
  mass: "weight",
};

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if ((ch === "," || ch === ";") && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function looksLikeHeader(cells: string[]): boolean {
  const mapped = cells.map(normalizeHeader).filter((c) => HEADER_ALIASES[c]);
  return mapped.length >= 3;
}

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse local CSV text into carton rows. Values are in the UI's current unit system
 * (caller does not convert). Header optional: length,width,height,weight.
 */
export function parseCartonCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const rows: ParsedCartonRow[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    return { rows, errors: ["CSV is empty."] };
  }

  const first = splitCsvLine(lines[0]);
  if (looksLikeHeader(first)) {
    const idx: Partial<Record<"length" | "width" | "height" | "weight", number>> = {};
    first.forEach((cell, i) => {
      const key = HEADER_ALIASES[normalizeHeader(cell)];
      if (key) idx[key] = i;
    });
    if (
      idx.length === undefined ||
      idx.width === undefined ||
      idx.height === undefined ||
      idx.weight === undefined
    ) {
      return {
        rows: [],
        errors: ["Header must include length, width, height, and weight columns."],
      };
    }
    for (let li = 1; li < lines.length; li++) {
      const cells = splitCsvLine(lines[li]);
      const length = parseNumber(cells[idx.length] ?? "");
      const width = parseNumber(cells[idx.width] ?? "");
      const height = parseNumber(cells[idx.height] ?? "");
      const weight = parseNumber(cells[idx.weight] ?? "");
      if ([length, width, height, weight].some((n) => n === null || (n as number) <= 0)) {
        errors.push(`Line ${li + 1}: need four positive numbers (L, W, H, weight).`);
        continue;
      }
      rows.push({
        length: length!,
        width: width!,
        height: height!,
        weight: weight!,
        line: li + 1,
      });
    }
    if (rows.length === 0 && errors.length === 0) {
      errors.push("No carton rows found in CSV.");
    }
    return { rows, errors };
  }

  for (let li = 0; li < lines.length; li++) {
    const cells = splitCsvLine(lines[li]);
    if (cells.length < 4) {
      errors.push(`Line ${li + 1}: need at least 4 columns (L, W, H, weight).`);
      continue;
    }
    const length = parseNumber(cells[0]);
    const width = parseNumber(cells[1]);
    const height = parseNumber(cells[2]);
    const weight = parseNumber(cells[3]);
    if ([length, width, height, weight].some((n) => n === null || (n as number) <= 0)) {
      errors.push(`Line ${li + 1}: need four positive numbers (L, W, H, weight).`);
      continue;
    }
    rows.push({
      length: length!,
      width: width!,
      height: height!,
      weight: weight!,
      line: li + 1,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push("No carton rows found in CSV.");
  }
  return { rows, errors };
}

export function buildResultsCsv(
  lines: Array<Record<string, string | number | boolean>>,
): string {
  if (lines.length === 0) return "carton,pass\n";
  const keys = Object.keys(lines[0]);
  const header = keys.join(",");
  const body = lines
    .map((row) =>
      keys
        .map((k) => {
          const v = String(row[k] ?? "");
          return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
        })
        .join(","),
    )
    .join("\n");
  return `${header}\n${body}\n`;
}
