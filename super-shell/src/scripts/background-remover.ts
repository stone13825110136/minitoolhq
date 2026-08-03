import {
  isHeicLike,
  isSupportedBgInput,
  removeBackgroundFile,
  resetSegmenter,
  type BgOutputMode,
} from "../lib/background-remover/remove";
import { blobToUint8Array, zipNamedFiles } from "../lib/amazon-prep/zip";

type Row = {
  file: File;
  status: "queued" | "working" | "done" | "error";
  message?: string;
  out?: Blob;
  outName?: string;
};

const root = document.querySelector("[data-bg-remover]");
if (root) {
  const fileInput = root.querySelector<HTMLInputElement>("#bgFiles")!;
  const dropZone = root.querySelector<HTMLElement>("#dropZone")!;
  const modeEl = root.querySelector<HTMLSelectElement>("#outMode")!;
  const qualityEl = root.querySelector<HTMLInputElement>("#quality")!;
  const qualityLabel = root.querySelector<HTMLElement>("#qualityLabel")!;
  const qualityField = root.querySelector<HTMLElement>("#qualityField")!;
  const runBtn = root.querySelector<HTMLButtonElement>("#runBtn")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const listEl = root.querySelector<HTMLElement>("#fileList")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;
  const progressEl = root.querySelector<HTMLElement>("#modelProgress");

  let rows: Row[] = [];

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function setProgress(msg: string) {
    if (progressEl) progressEl.textContent = msg;
  }

  function selectedMode(): BgOutputMode {
    return modeEl.value === "png" ? "png" : "white-jpg";
  }

  function qualityValue(): number {
    const n = Number(qualityEl.value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0.7, n / 100)) : 0.92;
  }

  function syncUi() {
    qualityField.hidden = selectedMode() !== "white-jpg";
    qualityLabel.textContent = `${qualityEl.value}%`;
    runBtn.textContent =
      selectedMode() === "png" ? "Remove background (PNG)" : "Remove background (white JPG)";
  }

  qualityEl.addEventListener("input", syncUi);
  modeEl.addEventListener("change", syncUi);
  syncUi();

  function addFiles(fileList: FileList | File[]) {
    for (const file of fileList) {
      if (isHeicLike(file)) {
        rows.push({
          file,
          status: "error",
          message: "HEIC/HEIF — use HEIC to JPG first",
        });
        continue;
      }
      if (!isSupportedBgInput(file)) {
        rows.push({
          file,
          status: "error",
          message: "Not JPG/PNG/WebP — skipped",
        });
        continue;
      }
      rows.push({ file, status: "queued" });
    }
    renderList();
    const n = rows.filter((r) => isSupportedBgInput(r.file)).length;
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
  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
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
    setProgress("");
    resetSegmenter();
  });

  runBtn.addEventListener("click", async () => {
    const work = rows.filter((r) => isSupportedBgInput(r.file));
    if (!work.length) {
      setStatus("Add at least one JPG, PNG, or WebP file.");
      return;
    }

    runBtn.disabled = true;
    resultsEl.innerHTML = "";
    const mode = selectedMode();
    const q = qualityValue();
    const outputs: { name: string; data: Uint8Array }[] = [];

    try {
      for (const r of work) {
        r.status = "working";
        r.message = "Working…";
        renderList();
        try {
          const { blob, outName } = await removeBackgroundFile(r.file, {
            mode,
            quality: q,
            onStatus: (msg) => {
              r.message = msg;
              setStatus(`${r.file.name}: ${msg}`);
              renderList();
            },
            onProgress: (info) => {
              if (info.status === "progress" && info.file && info.progress != null) {
                setProgress(`Downloading model: ${info.file} (${Math.round(info.progress)}%)`);
              } else if (info.status === "done") {
                setProgress("Model ready.");
              }
            },
          });
          r.status = "done";
          r.message = "Done";
          r.out = blob;
          r.outName = outName;
          outputs.push({ name: outName, data: await blobToUint8Array(blob) });
        } catch (err) {
          resetSegmenter();
          r.status = "error";
          const raw = err instanceof Error ? err.message : String(err);
          r.message = /network|fetch|failed to fetch|load/i.test(raw)
            ? "Network error downloading AI model — Clear and retry (no VPN needed; we auto-try a mirror)"
            : raw;
        }
        renderList();
      }

      if (!outputs.length) {
        setStatus("No images converted. Check errors above.");
        return;
      }

      const zip = zipNamedFiles(outputs);
      const url = URL.createObjectURL(zip);
      resultsEl.innerHTML = "";
      const a = document.createElement("a");
      a.id = "zipDownload";
      a.className = "btn btn-primary";
      a.href = url;
      a.download = "background-remover.zip";
      a.textContent = "Download ZIP";
      resultsEl.appendChild(a);

      const tip = document.createElement("p");
      tip.className = "lede";
      tip.style.marginTop = "0.75rem";
      tip.innerHTML =
        'Next: size to marketplace squares with the <a href="/tools/marketplace-image-prep">Marketplace Image Resizer</a>.';
      resultsEl.appendChild(tip);

      setStatus(`Done — ${outputs.length} file(s).`);
      setProgress("");
    } finally {
      runBtn.disabled = false;
    }
  });
}
