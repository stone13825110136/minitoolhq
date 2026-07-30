import { evaluateField, truncatePreview } from "../lib/listing-counter/count";
import {
  PLATFORMS,
  isPlatformId,
  type FieldDef,
  type PlatformId,
} from "../lib/listing-counter/limits";

const root = document.querySelector("[data-listing-counter]");
if (root) {
  const platformEl = root.querySelector<HTMLSelectElement>("#platform")!;
  const fieldsHost = root.querySelector<HTMLElement>("#fieldsHost")!;
  const platformBlurb = root.querySelector<HTMLElement>("#platformBlurb")!;
  const clearBtn = root.querySelector<HTMLButtonElement>("#clearBtn")!;

  const values = new Map<string, string>();

  function currentPlatform(): PlatformId {
    const v = platformEl.value;
    return isPlatformId(v) ? v : "amazon";
  }

  function unitLabel(field: FieldDef, result: ReturnType<typeof evaluateField>): string {
    if (field.lineMode === "tags") return "tags";
    return result.kind === "bytes" ? "bytes" : "characters";
  }

  function renderFields() {
    const platform = PLATFORMS[currentPlatform()];
    platformBlurb.textContent = platform.blurb;
    fieldsHost.innerHTML = "";

    for (const field of platform.fields) {
      const wrap = document.createElement("div");
      wrap.className = "counter-field";
      wrap.dataset.fieldId = field.id;

      const label = document.createElement("label");
      label.className = "field";
      const span = document.createElement("span");
      span.textContent = field.label;
      label.appendChild(span);

      const ta = document.createElement("textarea");
      ta.id = `field-${field.id}`;
      ta.rows = field.rows ?? 3;
      ta.placeholder = field.placeholder ?? "";
      ta.value = values.get(`${platform.id}:${field.id}`) ?? "";
      ta.autocomplete = "off";
      ta.spellcheck = true;
      label.appendChild(ta);
      wrap.appendChild(label);

      const meter = document.createElement("div");
      meter.className = "counter-meter";
      meter.setAttribute("aria-live", "polite");
      wrap.appendChild(meter);

      const preview = document.createElement("div");
      preview.className = "counter-preview";
      preview.hidden = true;
      wrap.appendChild(preview);

      fieldsHost.appendChild(wrap);

      const sync = () => {
        values.set(`${platform.id}:${field.id}`, ta.value);
        const result = evaluateField(ta.value, field);
        const unit = unitLabel(field, result);

        if (field.lineMode === "tags") {
          const overLines = (result.tagStats ?? []).filter((t) => t.over);
          const status = result.over ? "over" : "ok";
          meter.className = `counter-meter ${status}`;
          meter.innerHTML = `<strong>${result.tagCount ?? 0}</strong> / ${field.maxLines ?? 13} tags · each ≤ <strong>${field.tagLimit ?? field.limit}</strong> characters`;
          if (overLines.length) {
            meter.innerHTML += ` · <span class="counter-warn">${overLines.length} tag(s) over limit</span>`;
          }
          if (result.softNote) {
            meter.innerHTML += ` · <span class="counter-soft">${result.softNote}</span>`;
          }
          preview.hidden = true;
          return;
        }

        const status = result.over
          ? "over"
          : result.remaining > 0 && result.remaining <= 10
            ? "tight"
            : "ok";
        meter.className = `counter-meter ${status}`;
        const remLabel = result.over
          ? `${Math.abs(result.remaining)} over`
          : `${result.remaining} left`;
        meter.innerHTML = `<strong>${result.used}</strong> / ${field.limit} ${unit} · ${remLabel}`;
        if (result.softNote) {
          meter.innerHTML += ` · <span class="counter-soft">${result.softNote}</span>`;
        }

        if (field.previewChars != null && ta.value.length > 0) {
          const { shown, truncated } = truncatePreview(ta.value, field.previewChars);
          preview.hidden = false;
          preview.innerHTML = `<span class="counter-preview-label">Preview (first ${field.previewChars})</span><p class="counter-preview-text">${escapeHtml(shown)}${truncated ? "…" : ""}</p>`;
        } else {
          preview.hidden = true;
          preview.innerHTML = "";
        }
      };

      ta.addEventListener("input", sync);
      sync();
    }
  }

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyQueryPlatform() {
    const q = new URLSearchParams(location.search).get("platform");
    if (q && isPlatformId(q)) {
      platformEl.value = q;
    }
  }

  platformEl.addEventListener("change", () => {
    const url = new URL(location.href);
    url.searchParams.set("platform", currentPlatform());
    history.replaceState(null, "", url.pathname + url.search);
    renderFields();
  });

  clearBtn.addEventListener("click", () => {
    const platform = currentPlatform();
    for (const field of PLATFORMS[platform].fields) {
      values.delete(`${platform}:${field.id}`);
    }
    renderFields();
  });

  applyQueryPlatform();
  renderFields();
}
