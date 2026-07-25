import { processImageFile } from "../lib/amazon-prep/process";
import {
  DEFAULT_OPTIONS,
  FREE_BATCH_LIMIT,
  type ProcessOptions,
  type ProcessResultRow,
  type QueueItem,
} from "../lib/amazon-prep/types";
import { blobToUint8Array, zipJpegFiles } from "../lib/amazon-prep/zip";

const ACCEPT = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function isAccepted(file: File): boolean {
  if (ACCEPT.has(file.type.toLowerCase())) return true;
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

function uid(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function readOptions(root: HTMLElement): ProcessOptions {
  const mode = (root.querySelector("#resizeMode") as HTMLSelectElement).value;
  const targetPx = Number((root.querySelector("#targetPx") as HTMLInputElement).value);
  const maxMb = Number((root.querySelector("#maxMb") as HTMLInputElement).value);
  const whiteBackground = (root.querySelector("#whiteBg") as HTMLInputElement).checked;
  const upscaleBelowZoom = (root.querySelector("#upscale") as HTMLInputElement).checked;

  return {
    resizeMode: mode === "longest" ? "longest" : "square",
    targetPx: Number.isFinite(targetPx) && targetPx >= 1000 ? Math.round(targetPx) : 2000,
    maxBytes:
      Number.isFinite(maxMb) && maxMb > 0
        ? Math.round(maxMb * 1024 * 1024)
        : DEFAULT_OPTIONS.maxBytes,
    whiteBackground,
    upscaleBelowZoom,
  };
}

function init(): void {
  const root = document.querySelector<HTMLElement>("[data-amazon-prep]");
  if (!root) return;

  const drop = root.querySelector<HTMLElement>("#dropZone")!;
  const fileInput = root.querySelector<HTMLInputElement>("#fileInput")!;
  const thumbs = root.querySelector<HTMLElement>("#thumbs")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const proBanner = root.querySelector<HTMLElement>("#proBanner")!;
  const processBtn = root.querySelector<HTMLButtonElement>("#processBtn")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;
  const reportBody = root.querySelector<HTMLElement>("#reportBody")!;
  const queueCount = root.querySelector<HTMLElement>("#queueCount")!;

  let queue: QueueItem[] = [];
  let busy = false;

  function setStatus(msg: string, kind: "" | "error" | "ok" = ""): void {
    statusEl.textContent = msg;
    statusEl.classList.remove("error", "ok");
    if (kind) statusEl.classList.add(kind);
  }

  function renderQueue(): void {
    queueCount.textContent = String(queue.length);
    thumbs.innerHTML = "";
    for (const item of queue) {
      const fig = document.createElement("figure");
      fig.className = "thumb";
      const img = document.createElement("img");
      img.src = item.previewUrl;
      img.alt = item.file.name;
      const cap = document.createElement("figcaption");
      cap.textContent = item.file.name;
      fig.append(img, cap);
      thumbs.append(fig);
    }
    processBtn.disabled = queue.length === 0 || busy;
    clearBtn.disabled = queue.length === 0 || busy;

    if (queue.length > FREE_BATCH_LIMIT) {
      proBanner.hidden = false;
      proBanner.textContent = `Free tier processes the first ${FREE_BATCH_LIMIT} images per run. ${queue.length - FREE_BATCH_LIMIT} extra file(s) need Pro ($4.99/mo) — checkout coming soon. We'll process ${FREE_BATCH_LIMIT} for now.`;
    } else {
      proBanner.hidden = true;
    }
  }

  function addFiles(fileList: FileList | File[]): void {
    const files = Array.from(fileList).filter(isAccepted);
    if (!files.length) {
      setStatus("Please add JPEG, PNG, WebP, or HEIC images.", "error");
      return;
    }
    for (const file of files) {
      queue.push({
        id: uid(file),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setStatus(`${queue.length} image(s) queued — nothing uploaded.`);
    renderQueue();
  }

  function clearQueue(): void {
    for (const item of queue) URL.revokeObjectURL(item.previewUrl);
    queue = [];
    reportBody.innerHTML = "";
    setStatus("Queue cleared.");
    renderQueue();
  }

  function renderReport(rows: ProcessResultRow[]): void {
    reportBody.innerHTML = "";
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.camera)}</td>
        <td>${escapeHtml(row.gps)}</td>
        <td>${escapeHtml(row.dateTaken)}</td>
        <td>${escapeHtml(row.otherFields)}</td>
        <td>${row.width}×${row.height}<br />${formatBytes(row.inputBytes)} → ${formatBytes(row.outputBytes)}</td>
      `;
      reportBody.append(tr);
    }
  }

  async function processAll(): Promise<void> {
    if (busy || !queue.length) return;
    busy = true;
    processBtn.disabled = true;
    clearBtn.disabled = true;

    const options = readOptions(root);
    const batch = queue.slice(0, FREE_BATCH_LIMIT);
    const zipEntries: { name: string; data: Uint8Array }[] = [];
    const rows: ProcessResultRow[] = [];

    try {
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        setStatus(`Processing ${i + 1}/${batch.length}: ${item.file.name}`);
        const result = await processImageFile(item.file, options);
        zipEntries.push({
          name: result.outputName,
          data: await blobToUint8Array(result.blob),
        });
        rows.push(result.row);
      }

      const zipBlob = zipJpegFiles(zipEntries);
      downloadBlob(zipBlob, `amazon-images-${Date.now()}.zip`);
      renderReport(rows);
      setStatus(
        `Done — ${rows.length} JPEG(s) zipped and downloaded. EXIF stripped via canvas redraw.`,
        "ok",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setStatus(msg, "error");
    } finally {
      busy = false;
      renderQueue();
    }
  }

  drop.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files) addFiles(fileInput.files);
    fileInput.value = "";
  });

  for (const evt of ["dragenter", "dragover"] as const) {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add("dragover");
    });
  }
  for (const evt of ["dragleave", "drop"] as const) {
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove("dragover");
    });
  }
  drop.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt?.files?.length) addFiles(dt.files);
  });

  processBtn.addEventListener("click", () => void processAll());
  clearBtn.addEventListener("click", clearQueue);

  setStatus("Add product photos to begin. Processing never leaves this browser.");
  renderQueue();
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

init();
