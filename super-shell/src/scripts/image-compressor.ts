import {
  compressImageFile,
  isHeicLike,
  isSupportedInput,
  type CompressFormat,
  type CompressMode,
} from "../lib/image-compress/compress";
import { blobToUint8Array, zipNamedFiles } from "../lib/amazon-prep/zip";

type Row = {
  file: File;
  status: "queued" | "working" | "done" | "error";
  message?: string;
  out?: Blob;
  outName?: string;
  inputBytes?: number;
  outputBytes?: number;
};

const root = document.querySelector("[data-image-compressor]");
if (root) {
  const fileInput = root.querySelector<HTMLInputElement>("#compressFiles")!;
  const dropZone = root.querySelector<HTMLElement>("#dropZone")!;
  const modeEl = root.querySelector<HTMLSelectElement>("#compressMode")!;
  const qualityEl = root.querySelector<HTMLInputElement>("#quality")!;
  const qualityLabel = root.querySelector<HTMLElement>("#qualityLabel")!;
  const qualityField = root.querySelector<HTMLElement>("#qualityField")!;
  const targetEl = root.querySelector<HTMLInputElement>("#targetKb")!;
  const targetField = root.querySelector<HTMLElement>("#targetField")!;
  const formatEl = root.querySelector<HTMLSelectElement>("#outFormat")!;
  const compressBtn = root.querySelector<HTMLButtonElement>("#compressBtn")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const listEl = root.querySelector<HTMLElement>("#fileList")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;

  let rows: Row[] = [];

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function selectedMode(): CompressMode {
    return modeEl.value === "target" ? "target" : "quality";
  }

  function selectedFormat(): CompressFormat {
    const v = formatEl.value;
    if (v === "png" || v === "webp" || v === "same") return v;
    return "jpg";
  }

  function qualityValue(): number {
    const n = Number(qualityEl.value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0.4, n / 100)) : 0.85;
  }

  function targetBytes(): number {
    const kb = Number(targetEl.value);
    if (!Number.isFinite(kb) || kb <= 0) return 100 * 1024;
    return Math.round(kb * 1024);
  }

  function syncQualityLabel() {
    qualityLabel.textContent = `${qualityEl.value}%`;
  }

  function syncModeUi() {
    const mode = selectedMode();
    qualityField.hidden = mode !== "quality";
    targetField.hidden = mode !== "target";
  }

  qualityEl.addEventListener("input", syncQualityLabel);
  modeEl.addEventListener("change", syncModeUi);
  syncQualityLabel();
  syncModeUi();

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  function addFiles(fileList: FileList | File[]) {
    for (const file of fileList) {
      if (isHeicLike(file)) {
        rows.push({
          file,
          status: "error",
          message: "HEIC/HEIF - use HEIC to JPG tool first",
        });
        continue;
      }
      if (!isSupportedInput(file)) {
        rows.push({
          file,
          status: "error",
          message: "Not JPG/PNG/WebP - skipped",
        });
        continue;
      }
      rows.push({ file, status: "queued" });
    }
    renderList();
    const n = rows.filter((r) => isSupportedInput(r.file)).length;
    setStatus(n ? `${n} image(s) ready.` : "");
  }

  function renderList() {
    listEl.innerHTML = "";
    if (!rows.length) {
      listEl.hidden = true;
      return;
    }
    listEl.hidden = false;
    for (const r of rows) {
      const li = document.createElement("li");
      li.className = `file-row status-${r.status}`;
      let label = r.file.name;
      if (r.status === "done" && r.inputBytes != null && r.outputBytes != null) {
        label = `${r.file.name} - ${formatBytes(r.inputBytes)} → ${formatBytes(r.outputBytes)}`;
      } else if (r.message) {
        label = `${r.file.name} - ${r.message}`;
      }
      li.textContent = label;
      listEl.appendChild(li);
    }
  }

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  for (const evt of ["dragenter", "dragover"] as const) {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
  }
  for (const evt of ["dragleave", "drop"] as const) {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    });
  }
  dropZone.addEventListener("drop", (e) => {
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("click", (e) => e.stopPropagation());
  fileInput.addEventListener("change", () => {
    if (fileInput.files?.length) addFiles(fileInput.files);
    fileInput.value = "";
  });

  clearBtn.addEventListener("click", () => {
    rows = [];
    resultsEl.innerHTML = "";
    renderList();
    setStatus("");
  });

  root.querySelectorAll<HTMLButtonElement>("[data-target-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      modeEl.value = "target";
      syncModeUi();
      const kb = btn.getAttribute("data-target-preset");
      if (kb) targetEl.value = kb;
    });
  });

  compressBtn.addEventListener("click", async () => {
    const work = rows.filter((r) => isSupportedInput(r.file));
    if (!work.length) {
      setStatus("Add at least one JPG, PNG, or WebP file.");
      return;
    }

    compressBtn.disabled = true;
    resultsEl.innerHTML = "";
    const mode = selectedMode();
    const format = selectedFormat();
    const q = qualityValue();
    const target = targetBytes();
    const outputs: { name: string; data: Uint8Array }[] = [];

    try {
      for (const r of work) {
        r.status = "working";
        r.message = "Compressing…";
        renderList();
        setStatus(`Compressing ${r.file.name}…`);
        try {
          const result = await compressImageFile(r.file, {
            mode,
            quality: q,
            targetBytes: target,
            format,
          });
          r.out = result.blob;
          r.outName = result.outName;
          r.inputBytes = result.inputBytes;
          r.outputBytes = result.outputBytes;
          r.status = "done";
          r.message = undefined;
          outputs.push({
            name: result.outName,
            data: await blobToUint8Array(result.blob),
          });
        } catch (err) {
          r.status = "error";
          r.message = err instanceof Error ? err.message : "Compression failed";
        }
        renderList();
      }

      const ok = outputs.length;
      if (!ok) {
        setStatus("No files compressed. Check errors above.");
        return;
      }

      const zipBlob = zipNamedFiles(outputs);
      const zipUrl = URL.createObjectURL(zipBlob);

      const inSum = work.reduce((s, r) => s + (r.inputBytes || 0), 0);
      const outSum = work.reduce((s, r) => s + (r.outputBytes || 0), 0);

      const box = document.createElement("div");
      box.className = "result-box";
      box.innerHTML = `<p><strong>${ok}</strong> file(s) ready. Total ${formatBytes(inSum)} → ${formatBytes(outSum)}.</p>`;
      const a = document.createElement("a");
      a.className = "btn btn-primary";
      a.href = zipUrl;
      a.download = "compressed-images.zip";
      a.id = "zipDownload";
      a.textContent = "Download ZIP";
      box.appendChild(a);

      if (ok === 1) {
        const one = work.find((r) => r.status === "done" && r.out)!;
        const single = document.createElement("a");
        single.className = "btn btn-ghost";
        single.href = URL.createObjectURL(one.out!);
        single.download = one.outName || "compressed.jpg";
        single.id = "singleDownload";
        single.textContent = "Download single file";
        box.appendChild(single);
      }

      const next = document.createElement("p");
      next.className = "lede";
      next.style.marginTop = "1rem";
      next.innerHTML =
        'Need marketplace sizes next? Use the <a href="/tools/marketplace-image-prep">Marketplace Image Resizer</a>. Wrong format? <a href="/tools/png-to-jpg">PNG to JPG</a> or <a href="/tools/heic-to-jpg">HEIC to JPG</a>.';
      box.appendChild(next);

      resultsEl.appendChild(box);
      setStatus(`Done - ${ok} compressed.`);
    } finally {
      compressBtn.disabled = false;
    }
  });
}
