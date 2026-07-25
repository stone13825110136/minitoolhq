# 01 — Amazon Image Prep

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/amazon-image-prep` |
| Primary keyword | amazon product image resize |
| Secondary keywords | amazon main image size, amazon image requirements, strip exif amazon photos, amazon listing photo compressor |
| SEO gate | **mandatory with ship** — see `.cursor/rules/minitool-seo-keywords.mdc` |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client-side TS; no upload API |

## Job

> Prep phone/product photos into Amazon-ready JPEGs in the browser — resize, optional white background, size cap, strip EXIF/GPS — then download a ZIP. Nothing uploaded.

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| myPixelVault | https://mypixelvault.app/amazon-listing-photos/ | Closest feature set; batch ≤20; ZIP; EXIF report; optional white BG |
| PixelBatch | https://pixelbatch.io/amazon-listing-resizer | 2000×2000 + white pad; multi-platform messaging; free unlimited claim |
| Squoosh | https://squoosh.app | Privacy gold standard; not Amazon-specific; usually 1 image |
| MiniPx | https://minipx.com | Local + Pro pricing signal (~$4.99/mo) |

### Wedge (one line)

Private, Amazon-focused batch prep with clear free→Pro path — no signup wall, no upload, seller-job messaging (not a generic compressor).

## Feature parity

| Feature | myPixelVault | PixelBatch | Us v1 |
|---------|:------------:|:----------:|-------|
| 100% client-side, no upload | ✅ | ✅ | **must** |
| Batch process | ✅ (≤20) | ✅ | **must** |
| Resize to Amazon zoom spec (~2000px longest / square option) | ✅ | ✅ | **must** |
| Output JPEG (sRGB via canvas) | ✅ | ✅ | **must** |
| Cap file size + binary-search quality | ✅ (~5 MB) | ✅ | **must** |
| Strip EXIF / GPS (canvas redraw) | ✅ | ✅ | **must** |
| Metadata removal report table | ✅ | ❌/弱 | **must** |
| Optional pure white BG (RGB 255,255,255) | ✅ | ✅ | **must** |
| Per-step toggles | ✅ | 部分 | **must** |
| ZIP download | ✅ | ✅ | **must** |
| Accept JPEG / PNG / WebP | ✅ | ✅ | **must** |
| SEO requirements table + FAQ | ✅ | ✅ | **must** |
| HEIC input | 另页 | 部分 | **should** (if heic-to is cheap to add; else tool #3) |
| Smart AI background remove | 另工具 | 弱 | **won't** (v1) |
| Walmart / Shopify presets | 相关站 | ✅ | **won't** (later tools) |
| Account / upload server | ❌ | ❌ | **won't** |

## Amazon rules to encode (defaults)

Document on-page; keep defaults editable in UI:

| Rule | Default in tool |
|------|-----------------|
| Zoom / recommended longest side | **2000 px** (never intentionally output below 1600 if upscale toggle on) |
| Main image background | Optional **pure white** RGB(255,255,255) |
| Output format | **JPEG** |
| File size cap | **5 MB** (binary search quality) |
| EXIF | Always strip when processing (report what was removed) |

**White BG v1 algorithm (match competitors’ honesty):**  
Corner-sample / near-solid replace **or** letterbox/pad onto white canvas (contain). Document: works best for studio / solid backgrounds; complex scenes → tell user to remove BG elsewhere first.

**Resize modes (v1):**

1. **Longest side = N px** (default 2000) — myPixelVault-style  
2. **Square canvas N×N** with white pad (contain) — PixelBatch-style  

Ship both; default to square 2000×2000 for “main image” preset.

## Open-source reuse

| Need | Library | License | Notes |
|------|---------|---------|--------|
| Decode / draw / resize | Canvas / `createImageBitmap` | — | Core path |
| Compress to max MB | Quality binary search on `canvas.toBlob('image/jpeg')` | — | Same approach as myPixelVault |
| Optional helper | [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) | MIT | If binary search alone is awkward |
| EXIF read (report) | [exifr](https://github.com/MikeKovarik/exifr) | MIT | Read before strip |
| ZIP | [fflate](https://github.com/101arrowz/fflate) | MIT | Batch download |
| HEIC (optional v1) | [heic-to](https://www.npmjs.com/package/heic-to) | MIT | Lazy-load only if enabled |
| Do not | Custom WASM codecs from scratch | — | Defer jSquash unless quality demands |

## Free vs Pro ($4.99/mo)

| | Free | Pro |
|--|------|-----|
| Batch size | Up to **10** images / run | **Unlimited** (device memory only) |
| All core pipeline | ✅ | ✅ |
| ZIP + EXIF report | ✅ | ✅ |
| Saved presets / multi-platform | — | Later (Etsy/Shopify tools share Pro) |
| Watermark / ads on UI | Soft upgrade CTA only | No nag |

Site-wide: Pro unlocks future tools’ batch limits too — one price.

## Out of scope (v1)

- AI / ML background removal
- A+ content / infographic generators
- Server-side processing or accounts
- PDF / video
- Chrome extension
- PWA install prompts
- Per-tool separate checkout

## UX outline

1. Title + one-line privacy promise  
2. Toggles: resize mode, target px, max MB, white BG, (EXIF strip always on)  
3. Drop zone — JPEG/PNG/WebP (+ HEIC if shipped)  
4. Thumbnail queue + progress  
5. **Process & Download ZIP**  
6. Metadata removal report table  
7. Specs table + FAQ (SEO)  
8. Soft Pro CTA when free batch cap hit  

## SEO

| Field | Copy (draft) |
|-------|----------------|
| Title | Amazon Product Image Resizer — 2000px Main Image, White BG & Strip EXIF |
| H1 | Amazon Product Image Resizer & Prep |
| Meta | Free Amazon product image resizer and listing photo compressor… main image size, image requirements, strip EXIF |
| FAQ topics | Size / 2000px resize / image requirements / listing photo compressor / white BG / strip EXIF / GPS / max size / formats / privacy / batch / credit |
| FAQ JSON-LD | Same `faqs` array as on-page (no drift) |

## Acceptance criteria

- [x] No image bytes sent to any server (verify Network tab while processing)
- [x] Batch ≥2 images → single ZIP of JPEGs
- [x] Default preset produces ~2000px (longest or 2000×2000 square) JPEG under 5 MB
- [x] EXIF/GPS absent on outputs; report shows prior fields when present
- [x] White BG toggle pads or flattens to RGB 255,255,255
- [x] Free cap 10 images with clear upgrade path copy (checkout can be stubbed)
- [x] Requirements table + ≥5 FAQs on page
- [x] Title + meta include primary keyword; secondaries in description/lede/FAQ
- [x] FAQPage JSON-LD matches all on-page FAQs
- [x] Linked from homepage / tools index
- [x] Spec libs only — no custom codec from scratch
- [x] E2E asserts SEO meta + FAQ JSON-LD

## Test log

Command: `cd super-shell && npm run test:amazon-prep` (Playwright E2E)

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-25 | page title SEO | pass | |
| 2026-07-25 | meta primary + secondary keywords | pass | synced faqs → FAQPage JSON-LD |
| 2026-07-25 | H1 present | pass | |
| 2026-07-25 | requirements table | pass | |
| 2026-07-25 | FAQ count ≥ 5 | pass | |
| 2026-07-25 | FAQPage JSON-LD matches FAQ count | pass | |
| 2026-07-25 | homepage links to tool | pass | |
| 2026-07-25 | queue shows 2 | pass | |
| 2026-07-25 | ZIP downloaded | pass | |
| 2026-07-25 | ZIP name pattern | pass | |
| 2026-07-25 | report has 2 rows | pass | |
| 2026-07-25 | status ok after process | pass | |
| 2026-07-25 | no large file upload via fetch/xhr | pass | |
| 2026-07-25 | Pro banner when >10 queued | pass | |
| 2026-07-25 | free tier processes only 10 | pass | |
| 2026-07-25 | square output 2000×2000 | pass | corner RGB 255,255,255 |
| 2026-07-25 | output under 5MB | pass | ~35KB sample |
| 2026-07-25 | filename amazon-*.jpg | pass | |
| 2026-07-25 | longest side = 2000 | pass | 1000×2000 |
| 2026-07-25 | upscale below 1600 → ≥1600 | pass | 800→1600 |
| 2026-07-25 | zip contains 2 jpg files | pass | |

**Earlier gap:** first “shipped” claim only had `npm run build` — not feature E2E. Fixed by adding mandatory test step + this log.

## Implementation notes

- Preferred app root: `super-shell/` (existing Astro scaffold)
- Keep processing in Web Worker if UI jank appears
- Filename pattern: `amazon-{originalBasename}.jpg`
- Local path this machine: `D:\小工具\minitoolhq`
- E2E: `npm run test:amazon-prep`

## Next after ship

Restart workflow for **02 — Image Compressor** (same image pipeline; new SEO page).
