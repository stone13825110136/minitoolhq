# 06 — Batch Image Compressor

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/image-compressor` |
| Primary keyword | image compressor |
| Secondary keywords | batch image compressor, compress image without uploading, compress to 100kb, compress for amazon listing |
| SEO gate | **mandatory with ship** — see `.cursor/rules/minitool-seo-keywords.mdc` + SEO expert skill |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client TS; Canvas `toBlob` quality binary-search; `fflate` ZIP |

## Job

> Drop JPG / PNG / WebP images → shrink file size in the browser (quality and/or target KB) → batch ZIP download, without uploading files.

## Keyword lock (SEO expert §1)

| Field | Value |
|-------|--------|
| Primary | image compressor |
| Secondary (≥3) | batch image compressor; compress image without uploading; compress to 100kb; compress for amazon listing |
| Title | Image Compressor - Free Batch Compress (No Upload) |
| H1 | Image Compressor |
| Meta description | Free image compressor in your browser. Batch compress images without uploading, target size (e.g. 100KB), ZIP download - no signup. |
| FAQ | ≥5 search-shaped (see SEO block) |

**One job = one tool:** compress file size only. Do **not** duplicate Marketplace Image Prep resize/white-pad as a second compressor tool. Cover Amazon listing long-tails via FAQ + presets + RelatedTools.

**SERP strategy (internal):** Do not hard-fight TinyPNG brand SERP; win on **no upload + batch + target KB + seller next-step** (see `TRAFFIC-PRIORITY.md`).

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| TinyPNG | https://tinypng.com/ | Head-term leader; **upload**; free batch capped |
| Compresso | https://compresso.io/bulk-compress | In-browser bulk; quality; ZIP; privacy claim |
| PixelBatch | https://pixelbatch.io/ | Local WASM; resize+compress; seller angle |
| UtiloKit | https://utilokit.com/tools/image-compressor | Canvas bulk; target size; no upload |
| ImageCompressr | https://imagecompressr.com/ | Bulk; target KB; local claim |

### Wedge (one line)

**Fully free batch image compressor in-browser (no upload, no TinyPNG-style batch cap)** + target KB + seller CTA into Marketplace Image Resizer / format tools.

## Spec accuracy (bidirectional)

**Reviewed:** 2026-07-28  

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Amazon max file size | Seller Central: images typically up to **~10 MB** (Ask Amazon / image requirements summaries, reviewed 2026-07-28) | PixelBatch / guides cite 10 MB; practical 800KB–2MB | Do **not** claim “Amazon requires 100KB”. Offer **target KB presets** including 100 / 500 / 1024 as user goals | 100KB = optional user target (email/web), not Amazon rule |
| Amazon preferred format | JPEG preferred; PNG/TIFF/GIF also accepted | Competitors output JPEG for listing compress | Default re-encode **JPG** for max shrink; keep PNG/WebP optional | Link size guide for px rules |
| TikTok Shop size | Often JPG/PNG, commonly **~5 MB** cap (seller guidance / our guide) | Same | Target presets help stay under 5 MB | Confirm Seller Center |
| Etsy photos | JPG/PNG common | Same | JPG default out | |
| Quality default | Seller practice ~85–90% JPEG for listings | Compresso/UtiloKit quality sliders | **Quality mode default 85%**; target-KB mode binary-searches quality | Document both modes |
| Dimensions | Amazon zoom needs px count, not file KB | PixelBatch often resizes | **v1 does not resize** (Marketplace Prep job) | FAQ: compress ≠ resize |

**Acceptance:** E2E proves output smaller than input (or at quality floor); target-KB mode gets file ≤ target when possible; no upload POST; HEIC rejected with link.

## Feature parity

| Feature | TinyPNG | Compresso | UtiloKit | Us v1 |
|---------|:-------:|:---------:|:--------:|-------|
| Compress JPG/PNG | ✅ | ✅ | ✅ | **must** |
| WebP in/out | varies | ✅ | ✅ | **must** (in; out JPG/PNG/WebP) |
| Batch multiple | ✅ capped | ✅ | ✅ | **must** (unlimited free) |
| ZIP download | ✅ | ✅ | ✅ | **must** |
| Quality control | auto | ✅ | ✅ | **must** |
| Target max file size (KB) | paid/advanced | varies | ✅ | **must** |
| No account | ✅ | ✅ | ✅ | **must** |
| Files never uploaded | ❌ | ✅ claim | ✅ | **must** |
| Before/after size | ✅ | ✅ | ✅ | **must** |
| Seller next-step links | ❌ | ❌ | ❌ | **should** |
| Resize / crop | ❌ / other | ❌ | varies | **won't** (Marketplace Prep) |
| HEIC | ❌ / other | varies | varies | **won't** (HEIC tool) |
| AVIF | ❌ | varies | ✅ | **won't** v1 |
| Watermark / AI | ❌ | ❌ | ❌ | **won't** |

## Open-source reuse

| Need | Library | License | Notes |
|------|---------|---------|--------|
| Decode/encode | Canvas `drawImage` + `toBlob` | — | Same stack as format convert |
| Target KB | Binary search on JPEG/WebP quality | — | Pattern noted in amazon-prep compress approach |
| ZIP | `fflate` via `zipNamedFiles` | MIT | Reuse `amazon-prep/zip.ts` |
| Optional npm | `browser-image-compression` | MIT | **Prefer not** if canvas binary search suffices |

## Monetization

**Fully free — no batch cap, no Pro CTA, no ZIP unlock.**  
Ads-only (internal). Soft-sell Marketplace Image Resizer + PNG/HEIC tools via RelatedTools.

## Out of scope (v1)

- HEIC / AVIF / GIF animation / PDF / TIFF  
- Server upload compression  
- Resize, white pad, watermark, background removal  
- TinyPNG API / paid smart compression claims  
- Fake Pro / daily limits  

## SEO (mandatory — ship with v1)

- **Title:** Image Compressor - Free Batch Compress (No Upload)  
- **H1:** Image Compressor  
- **Meta description:** Free image compressor in your browser. Batch compress images without uploading, target size (e.g. 100KB), ZIP download - no signup.  
- **Lede:** primary + secondary phrases naturally (batch, without uploading, 100KB, amazon listing)  
- **FAQ (≥5) search-shaped:**
  1. How do I use this image compressor?
  2. Can I batch compress images?
  3. Can I compress images without uploading?
  4. How do I compress to 100KB?
  5. How do I compress for Amazon listing photos?
  6. Will compression change image dimensions?
  7. Does this work with PNG and WebP?
  8. Can I compress HEIC here?

## Acceptance criteria

- [x] Compress ≥2 JPG/PNG/WebP files in one run  
- [x] Quality mode reduces typical noisy JPG size  
- [x] Target KB mode: output ≤ target when achievable (else best-effort at floor quality)  
- [x] Before/after sizes shown per file  
- [x] ZIP download  
- [x] HEIC rejected with clear message + HEIC tool link  
- [x] No file-byte upload (Network)  
- [x] Title + meta include `image compressor`  
- [x] FAQ ≥5; FAQPage JSON-LD matches all FAQs  
- [x] WebApplication JSON-LD `offers.price: "0"`  
- [x] Homepage card + nav + RelatedTools + sitemap  
- [x] E2E `npm run test:image-compressor` includes SEO + feature musts  

## Feature parity musts (workflow §6.2)

| Must | E2E case | Result |
|------|----------|--------|
| Compress JPG/PNG | batch ≥2 → smaller or re-encoded outputs | **pass** |
| Batch + ZIP | ZIP download link | **pass** |
| Quality control | lower quality → smaller files | **pass** (22KB→48KB) |
| Target KB | compress toward 100KB preset | **pass** |
| Never uploaded | no file upload POST | **pass** |
| SEO gate | title/meta/H1/FAQ/JSON-LD | **pass** |

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-28 | `npm run test:image-compressor` (19 asserts) | **pass** | Feature + SEO gates |
| 2026-07-28 | `npm run test:site` | **pass** | Includes image-compressor page + sitemap |
