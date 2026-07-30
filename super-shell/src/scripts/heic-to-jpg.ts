import { isHeicFile, heicToJpegBlob } from "../lib/amazon-prep/heic";
import { blobToUint8Array, zipJpegFiles } from "../lib/amazon-prep/zip";

type Row = {
  file: File;
  status: "queued" | "working" | "done" | "error";
  message?: string;
  jpg?: Blob;
  outName?: string;
};

const root = document.querySelector("[data-heic-jpg]");
if (!root) {
  // page not mounted
} else {
  const fileInput = root.querySelector<HTMLInputElement>("#heicFiles")!;
  const dropZone = root.querySelector<HTMLElement>("#dropZone")!;
  const qualityEl = root.querySelector<HTMLInputElement>("#quality")!;
  const qualityLabel = root.querySelector<HTMLElement>("#qualityLabel")!;
  const stripExifEl = root.querySelector<HTMLInputElement>("#stripExif")!;
  const convertBtn = root.querySelector<HTMLButtonElement>("#convertBtn")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const listEl = root.querySelector<HTMLElement>("#fileList")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;

  let rows: Row[] = [];

  function setStatus(msg: string) {
    statusEl.textContent = msg;
  }

  function qualityValue(): number {
    const n = Number(qualityEl.value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0.5, n / 100)) : 0.92;
  }

  function syncQualityLabel() {
    qualityLabel.textContent = `${qualityEl.value}%`;
  }

  qualityEl.addEventListener("input", syncQualityLabel);
  syncQualityLabel();

  function addFiles(fileList: FileList | File[]) {
    const incoming = [...fileList];
    for (const file of incoming) {
      if (!isHeicFile(file)) {
        rows.push({
          file,
          status: "error",
          message: "Not HEIC/HEIF — skipped",
        });
        continue;
      }
      rows.push({ file, status: "queued" });
    }
    renderList();
    const ok = rows.filter((r) => r.status !== "error" || isHeicFile(r.file)).length;
    setStatus(
      rows.length
        ? `${rows.filter((r) => isHeicFile(r.file)).length} HEIC file(s) ready. Non-HEIC files are skipped.`
        : "",
    );
    void ok;
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
      const label = r.message ? `${r.file.name} — ${r.message}` : r.file.name;
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

  /** Canvas re-encode applies quality and drops EXIF from the intermediate JPEG. */
  async function jpegWithOptions(blob: Blob, quality: number): Promise<Blob> {
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadImage(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(img, 0, 0);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))),
          "image/jpeg",
          quality,
        );
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not decode converted image"));
      img.src = url;
    });
  }

  function baseJpgName(name: string): string {
    return name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  }

  convertBtn.addEventListener("click", async () => {
    const work = rows.filter((r) => isHeicFile(r.file));
    if (!work.length) {
      setStatus("Add at least one HEIC or HEIF file.");
      return;
    }

    convertBtn.disabled = true;
    resultsEl.innerHTML = "";
    const q = qualityValue();
    // Checkbox reserved for UX honesty: canvas path always strips EXIF when re-encoding
    void stripExifEl.checked;
    const outputs: { name: string; data: Uint8Array }[] = [];

    try {
      for (const r of work) {
        r.status = "working";
        r.message = "Converting…";
        renderList();
        setStatus(`Converting ${r.file.name}…`);
        try {
          const raw = await heicToJpegBlob(r.file);
          const jpg = await jpegWithOptions(raw, q);
          r.jpg = jpg;
          r.outName = baseJpgName(r.file.name);
          r.status = "done";
          r.message = `${Math.round(jpg.size / 1024)} KB`;
          outputs.push({ name: r.outName, data: await blobToUint8Array(jpg) });
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

      const zipBlob = zipJpegFiles(outputs);
      const zipUrl = URL.createObjectURL(zipBlob);

      resultsEl.innerHTML = "";
      const box = document.createElement("div");
      box.className = "result-box";
      box.innerHTML = `<p><strong>${ok}</strong> JPG file(s) ready.</p>`;
      const a = document.createElement("a");
      a.className = "btn btn-primary";
      a.href = zipUrl;
      a.download = "heic-to-jpg.zip";
      a.textContent = "Download ZIP";
      box.appendChild(a);

      if (ok === 1 && work.find((r) => r.status === "done" && r.jpg)) {
        const one = work.find((r) => r.status === "done" && r.jpg)!;
        const single = document.createElement("a");
        single.className = "btn btn-ghost";
        single.href = URL.createObjectURL(one.jpg!);
        single.download = one.outName || "converted.jpg";
        single.textContent = "Download single JPG";
        box.appendChild(single);
      }

      const next = document.createElement("p");
      next.className = "lede";
      next.style.marginTop = "1rem";
      next.innerHTML =
        'Need Amazon / TikTok / Etsy sizes next? Use the <a href="/tools/marketplace-image-prep">Marketplace Image Resizer</a> — still no upload.';
      box.appendChild(next);

      resultsEl.appendChild(box);
      setStatus(`Done — ${ok} converted.`);
    } finally {
      convertBtn.disabled = false;
    }
  });
}
