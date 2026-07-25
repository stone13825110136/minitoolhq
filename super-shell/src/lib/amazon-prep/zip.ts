import { zipSync } from "fflate";

export function zipJpegFiles(
  files: { name: string; data: Uint8Array }[],
): Blob {
  const input: Record<string, Uint8Array> = {};
  const used = new Set<string>();

  for (const f of files) {
    let name = f.name;
    let n = 1;
    while (used.has(name.toLowerCase())) {
      const base = f.name.replace(/\.jpg$/i, "");
      name = `${base}-${n}.jpg`;
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

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
