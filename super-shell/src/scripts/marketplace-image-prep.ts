import { processImageFile } from "../lib/amazon-prep/process";
import { blobToUint8Array, zipJpegFiles } from "../lib/amazon-prep/zip";
import {
  FREE_BATCH_LIMIT,
  PLATFORM_PRESETS,
  PRO_CHECKOUT_URL,
  PRO_PRICE_LABEL,
  presetById,
  type PlatformId,
  type ProcessOptions,
  type ProcessResultRow,
  type QueueItem,
} from "../lib/marketplace-prep/presets";

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

function init(): void {
  const root = document.querySelector<HTMLElement>("[data-marketplace-prep]");
  if (!root) return;

  const platformList = root.querySelector<HTMLElement>("#platformList")!;
  const tweakFields = root.querySelector<HTMLElement>("#tweakFields")!;
  const targetPx = root.querySelector<HTMLInputElement>("#targetPx")!;
  const maxMb = root.querySelector<HTMLInputElement>("#maxMb")!;
  const whiteBg = root.querySelector<HTMLInputElement>("#whiteBg")!;
  const upscale = root.querySelector<HTMLInputElement>("#upscale")!;
  const platformBlurb = root.querySelector<HTMLElement>("#platformBlurb")!;
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

  function selectedPlatformIds(): PlatformId[] {
    return [...platformList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')].map(
      (el) => el.value as PlatformId,
    );
  }

  function syncUrl(): void {
    const ids = selectedPlatformIds();
    const url = new URL(window.location.href);
    if (ids.length) url.searchParams.set("platform", ids.join(","));
    else url.searchParams.delete("platform");
    window.history.replaceState({}, "", url.toString());
  }

  function syncExportMode(): void {
    const ids = selectedPlatformIds();
    const single = ids.length === 1;
    tweakFields.hidden = !single;
    if (single) {
      const preset = presetById(ids[0]);
      targetPx.value = String(preset.options.targetPx);
      maxMb.value = String(preset.options.maxBytes / (1024 * 1024));
      whiteBg.checked = preset.options.whiteBackground;
      upscale.checked = preset.options.upscaleBelowZoom;
      platformBlurb.textContent = `${preset.label}: ${preset.blurb}`;
      processBtn.textContent = `Process & download ${preset.label} ZIP`;
    } else if (ids.length > 1) {
      const labels = ids.map((id) => presetById(id).label).join(", ");
      platformBlurb.textContent = `${labels} — one ZIP with a folder for each marketplace.`;
      processBtn.textContent = `Process & download ZIP (${ids.length} marketplaces)`;
    } else {
      platformBlurb.textContent = "Select at least one marketplace.";
      processBtn.textContent = "Process & download ZIP";
    }
    processBtn.disabled = queue.length === 0 || busy || ids.length === 0;
    syncUrl();
  }

  function optionsForPlatform(id: PlatformId): ProcessOptions {
    const preset = presetById(id);
    const ids = selectedPlatformIds();
    if (ids.length === 1 && ids[0] === id) {
      const px = Number(targetPx.value);
      const mb = Number(maxMb.value);
      return {
        resizeMode: "square",
        targetPx: Number.isFinite(px) && px >= 600 ? Math.round(px) : preset.options.targetPx,
        maxBytes:
          Number.isFinite(mb) && mb > 0
            ? Math.round(mb * 1024 * 1024)
            : preset.options.maxBytes,
        whiteBackground: whiteBg.checked,
        upscaleBelowZoom: upscale.checked,
        upscaleMinPx: Number.isFinite(px) && px >= 600 ? Math.round(px) : preset.options.upscaleMinPx,
        filenamePrefix: preset.options.filenamePrefix,
      };
    }
    return { ...preset.options };
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
    clearBtn.disabled = queue.length === 0 || busy;
    processBtn.disabled = queue.length === 0 || busy || selectedPlatformIds().length === 0;
    updateProBanner(queue.length);
  }

  function proUpgradeHref(): string {
    return PRO_CHECKOUT_URL.trim() || "#pro-upgrade";
  }

  function updateProBanner(count: number): void {
    if (count < FREE_BATCH_LIMIT) {
      proBanner.hidden = true;
      proBanner.innerHTML = "";
      return;
    }
    const href = proUpgradeHref();
    const cta = `<a class="pro-cta" href="${href}">Upgrade to Pro — larger batches · ${PRO_PRICE_LABEL}</a>`;
    if (count === FREE_BATCH_LIMIT) {
      proBanner.hidden = false;
      proBanner.innerHTML = `
        <p class="pro-banner-title">Free batch full (${FREE_BATCH_LIMIT} images)</p>
        <p class="pro-banner-body">
          This run will process all ${FREE_BATCH_LIMIT}. Need a bigger batch in one go?
          Pro unlocks higher limits on every MiniTool HQ tool.
        </p>
        ${cta}
      `;
      return;
    }
    const waiting = count - FREE_BATCH_LIMIT;
    proBanner.hidden = false;
    proBanner.innerHTML = `
      <p class="pro-banner-title">Free plan: first ${FREE_BATCH_LIMIT} only</p>
      <p class="pro-banner-body">
        This run processes the first ${FREE_BATCH_LIMIT} images.
        <strong>${waiting}</strong> more will wait in the queue.
        Upgrade to Pro to process larger batches in one click.
      </p>
      ${cta}
    `;
  }

  function addFiles(fileList: FileList | File[]): void {
    const files = Array.from(fileList).filter(isAccepted);
    if (!files.length) {
      setStatus("Please add JPEG, PNG, WebP, or HEIC images.", "error");
      return;
    }
    for (const file of files) {
      queue.push({ id: uid(file), file, previewUrl: URL.createObjectURL(file) });
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

  function renderReport(rows: ProcessResultRow[], platforms: string[]): void {
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
    if (platforms.length > 1) {
      const note = document.createElement("tr");
      note.innerHTML = `<td colspan="6" class="muted">Exported folders: ${platforms.map(escapeHtml).join(", ")}</td>`;
      reportBody.append(note);
    }
  }

  async function processAll(): Promise<void> {
    if (busy || !queue.length) return;
    const platforms = selectedPlatformIds();
    if (!platforms.length) {
      setStatus("Select at least one marketplace.", "error");
      return;
    }

    busy = true;
    processBtn.disabled = true;
    clearBtn.disabled = true;

    const batch = queue.slice(0, FREE_BATCH_LIMIT);
    const zipEntries: { name: string; data: Uint8Array }[] = [];
    const rows: ProcessResultRow[] = [];
    const folderNames = platforms.map((id) => presetById(id).id);

    try {
      let step = 0;
      const total = batch.length * platforms.length;
      for (const platformId of platforms) {
        const options = optionsForPlatform(platformId);
        const folder = presetById(platformId).id;
        for (let i = 0; i < batch.length; i++) {
          const item = batch[i];
          step += 1;
          setStatus(
            `Processing ${step}/${total}: ${item.file.name} → ${presetById(platformId).label}`,
          );
          const result = await processImageFile(item.file, options);
          // Single platform: flat ZIP. Multi: folder per marketplace.
          const entryName =
            platforms.length === 1
              ? result.outputName
              : `${folder}/${result.outputName}`;
          zipEntries.push({
            name: entryName,
            data: await blobToUint8Array(result.blob),
          });
          if (platformId === platforms[0]) rows.push(result.row);
        }
      }

      const zipBlob = zipJpegFiles(zipEntries);
      const zipName =
        platforms.length === 1
          ? `${platforms[0]}-images-${Date.now()}.zip`
          : `marketplace-images-${Date.now()}.zip`;
      downloadBlob(zipBlob, zipName);
      renderReport(rows, folderNames);
      const waiting = queue.length - batch.length;
      const platLabel =
        platforms.length === 1
          ? presetById(platforms[0]).label
          : `${platforms.length} marketplaces (folders)`;
      if (waiting > 0) {
        setStatus(
          `Done — ${batch.length} image(s) × ${platLabel} (free limit). ${waiting} still queued — Upgrade to Pro for larger batches.`,
          "ok",
        );
      } else {
        setStatus(
          `Done — ${batch.length} image(s) exported for ${platLabel}. EXIF stripped.`,
          "ok",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setStatus(msg, "error");
    } finally {
      busy = false;
      renderQueue();
    }
  }

  for (const p of PLATFORM_PRESETS) {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" name="platform" value="${p.id}" /> ${p.label}`;
    platformList.append(label);
  }

  const selectAllBtn = root.querySelector<HTMLButtonElement>("#selectAllPlatforms");
  const clearPlatformsBtn = root.querySelector<HTMLButtonElement>("#clearPlatforms");
  selectAllBtn?.addEventListener("click", () => {
    for (const box of platformList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
      box.checked = true;
    }
    syncExportMode();
  });
  clearPlatformsBtn?.addEventListener("click", () => {
    for (const box of platformList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
      box.checked = false;
    }
    syncExportMode();
  });

  const initialParam = new URLSearchParams(window.location.search).get("platform") || "amazon";
  const initialIds = initialParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const id of initialIds) {
    const box = platformList.querySelector<HTMLInputElement>(`input[value="${id}"]`);
    if (box) box.checked = true;
  }
  if (!selectedPlatformIds().length) {
    const amazon = platformList.querySelector<HTMLInputElement>('input[value="amazon"]');
    if (amazon) amazon.checked = true;
  }
  syncExportMode();

  platformList.addEventListener("change", () => syncExportMode());

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

  setStatus("Select marketplace(s), add photos, then Process.");
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
