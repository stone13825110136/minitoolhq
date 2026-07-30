import { zipSync } from "fflate";

export function zipNamedFiles(
  files: { name: string; data: Uint8Array }[],
): Blob {
  const input: Record<string, Uint8Array> = {};
  const used = new Set<string>();

  for (const f of files) {
    let name = f.name;
    let n = 1;
    const dot = f.name.lastIndexOf(".");
    const stem = dot > 0 ? f.name.slice(0, dot) : f.name;
    const ext = dot > 0 ? f.name.slice(dot) : "";
    while (used.has(name.toLowerCase())) {
      name = `${stem}-${n}${ext}`;
      n += 1;
    }
    used.add(name.toLowerCase());
    input[name] = f.data;
  }

  const zipped = zipSync(input, { level: 6 });
  // Copy into a fresh ArrayBuffer-backed view for Blob typing across TS targets
  const copy = new Uint8Array(zipped.byteLength);
  copy.set(zipped);
  return new Blob([copy], { type: "application/zip" });
}

/** @deprecated Prefer zipNamedFiles — kept for HEIC/JPG callers */
export function zipJpegFiles(
  files: { name: string; data: Uint8Array }[],
): Blob {
  return zipNamedFiles(files);
}

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
