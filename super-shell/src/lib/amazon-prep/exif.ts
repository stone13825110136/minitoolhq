import exifr from "exifr";
import type { ExifSummary } from "./types";

const KNOWN = new Set([
  "Make",
  "Model",
  "DateTimeOriginal",
  "CreateDate",
  "ModifyDate",
  "latitude",
  "longitude",
  "GPSLatitude",
  "GPSLongitude",
]);

export async function readExifSummary(file: File): Promise<ExifSummary> {
  try {
    const data = await exifr.parse(file, {
      gps: true,
      exif: true,
      iptc: false,
      icc: false,
      xmp: false,
      interop: false,
    });

    if (!data || typeof data !== "object") {
      return emptySummary();
    }

    const make = str(data.Make);
    const model = str(data.Model);
    const camera = [make, model].filter(Boolean).join(" ") || "—";

    let gps = "—";
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      gps = `${data.latitude.toFixed(5)}, ${data.longitude.toFixed(5)}`;
    }

    const dateRaw = data.DateTimeOriginal || data.CreateDate || data.ModifyDate;
    const dateTaken = dateRaw ? formatDate(dateRaw) : "—";

    const extras = Object.keys(data)
      .filter((k) => !KNOWN.has(k))
      .slice(0, 8);

    return {
      camera,
      gps,
      dateTaken,
      otherFields: extras.length ? extras.join(", ") : "—",
      hadExif: camera !== "—" || gps !== "—" || dateTaken !== "—" || extras.length > 0,
    };
  } catch {
    return emptySummary();
  }
}

function emptySummary(): ExifSummary {
  return {
    camera: "—",
    gps: "—",
    dateTaken: "—",
    otherFields: "—",
    hadExif: false,
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function formatDate(v: unknown): string {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 19).replace("T", " ");
  }
  if (typeof v === "string") return v;
  return "—";
}
