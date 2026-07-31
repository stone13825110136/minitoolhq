# 05 — PNG to JPG Converter (PNG · JPG · WebP)

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/png-to-jpg` |
| Primary keyword | png to jpg |
| Secondary keywords | webp to jpg, jpg to png, convert png to jpg, png to webp, batch image converter |
| SEO gate | **mandatory with ship** — see `.cursor/rules/minitool-seo-keywords.mdc` + SEO expert skill |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client TS; Canvas `toBlob`; `fflate` ZIP |

## Job

> Drop PNG / JPG / WebP images → pick output format (JPG, PNG, or WebP) → batch convert in the browser and download a ZIP, without uploading files.

## Keyword lock (SEO expert §1)

| Field | Value |
|-------|--------|
| Primary | png to jpg |
| Secondary (≥3) | webp to jpg; jpg to png; convert png to jpg; png to webp; batch image converter |
| Title | PNG to JPG Converter — Free Batch (PNG · JPG · WebP) |
| H1 | PNG to JPG Converter |
| Meta description | Free PNG to JPG converter in your browser. Also convert WebP to JPG and JPG to PNG in batch — ZIP download, no upload. |
| FAQ | ≥5 search-shaped (see SEO block) |

**One job = one engine.** Dedicated SEO landing `/tools/webp-to-jpg` (spec 09) reuses this converter for the high-volume `webp to jpg` query (2026-07-31). Keep both pages cross-linked.

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| 2img.com | https://www.2img.com/image-conversion/png-to-jpg | In-browser bulk; many formats; privacy claim; heavy feature surface |
| FreePNGtoJPG | https://freepngtojpg.com/ | Browser-local; often one-at-a-time; ads |
| LocalJPG | https://localjpg.com/webp-to-jpg | Strong privacy / WASM; free single; **ZIP paywall** ($0.50) |
| AnyWebP | https://anywebp.com/ | WebP focus; bidirectional; local claim |
| convert.now | https://convert.now/webp-to-jpg | Browser WASM; privacy messaging |

### Wedge (one line)

**Batch PNG↔JPG↔WebP fully free in-browser (no upload, no ZIP paywall)** + seller next-step into Marketplace Image Resizer / HEIC tool — SERP still full of upload or paid-batch tools.

## Spec accuracy (bidirectional)

**Reviewed:** 2026-07-27  

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Amazon listing formats | Seller Central / Ask Amazon image Q&A: JPEG preferred; also PNG, TIFF, non-animated GIF (reviewed 2026-07-27 via Seller forums + help summaries). **WebP not listed** as listing format. | SERP converters push JPG for “marketplace ready” | Default output **JPG**; WebP→JPG is a first-class path | Do not claim “Amazon requires WebP” |
| Etsy listing photos | Etsy Help / seller guidance: JPG/PNG common (site guides already state JPG/PNG; 2026-07-27) | Competitors output JPG/PNG | JPG or PNG out | Confirm in Etsy Seller Handbook if unsure |
| TikTok Shop | Seller guidance / our guide: JPG/PNG, often ≤5 MB | Same | JPG or PNG out | WebP→JPG for uploads that reject WebP |
| PNG transparency → JPG | JPEG has no alpha (format fact) | 2img / freepngtojpg use solid fill | **White (#FFFFFF) fill** default; user can pick color | Document in UI + FAQ |
| Quality default | Amazon seller practice ~JPEG 85–95 | LocalJPG ~85; HEIC tool uses 92 | **JPG/WebP quality 92%** | Slider 70–98 |
| HEIC input | Separate job (Apple HEIC) | Many mega-converters fold HEIC in | **Reject HEIC**; link `/tools/heic-to-jpg` | Same customer job rule |

**Acceptance:** exported MIME/extension match selected format; transparent→JPG uses chosen fill; E2E checks sample PNG→JPG and WebP→JPG blobs.

## Feature parity

| Feature | 2img | FreePNGtoJPG | LocalJPG | Us v1 |
|---------|:----:|:------------:|:--------:|-------|
| PNG → JPG | ✅ | ✅ | ✅ | **must** |
| WebP → JPG | ✅ | ✅ | ✅ | **must** |
| JPG → PNG | ✅ | ✅ | varies | **must** |
| PNG/JPG → WebP | ✅ | ✅ | varies | **must** |
| Batch multiple files | ✅ | ❌ / weak | limited | **must** (unlimited free) |
| ZIP download | ✅ | varies | **paid** | **must** (free) |
| Quality control (lossy) | ✅ | varies | fixed-ish | **must** |
| Transparency fill for JPG | ✅ | ✅ | ✅ | **must** |
| No account | ✅ | ✅ | ✅ | **must** |
| Files never uploaded | ✅ claim | ✅ claim | ✅ | **must** |
| Seller next-step links | ❌ | ❌ | ❌ | **should** |
| HEIC decode | ✅ some | ✅ some | ✅ some | **won't** (use HEIC tool) |
| AVIF / PDF / TIFF | ✅ some | varies | ❌ | **won't** v1 |
| Resize / crop / watermark | ✅ 2img | ❌ | ❌ | **won't** (other tools) |

## Open-source reuse

| Need | Library | License | Notes |
|------|---------|---------|--------|
| Decode PNG/JPG/WebP | Browser native (`createImageBitmap` / `Image`) | — | No WASM required for v1 |
| Encode JPG/PNG/WebP | Canvas `toBlob` | — | Safari/Chrome/Firefox modern |
| ZIP | `fflate` via generalized zip helper | MIT | Reuse pattern from `amazon-prep/zip.ts` |
| HEIC | — | — | Out of scope; link existing tool |

## Monetization

**Fully free — no batch cap, no Pro CTA, no ZIP unlock.**  
Ads-only model (internal). Soft-sell Marketplace Image Resizer + HEIC converter via RelatedTools.

## Out of scope (v1)

- HEIC / AVIF / GIF animation / PDF / TIFF  
- Server or API conversion  
- Resize, crop, watermark, background removal  
- Fake Pro / paid batch  

## SEO (mandatory — ship with v1)

- **Title:** PNG to JPG Converter - Free Batch (PNG / JPG / WebP)  
- **H1:** PNG to JPG Converter  
- **Meta description:** Free PNG to JPG converter in your browser. Also convert WebP to JPG and JPG to PNG in batch - ZIP download, no upload.  
- **Lede:** primary + secondary phrases naturally  
- **FAQ (≥5) search-shaped:**
  1. How do I convert PNG to JPG?
  2. Can I convert WebP to JPG?
  3. How do I convert JPG to PNG?
  4. Can I batch convert images / download a ZIP?
  5. Are my images uploaded to a server?
  6. What happens to transparent PNG when converting to JPG?
  7. Does Amazon accept WebP product images?
  8. Can I convert HEIC here?

## Acceptance criteria

- [x] Convert ≥2 PNG (or mixed PNG/WebP) files to JPG in one run  
- [x] Output format picker: JPG, PNG, WebP  
- [x] ZIP download of results  
- [x] Quality control affects JPG/WebP size  
- [x] Transparent PNG → JPG uses fill color (default white)  
- [x] Non-supported / HEIC rejected with clear message + HEIC link  
- [x] No file-byte upload (Network)  
- [x] Title + meta include `png to jpg`  
- [x] FAQ ≥5; FAQPage JSON-LD matches all FAQs  
- [x] WebApplication JSON-LD `offers.price: "0"`  
- [x] Homepage Tools card + nav + RelatedTools + sitemap URL  
- [x] E2E `npm run test:png-to-jpg` includes SEO + feature musts  

## Feature parity musts (workflow §6.2)

| Must | E2E case | Result |
|------|----------|--------|
| PNG→JPG | convert fixture PNG → ZIP/JPEG path | **pass** |
| WebP→JPG | convert fixture WebP → image/jpeg | **pass** |
| Batch + ZIP | ≥2 files; ZIP download link | **pass** |
| Quality control | lower quality → smaller JPG | **pass** (20KB→48KB) |
| Never uploaded | no file upload POST | **pass** |
| SEO gate | title/meta/H1/FAQ/JSON-LD | **pass** |

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-27 | `npm run test:png-to-jpg` (21 asserts) | **pass** | Feature + SEO gates |
| 2026-07-27 | `npm run test:site` | **pass** | Includes png-to-jpg page + sitemap |
