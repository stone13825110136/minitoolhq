import { checkAwdUnit, checkCarton, fromImperialDims, fromImperialWeight } from "../lib/fba-box/check";
import { buildResultsCsv, parseCartonCsv } from "../lib/fba-box/csv";
import { dimWeightRef } from "../lib/fba-box/dim";
import {
  LB_TO_KG,
  type CartonInput,
  type Program,
  type UnitSystem,
} from "../lib/fba-box/types";

interface RowEls {
  id: string;
  root: HTMLElement;
  length: HTMLInputElement;
  width: HTMLInputElement;
  height: HTMLInputElement;
  weight: HTMLInputElement;
}

interface ExportRow {
  carton: number | string;
  pass: boolean;
  program: string;
  sorted_l: number;
  sorted_w: number;
  sorted_h: number;
  weight: number;
  dim_weight: number | "";
  billable_ref: number | "";
  dim_divisor: number | "";
  failures: string;
  units: string;
}

function uid(): string {
  return `c-${Math.random().toString(36).slice(2, 9)}`;
}

function init(): void {
  const root = document.querySelector<HTMLElement>("[data-fba-box]");
  if (!root) return;

  const rowsEl = root.querySelector<HTMLElement>("#cartonRows")!;
  const resultsEl = root.querySelector<HTMLElement>("#results")!;
  const statusEl = root.querySelector<HTMLElement>("#status")!;
  const checkBtn = root.querySelector<HTMLButtonElement>("#checkBtn")!;
  const addBtn = root.querySelector<HTMLButtonElement>("#addCartonBtn")!;
  const importBtn = root.querySelector<HTMLButtonElement>("#importCsvBtn")!;
  const csvInput = root.querySelector<HTMLInputElement>("#csvFileInput")!;
  const exportBtn = root.querySelector<HTMLButtonElement>("#exportCsvBtn")!;
  const awdUnitPanel = root.querySelector<HTMLElement>("#awdUnitPanel")!;
  const unitLen = root.querySelector<HTMLInputElement>("#unitLen")!;
  const unitWid = root.querySelector<HTMLInputElement>("#unitWid")!;
  const unitHei = root.querySelector<HTMLInputElement>("#unitHei")!;
  const unitWgt = root.querySelector<HTMLInputElement>("#unitWgt")!;
  const programInputs = root.querySelectorAll<HTMLInputElement>('input[name="program"]');
  const unitInputs = root.querySelectorAll<HTMLInputElement>('input[name="units"]');

  const rows: RowEls[] = [];
  let lastExport: ExportRow[] = [];

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
    root.querySelectorAll<HTMLElement>("[data-dim-unit]").forEach((el) => {
      el.textContent = d;
    });
    root.querySelectorAll<HTMLElement>("[data-weight-unit]").forEach((el) => {
      el.textContent = w;
    });
  }

  function syncProgramUi(): void {
    const program = readProgram();
    awdUnitPanel.hidden = program !== "awd";
  }

  function clearRows(): void {
    rows.length = 0;
    rowsEl.innerHTML = "";
  }

  function addRow(prefill?: Partial<CartonInput>): void {
    const id = uid();
    const wrap = document.createElement("div");
    wrap.className = "carton-row";
    wrap.dataset.id = id;
    const n = rows.length + 1;
    wrap.innerHTML = `
      <div class="carton-row-head">
        <strong>Carton ${n}</strong>
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
      renumberRows();
      refreshRemoveButtons();
    });
    rows.push(row);
    syncUnitLabels();
    refreshRemoveButtons();
  }

  function renumberRows(): void {
    rows.forEach((r, i) => {
      const strong = r.root.querySelector("strong");
      if (strong) strong.textContent = `Carton ${i + 1}`;
    });
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

  /** Returns null if incomplete (error already set), undefined if skipped (all empty). */
  function readUnitOptional():
    | { length: number; width: number; height: number; weight: number }
    | null
    | undefined {
    const raw = [unitLen.value, unitWid.value, unitHei.value, unitWgt.value];
    const any = raw.some((v) => v.trim() !== "");
    if (!any) return undefined;
    const length = Number(unitLen.value);
    const width = Number(unitWid.value);
    const height = Number(unitHei.value);
    const weight = Number(unitWgt.value);
    if (![length, width, height, weight].every((n) => Number.isFinite(n) && n > 0)) {
      setStatus("AWD unit check: enter all four unit fields, or leave them blank to skip.", "error");
      return null;
    }
    return { length, width, height, weight };
  }

  function appendResultCard(html: string, pass: boolean): void {
    const card = document.createElement("article");
    card.className = `result-card ${pass ? "pass" : "fail"}`;
    card.innerHTML = html;
    resultsEl.append(card);
  }

  function runCheck(): void {
    const all = readCartons();
    if (!all) return;
    const program = readProgram();
    const units = readUnits();
    const unitInput = program === "awd" ? readUnitOptional() : undefined;
    if (unitInput === null) return;

    resultsEl.innerHTML = "";
    lastExport = [];
    let fails = 0;
    const unitDim = units === "imperial" ? "in" : "cm";
    const unitW = units === "imperial" ? "lb" : "kg";

    all.forEach((carton, index) => {
      const result = checkCarton(carton, program, units);
      if (!result.pass) fails += 1;
      const weightLb =
        units === "imperial" ? result.weightDisplay : result.weightDisplay / LB_TO_KG;
      const dimRef = dimWeightRef(result.sorted, weightLb, units);
      const sorted = `${round(result.sortedDisplay.length)} × ${round(result.sortedDisplay.width)} × ${round(result.sortedDisplay.height)} ${unitDim}`;
      const failHtml = result.failures.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      const warnHtml = result.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("");
      const noteHtml = result.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      appendResultCard(
        `
        <header>
          <span class="badge-result">${result.pass ? "Pass" : "Fail"}</span>
          <span class="muted">${program.toUpperCase()} carton ${index + 1} · sorted ${escapeHtml(sorted)} · ${round(result.weightDisplay)} ${unitW}</span>
        </header>
        ${
          result.failures.length
            ? `<div><strong>Failed rules</strong><ul>${failHtml}</ul></div>`
            : `<p class="ok-line">Within standard ${program.toUpperCase()} carton limits for the values entered.</p>`
        }
        <div class="dim-ref">
          <strong>DIM reference (not a fee quote)</strong>
          <ul>
            <li>Dimensional weight ≈ ${round(dimRef.dimDisplay)} ${unitW} — (L×W×H in inches) ÷ ${dimRef.divisor}</li>
            <li>Planning billable weight ≈ ${round(dimRef.billableRefDisplay)} ${unitW} — greater of actual vs DIM</li>
            <li>Inbound Pass/Fail above does not use DIM. Confirm fee rules in Seller Central. See <a href="/guides/amazon-dimensional-weight">Amazon dimensional weight</a>.</li>
          </ul>
        </div>
        ${result.warnings.length ? `<div><strong>Warnings</strong><ul>${warnHtml}</ul></div>` : ""}
        ${result.notes.length ? `<div><strong>Notes</strong><ul>${noteHtml}</ul></div>` : ""}
      `,
        result.pass,
      );

      lastExport.push({
        carton: index + 1,
        pass: result.pass,
        program: program.toUpperCase(),
        sorted_l: roundNum(result.sortedDisplay.length),
        sorted_w: roundNum(result.sortedDisplay.width),
        sorted_h: roundNum(result.sortedDisplay.height),
        weight: roundNum(result.weightDisplay),
        dim_weight: roundNum(dimRef.dimDisplay),
        billable_ref: roundNum(dimRef.billableRefDisplay),
        dim_divisor: dimRef.divisor,
        failures: result.failures.join("; "),
        units: `${unitDim}/${unitW}`,
      });
    });

    if (unitInput) {
      const unitResult = checkAwdUnit(unitInput, units);
      if (!unitResult.pass) fails += 1;
      const disp = fromImperialDims(unitResult.sorted, units);
      const sorted = `${round(disp.length)} × ${round(disp.width)} × ${round(disp.height)} ${unitDim}`;
      const failHtml = unitResult.failures.map((f) => `<li>${escapeHtml(f)}</li>`).join("");
      const noteHtml = unitResult.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join("");
      const weightDisp = fromImperialWeight(unitResult.weightLb, units);
      appendResultCard(
        `
        <header>
          <span class="badge-result">${unitResult.pass ? "Pass" : "Fail"}</span>
          <span class="muted">AWD unit (SKU) · sorted ${escapeHtml(sorted)} · ${round(weightDisp)} ${unitW}</span>
        </header>
        ${
          unitResult.failures.length
            ? `<div><strong>Failed rules</strong><ul>${failHtml}</ul></div>`
            : `<p class="ok-line">Within published AWD sortable unit thresholds for the values entered.</p>`
        }
        ${unitResult.notes.length ? `<div><strong>Notes</strong><ul>${noteHtml}</ul></div>` : ""}
      `,
        unitResult.pass,
      );
      lastExport.push({
        carton: "AWD-unit",
        pass: unitResult.pass,
        program: "AWD-UNIT",
        sorted_l: roundNum(disp.length),
        sorted_w: roundNum(disp.width),
        sorted_h: roundNum(disp.height),
        weight: roundNum(weightDisp),
        dim_weight: "",
        billable_ref: "",
        dim_divisor: "",
        failures: unitResult.failures.join("; "),
        units: `${unitDim}/${unitW}`,
      });
    }

    exportBtn.disabled = lastExport.length === 0;
    setStatus(
      fails
        ? `Done — ${all.length} carton(s) checked${unitInput ? " + unit check" : ""}, ${fails} failed.`
        : `Done — ${all.length} carton(s) passed standard limits${unitInput ? "; unit check passed" : ""}.`,
      fails ? "error" : "ok",
    );
  }

  function importCsvFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCartonCsv(text);
      if (parsed.rows.length === 0) {
        setStatus(parsed.errors[0] || "No valid carton rows in CSV.", "error");
        return;
      }
      clearRows();
      for (const row of parsed.rows) {
        addRow(row);
      }
      resultsEl.innerHTML = "";
      lastExport = [];
      exportBtn.disabled = true;
      const warn =
        parsed.errors.length > 0 ? ` (${parsed.errors.length} line(s) skipped)` : "";
      setStatus(
        `Imported ${parsed.rows.length} carton(s) from CSV${warn}. Values use the selected units (in/lb or cm/kg) — nothing uploaded. Run Check.`,
        parsed.errors.length ? "error" : "ok",
      );
    };
    reader.onerror = () => setStatus("Could not read CSV file.", "error");
    reader.readAsText(file);
  }

  function exportResults(): void {
    if (lastExport.length === 0) {
      setStatus("Run Check before exporting results.", "error");
      return;
    }
    const csv = buildResultsCsv(lastExport as unknown as Array<Record<string, string | number | boolean>>);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fba-box-check-results.csv";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Results CSV downloaded locally — nothing was uploaded.", "ok");
  }

  function round(n: number): string {
    return (Math.round(n * 100) / 100).toString();
  }

  function roundNum(n: number): number {
    return Math.round(n * 100) / 100;
  }

  addBtn.addEventListener("click", () => addRow());
  checkBtn.addEventListener("click", runCheck);
  importBtn.addEventListener("click", () => csvInput.click());
  exportBtn.addEventListener("click", exportResults);
  csvInput.addEventListener("change", () => {
    const file = csvInput.files?.[0];
    csvInput.value = "";
    if (file) importCsvFile(file);
  });
  programInputs.forEach((el) =>
    el.addEventListener("change", () => {
      syncProgramUi();
      setStatus("Program updated — run Check again.");
    }),
  );
  unitInputs.forEach((el) =>
    el.addEventListener("change", () => {
      syncUnitLabels();
      setStatus("Units updated — values are not auto-converted; re-enter or re-import if needed.");
    }),
  );

  addRow({ length: 20, width: 16, height: 12, weight: 28 });
  syncUnitLabels();
  syncProgramUi();
  exportBtn.disabled = true;
  setStatus("Enter carton size and weight, or Import CSV — then Check. Nothing is uploaded.");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

init();
