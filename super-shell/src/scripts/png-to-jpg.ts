import {
  convertImageFile,
  isHeicLike,
  isSupportedInput,
  outputName,
  type OutputFormat,
} from "../lib/format-convert/convert";
import { blobToUint8Array, zipNamedFiles } from "../lib/amazon-prep/zip";

type Row = {
  file: File;
  status: "queued" | "working" | "done" | "error";
  message?: string;
  out?: Blob;
  outName?: string;
};

const root = document.querySelector("[data-png-jpg], [data-webp-jpg]");
if (root) {
  const webpLanding = root.hasAttribute("data-webp-jpg");
  const fileInput = root.querySelector<HTMLInputElement>("#formatFiles")!;
  const dropZone = root.querySelector<HTMLElement>("#dropZone")!;
  const formatEl = root.querySelector<HTMLSelectElement>("#outFormat");
  const qualityEl = root.querySelector<HTMLInputElement>("#quality")!;
  const qualityLabel = root.querySelector<HTMLElement>("#qualityLabel")!;
  const qualityField = root.querySelector<HTMLElement>("#qualityField")!;
  const fillEl = root.querySelector<HTMLInputElement>("#fillColor")!;
  const fillField = root.querySelector<HTMLElement>("#fillField")!;
  const convertBtn = root.querySelector<HTMLButtonElement>("#convertBtn")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const listEl = root.querySelector<HTMLElement>("#fileList")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;

  let rows: Row[] = [];

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function selectedFormat(): OutputFormat {
    if (webpLanding || !formatEl) return "jpg";
    const v = formatEl.value;
    if (v === "png" || v === "webp") return v;
    return "jpg";
  }

  function qualityValue(): number {
    const n = Number(qualityEl.value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0.5, n / 100)) : 0.92;
  }

  function syncQualityLabel() {
    qualityLabel.textContent = `${qualityEl.value}%`;
  }

  function syncFormatUi() {
    const fmt = selectedFormat();
    const lossy = fmt === "jpg" || fmt === "webp";
    qualityField.hidden = !lossy;
    fillField.hidden = fmt !== "jpg";
    convertBtn.textContent =
      fmt === "jpg"
        ? "Convert to JPG"
        : fmt === "png"
          ? "Convert to PNG"
          : "Convert to WebP";
  }

  qualityEl.addEventListener("input", syncQualityLabel);
  formatEl?.addEventListener("change", syncFormatUi);
  syncQualityLabel();
  syncFormatUi();

  function addFiles(fileList: FileList | File[]) {
    for (const file of fileList) {
      if (isHeicLike(file)) {
        rows.push({
          file,
          status: "error",
          message: "HEIC/HEIF — use HEIC to JPG tool",
        });
        continue;
      }
      if (!isSupportedInput(file)) {
        rows.push({
          file,
          status: "error",
          message: "Not PNG/JPG/WebP — skipped",
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
      li.textContent = r.message ? `${r.file.name} — ${r.message}` : r.file.name;
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

  convertBtn.addEventListener("click", async () => {
    const work = rows.filter((r) => isSupportedInput(r.file));
    if (!work.length) {
      setStatus("Add at least one PNG, JPG, or WebP file.");
      return;
    }

    convertBtn.disabled = true;
    resultsEl.innerHTML = "";
    const format = selectedFormat();
    const q = qualityValue();
    const fillHex = fillEl.value || "#ffffff";
    const outputs: { name: string; data: Uint8Array }[] = [];

    try {
      for (const r of work) {
        r.status = "working";
        r.message = "Converting…";
        renderList();
        setStatus(`Converting ${r.file.name}…`);
        try {
          const blob = await convertImageFile(r.file, {
            format,
            quality: q,
            fillHex,
          });
          r.out = blob;
          r.outName = outputName(r.file.name, format);
          r.status = "done";
          r.message = `${Math.round(blob.size / 1024)} KB`;
          outputs.push({ name: r.outName, data: await blobToUint8Array(blob) });
        } catch (err) {
          r.status = "error";
          r.message = err instanceof Error ? err.message : "Conversion failed";
        }
        renderList();
      }

      const ok = outputs.length;
      if (!ok) {
        setStatus("No files converted. Check errors above.");
        return;
      }

      const zipBlob = zipNamedFiles(outputs);
      const zipUrl = URL.createObjectURL(zipBlob);

      const box = document.createElement("div");
      box.className = "result-box";
      box.innerHTML = `<p><strong>${ok}</strong> file(s) ready (${format.toUpperCase()}).</p>`;
      const a = document.createElement("a");
      a.className = "btn btn-primary";
      a.href = zipUrl;
      a.download = webpLanding
        ? `webp-to-jpg.zip`
        : `png-to-jpg-${format}.zip`;
      a.id = "zipDownload";
      a.textContent = "Download ZIP";
      box.appendChild(a);

      if (ok === 1) {
        const one = work.find((r) => r.status === "done" && r.out)!;
        const single = document.createElement("a");
        single.className = "btn btn-ghost";
        single.href = URL.createObjectURL(one.out!);
        single.download = one.outName || `converted${format === "jpg" ? ".jpg" : "." + format}`;
        single.id = "singleDownload";
        single.textContent = "Download single file";
        box.appendChild(single);
      }

      const next = document.createElement("p");
      next.className = "lede";
      next.style.marginTop = "1rem";
      next.innerHTML =
        'Need marketplace sizes next? Use the <a href="/tools/marketplace-image-prep">Marketplace Image Resizer</a>. iPhone HEIC? Use <a href="/tools/heic-to-jpg">HEIC to JPG</a>.';
      box.appendChild(next);

      resultsEl.appendChild(box);
      setStatus(`Done — ${ok} converted.`);
    } finally {
      convertBtn.disabled = false;
    }
  });
}
