# Tool Roadmap

Process: [TOOL-DEV-WORKFLOW.md](./TOOL-DEV-WORKFLOW.md)  
Rules: `.cursor/rules/minitool-dev-workflow.mdc`

## Model

1. Free web tool, no signup  
2. In-browser / local processing  
3. **Only monetization: ads**  
4. **Every tool fully free** — no Pro / no $4.99 / no batch paywall  
5. SEO page per tool  
6. Ship one → add continuously  

See [POSITIONING.md](./POSITIONING.md).

## Brand split

Full boundary: [BRAND-BOUNDARY.md](./BRAND-BOUNDARY.md).

| On **minitoolhq.com** | On **hotpicklab.com** (not here) |
|-----------------------|----------------------------------|
| Seller/creator utilities | Naming Lab: pet → people → business |
| Compress / convert / HEIC / image prep / box size | Fortune Draw (entertainment tarot) + Hot Pick |

## Scope reserved for MiniTool HQ (do not put on HotPickLab or other sites)

| Area | Examples |
|------|----------|
| **Compress** | Batch image compressor, target file size |
| **Format convert** | WebP/PNG/JPG convert, image → common web formats |
| **HEIC** | HEIC / HEIF → JPG (and related phone-photo convert) |

These are high-search utilities that fit sellers/creators and the existing canvas pipeline. Keep them on **minitoolhq.com** only.

## Build queue

**Traffic = ads.** Priority research: [TRAFFIC-PRIORITY.md](./TRAFFIC-PRIORITY.md) (2026-07-26).  
**Portfolio cap (locked 2026-07-26):** Phase 1 = **8–12** tools; mature = **16–20**; **do not grow past 20**.

### Phase 1 target (~8–10 solid tools)

| Slot | Tool | Status |
|------|------|--------|
| 1 | Marketplace Image Prep | **shipped** |
| 2 | FBA Box Size Checker | **shipped** |
| 3 | HEIC → JPG | **shipped** |
| 4 | **Format convert** (PNG↔JPG, WebP…) | **shipped** — `/tools/png-to-jpg` + SEO landing `/tools/webp-to-jpg` |
| 5 | Batch image compressor | **shipped** — `/tools/image-compressor` |
| 6 | Listing character counter (Amazon/Etsy title·bullet) | **shipped** — `/tools/listing-character-counter` |
| 7 | Inch ↔ cm converter (FBA / carton mutual links) | deferred (FBA tool already has units) |
| 8–10 | Batch watermark **or** other high-traffic utility (research first) | optional Phase 1 |
| — | ~~Batch rename~~ | **cancelled** — low traffic vs HEIC/convert |
| — | Simple QR generator | **Phase 2+** — weak seller loop |
| — | SEO guides cluster | **shipped** `/guides/*` — keep deepening in parallel |

### Detailed status

| # | Tool | Spec | Status |
|---|------|------|--------|
| 1 | Marketplace Image Prep (Amazon / TikTok / Etsy / …) | [specs/03-marketplace-image-prep.md](./specs/03-marketplace-image-prep.md) | **shipped (v1)** — multi-select ZIP |
| 2 | FBA / marketplace box size checker | [specs/02-fba-box-size-checker.md](./specs/02-fba-box-size-checker.md) | **shipped (v1)** + fully free |
| — | **SEO deep-dive on #1–#2** (requirements guides + long-tails) | — | **ongoing** (fastest traffic) |
| 3 | ~~TikTok Shop only~~ | — | **cancelled** — merged into #1 |
| 4 | ~~Amazon Image Prep only~~ | [specs/01-amazon-image-prep.md](./specs/01-amazon-image-prep.md) | **merged into #1** (URL redirects) |
| 5 | **HEIC → JPG** (batch, in-browser) | [specs/04-heic-to-jpg.md](./specs/04-heic-to-jpg.md) | **shipped (v1)** — fully free |
| — | **SEO guides** (Amazon/Etsy/TikTok image + FBA/DIM) | [SEO-GUIDE-CLUSTER.md](./SEO-GUIDE-CLUSTER.md) | **shipped** `/guides/*` |
| 6 | **Format convert** (PNG↔JPG, WebP…) | [specs/05-format-convert.md](./specs/05-format-convert.md) · [09-webp-to-jpg.md](./specs/09-webp-to-jpg.md) | **shipped** — `/tools/png-to-jpg` + `/tools/webp-to-jpg` |
| — | **Background remover → white bg** (product/main images) | [specs/10-background-remover.md](./specs/10-background-remover.md) | **shipped** — `/tools/background-remover` |
| 7 | **Batch image compressor** | [specs/06-image-compressor.md](./specs/06-image-compressor.md) | **shipped (v1)** — `/tools/image-compressor` |
| 8 | Listing character counter | [specs/07-listing-character-counter.md](./specs/07-listing-character-counter.md) | **shipped (v1)** — 75/125 + Etsy/TikTok |
| 9 | Inch / cm converter | — | **deferred** (thin carton page later if needed) |
| 10 | Batch watermark / high-traffic utility | — | research first; no low-traffic fillers |
| — | Batch rename | — | **cancelled** (low traffic) |
| 11 | Strip EXIF (standalone) | — | later (or keep inside prep) |
| 12 | UTM / campaign link builder | — | later |
| — | QR generator | — | **not Phase 1** |

Order follows **achievable organic + ad potential**, then seller loop (photo → convert → compress → size → list).

## Narrative

> Private browser tools for creators & sellers.

## Platforms (later)

| Platform | When |
|----------|------|
| AdSense / display ads | After pages indexed + enough traffic for approval |
| Cloudflare Pages | Live |
| Chrome Web Store | After 1–2 tools proven |
| Submit-a-tool directory | After traffic exists |

**Not planned:** Gumroad / Lemon Squeezy / Pro membership for MiniTool HQ tools.

## Do not build yet

- Heavy AI wrappers  
- Full PDF suite vs iLovePDF  
- PWA install prompts  
- Third-party tool marketplace hosting  
- Shopping price-history / cross-store compare (needs data APIs)  
- **Naming / pet names / baby names / business name generators / tarot fortune UI** — owned by HotPickLab only  

## Related HotPickLab docs (other repo — do not duplicate product here)

- `D:\国外网站挣钱\hotpicklab\docs\NAMING-LAB-PLAN.md`  
- `D:\国外网站挣钱\hotpicklab\docs\DATA-SOURCES.md`  

