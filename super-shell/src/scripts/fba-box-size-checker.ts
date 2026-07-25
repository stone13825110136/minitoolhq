import { checkCarton } from "../lib/fba-box/check";
import {
  FREE_CARTON_LIMIT,
  type CartonInput,
  type Program,
  type UnitSystem,
} from "../lib/fba-box/types";
import { PRO_CHECKOUT_URL, PRO_PRICE_LABEL } from "../lib/amazon-prep/types";

interface RowEls {
  id: string;
  root: HTMLElement;
  length: HTMLInputElement;
  width: HTMLInputElement;
  height: HTMLInputElement;
  weight: HTMLInputElement;
}

function uid(): string {
  return `c-${Math.random().toString(36).slice(2, 9)}`;
}

function proUpgradeHref(): string {
  return PRO_CHECKOUT_URL.trim() || "#pro-upgrade";
}

function init(): void {
  const root = document.querySelector<HTMLElement>("[data-fba-box]");
  if (!root) return;

  const rowsEl = root.querySelector<HTMLElement>("#cartonRows")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;
  const proBanner = root.querySelector<HTMLElement>("#proBanner")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const checkBtn = root.querySelector<HTMLButtonElement>("#checkBtn")!;
  const addBtn = root.querySelector<HTMLButtonElement>("#addCartonBtn")!;
  const programInputs = root.querySelectorAll<HTMLInputElement>('input[name="program"]');
  const unitInputs = root.querySelectorAll<HTMLInputElement>('input[name="units"]');
  const dimSuffixes = root.querySelectorAll<HTMLElement>("[data-dim-unit]");
  const weightSuffixes = root.querySelectorAll<HTMLElement>("[data-weight-unit]");

  const rows: RowEls[] = [];

  function setStatus(msg: string, kind: "" | "error" | "ok" = ""): void {
    statusEl.textContent = msg;
    statusEl.classList.remove("error", "ok");
    if (kind) statusEl.classList.add(kind);
  }

  function readProgram(): Program {
    const checked = root.querySelector<HTMLInputElement>('input[name="program"]:checked');
    return checked?.value === "awd" ? "awd" : "fba";
  }

  function readUnits(): UnitSystem {
    const checked = root.querySelector<HTMLInputElement>('input[name="units"]:checked');
    return checked?.value === "metric" ? "metric" : "imperial";
  }

  function syncUnitLabels(): void {
    const units = readUnits();
    const d = units === "imperial" ? "in" : "cm";
    const w = units === "imperial" ? "lb" : "kg";
    dimSuffixes.forEach((el) => {
      el.textContent = d;
    });
    weightSuffixes.forEach((el) => {
      el.textContent = w;
    });
  }

  function updateProBanner(): void {
    if (rows.length <= FREE_CARTON_LIMIT) {
      proBanner.hidden = true;
      proBanner.innerHTML = "";
      return;
    }
    const waiting = rows.length - FREE_CARTON_LIMIT;
    const href = proUpgradeHref();
    proBanner.hidden = false;
    proBanner.innerHTML = `
      <p class="pro-banner-title">Free plan: first ${FREE_CARTON_LIMIT} cartons only</p>
      <p class="pro-banner-body">
        This check will evaluate the first ${FREE_CARTON_LIMIT} cartons.
        <strong>${waiting}</strong> more will wait.
        Upgrade to Pro for larger multi-carton checks across MiniTool HQ.
      </p>
      <a class="pro-cta" href="${href}">Upgrade to Pro — larger batches · ${PRO_PRICE_LABEL}</a>
    `;
  }

  function addRow(prefill?: Partial<CartonInput>): void {
    const id = uid();
    const wrap = document.createElement("div");
    wrap.className = "carton-row";
    wrap.dataset.id = id;
    wrap.innerHTML = `
      <div class="carton-row-head">
        <strong>Carton</strong>
        <button type="button" class="btn btn-ghost btn-tiny remove-row" ${rows.length === 0 ? "hidden" : ""}>Remove</button>
      </div>
      <div class="grid-4">
        <label class="field">Length <span data-dim-unit>in</span>
          <input class="len" type="number" min="0" step="0.1" value="${prefill?.length ?? ""}" placeholder="e.g. 20" />
        </label>
        <label class="field">Width <span data-dim-unit>in</span>
          <input class="wid" type="number" min="0" step="0.1" value="${prefill?.width ?? ""}" placeholder="e.g. 16" />
        </label>
        <label class="field">Height <span data-dim-unit>in</span>
          <input class="hei" type="number" min="0" step="0.1" value="${prefill?.height ?? ""}" placeholder="e.g. 12" />
        </label>
        <label class="field">Weight <span data-weight-unit>lb</span>
          <input class="wgt" type="number" min="0" step="0.1" value="${prefill?.weight ?? ""}" placeholder="e.g. 28" />
        </label>
      </div>
    `;
    rowsEl.append(wrap);
    const row: RowEls = {
      id,
      root: wrap,
      length: wrap.querySelector(".len")!,
      width: wrap.querySelector(".wid")!,
      height: wrap.querySelector(".hei")!,
      weight: wrap.querySelector(".wgt")!,
    };
    wrap.querySelector(".remove-row")?.addEventListener("click", () => {
      if (rows.length <= 1) return;
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows.splice(idx, 1);
      wrap.remove();
      refreshRemoveButtons();
      updateProBanner();
    });
    rows.push(row);
    syncUnitLabels();
    refreshRemoveButtons();
    updateProBanner();
  }

  function refreshRemoveButtons(): void {
    rows.forEach((r) => {
      const btn = r.root.querySelector<HTMLButtonElement>(".remove-row");
      if (btn) btn.hidden = rows.length <= 1;
    });
  }

  function readCartons(): CartonInput[] | null {
    const out: CartonInput[] = [];
    for (const row of rows) {
      const length = Number(row.length.value);
      const width = Number(row.width.value);
      const height = Number(row.height.value);
      const weight = Number(row.weight.value);
      if (![length, width, height, weight].every((n) => Number.isFinite(n) && n > 0)) {
        setStatus("Enter positive length, width, height, and weight for each carton.", "error");
        return null;
      }
      out.push({ id: row.id, length, width, height, weight });
    }
    return out;
  }

  function runCheck(): void {
    const all = readCartons();
    if (!all) return;
    const program = readProgram();
    const units = readUnits();
    const batch = all.slice(0, FREE_CARTON_LIMIT);
    const waiting = all.length - batch.length;

    resultsEl.innerHTML = "";
    for (const carton of batch) {
      const result = checkCarton(carton, program, units);
      const card = document.createElement("article");
      card.className = `result-card ${result.pass ? "pass" : "fail"}`;
      const unitDim = units === "imperial" ? "in" : "cm";
      const unitW = units === "imperial" ? "lb" : "kg";
      const sorted = `${round(result.sortedDisplay.length)} × ${round(result.sortedDisplay.width)} × ${round(result.sortedDisplay.height)} ${unitDim}`;
      const failHtml = result.failures.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      const warnHtml = result.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
      const noteHtml = result.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      card.innerHTML = `
        <header>
          <span class="badge-result">${result.pass ? "Pass" : "Fail"}</span>
          <span class="muted">${program.toUpperCase()} · sorted ${escapeHtml(sorted)} · ${round(result.weightDisplay)} ${unitW}</span>
        </header>
        ${
          result.failures.length
            ? `<div><strong>Failed rules</strong><ul>${failHtml}</ul></div>`
            : `<p class="ok-line">Within standard ${program.toUpperCase()} carton limits for the values entered.</p>`
        }
        ${result.warnings.length ? `<div><strong>Warnings</strong><ul>${warnHtml}</ul></div>` : ""}
        ${result.notes.length ? `<div><strong>Notes</strong><ul>${noteHtml}</ul></div>` : ""}
      `;
      resultsEl.append(card);
    }

    if (waiting > 0) {
      setStatus(
        `Checked ${batch.length} carton(s) (free limit). ${waiting} still waiting — Upgrade to Pro for larger batches.`,
        "ok",
      );
    } else {
      const fails = batch.filter((c) => !checkCarton(c, program, units).pass).length;
      setStatus(
        fails
          ? `Done — ${batch.length} checked, ${fails} failed.`
          : `Done — ${batch.length} carton(s) passed standard limits.`,
        fails ? "error" : "ok",
      );
    }
  }

  function round(n: number): string {
    return (Math.round(n * 100) / 100).toString();
  }

  addBtn.addEventListener("click", () => addRow());
  checkBtn.addEventListener("click", runCheck);
  programInputs.forEach((el) => el.addEventListener("change", () => setStatus("Program updated — run Check again.")));
  unitInputs.forEach((el) =>
    el.addEventListener("change", () => {
      syncUnitLabels();
      setStatus("Units updated — values are not auto-converted; re-enter if needed.");
    }),
  );

  addRow({ length: 20, width: 16, height: 12, weight: 28 });
  syncUnitLabels();
  setStatus("Enter carton size and weight, then Check. Nothing is uploaded.");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

init();
