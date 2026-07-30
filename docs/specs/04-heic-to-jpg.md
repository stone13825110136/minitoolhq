# 04 — HEIC to JPG Converter

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/heic-to-jpg` |
| Primary keyword | heic to jpg |
| Secondary keywords | heic to jpg converter, convert heic to jpg, heic to jpeg, batch heic to jpg |
| SEO gate | **mandatory with ship** — see `.cursor/rules/minitool-seo-keywords.mdc` |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client TS; `heic-to` (already used by Image Prep); `fflate` ZIP; optional EXIF strip via canvas re-encode |

## Job

> Drop iPhone HEIC/HEIF photos → convert to JPG in the browser (batch + ZIP) without uploading files to a server.

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| heictojpg.com | https://heictojpg.com/ | High traffic; batch claims ~50–200; many reviews say upload or unclear privacy |
| HEIC.online | https://heic.online/ | Strong for `heic to jpg`; quality slider; often server-side |
| heic.digital | https://heic.digital/ | Unlimited batch marketing; upload model common |
| Local-browser clones | various | Privacy wedge exists but SERP still full of upload tools |

### Wedge (one line)

**Batch HEIC → JPG fully in-browser (no upload)** + seller CTA into Marketplace Image Resizer — most top results still upload or obscure privacy.

## Spec accuracy (bidirectional)

**Reviewed:** 2026-07-26  

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Output format JPG/JPEG | Amazon prefers JPEG for listings; Etsy JPG/PNG; TikTok JPG/PNG (Seller Help / Seller University summaries 2026-07-26) | heictojpg.com, HEIC.online → JPEG out | **JPEG** (quality slider default 92%) | Correct for marketplace uploads |
| HEIC/HEIF input | Apple HEIC container; marketplaces often reject or auto-convert inconsistently | All major converters accept .heic/.heif | Accept HEIC/HEIF only | Reject non-HEIC with clear error |
| No size “platform rule” on this page | N/A — sizing is Marketplace Prep’s job | Competitors are format-only | No fake Amazon px claim on HEIC tool | Guides link seller size next steps |

Acceptance: output files are `.jpg` / JPEG MIME; batch ZIP; optional EXIF strip via re-encode.

## Feature parity

| Feature | heictojpg.com | HEIC.online | Us v1 |
|---------|:-------------:|:-----------:|-------|
| Convert HEIC/HEIF → JPG | ✅ | ✅ | **must** |
| Batch multiple files | ✅ (capped) | ✅ | **must** (unlimited free) |
| ZIP download | ✅ often | ✅ | **must** |
| Quality control | varies | ✅ | **must** (slider / presets) |
| No account | ✅ | ✅ | **must** |
| Files never uploaded | ❌ / unclear | ❌ typical | **must** |
| Strip EXIF option | sometimes | sometimes | **should** |
| Seller next-step (marketplace sizes) | ❌ | ❌ | **should** (link) |
| HEIC → PNG | sometimes | sometimes | **won't** v1 |
| Desktop install | ❌ | ❌ | **won't** |

## Open-source reuse

| Need | Library | License | Notes |
|------|---------|---------|--------|
| HEIC decode | `heic-to` | MIT | Already in repo via Image Prep |
| ZIP | `fflate` | MIT | Reuse `zipJpegFiles` |
| EXIF strip | canvas JPEG re-encode | — | Same approach as prep pipeline |
| Shared helper | `src/lib/amazon-prep/heic.ts` | — | Reuse `isHeicFile` / `heicToJpegBlob` |

## Monetization

**Fully free — no batch cap, no Pro CTA on this page.**  
Traffic / ads tool (same class as FBA box checker). Soft-sell Marketplace Image Resizer for sellers who need platform sizes next.

## Out of scope (v1)

- Live camera capture  
- HEIC → PNG / WebP (format convert tool later)  
- Server/API conversion  
- Fake “unlimited Pro” gate  

## SEO (mandatory — ship with v1)

- **Title:** HEIC to JPG Converter — Free Batch Convert (No Upload)  
- **H1:** HEIC to JPG Converter  
- **Meta description:** Free HEIC to JPG converter in your browser. Batch convert HEIC to JPEG, download a ZIP — no upload, no signup.  
- **Lede:** primary + secondary phrases naturally  
- **FAQ (≥5):** search-shaped (heic to jpg, batch, iphone, amazon upload, privacy, quality)

## Acceptance criteria

- [x] Convert ≥2 HEIC/HEIF files to JPG in one run  
- [x] ZIP download of results  
- [x] Quality control works  
- [x] No file-byte upload (Network)  
- [x] Non-HEIC files rejected with clear message  
- [x] Title + meta include `heic to jpg`  
- [x] FAQ ≥5; FAQPage JSON-LD matches  
- [x] Homepage card + nav + sitemap  
- [x] E2E script `npm run test:heic-to-jpg` includes SEO + feature gates  

## Feature parity musts (workflow §6.2)

| Must | E2E case | Result |
|------|----------|--------|
| Convert HEIC→JPG | batch convert done | pass |
| Batch multiple | batch lists 2 + 2 JPG sizes | pass |
| ZIP download | ZIP download link | pass |
| Quality control | quality 72 vs 96 size change (222KB→588KB) | pass |
| No account | page usable without login | pass (implicit) |
| Never uploaded | no file upload POST | pass |

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-26 | First E2E (1 file only) | **incomplete** | Missed workflow batch≥2 + quality must |
| 2026-07-26 | Full HEIC E2E (33 asserts) | **pass** | `npm run test:heic-to-jpg` |
| 2026-07-26 | Marketplace regression | **pass** | `npm run test:marketplace-prep` |
| 2026-07-26 | FBA box regression | **pass** | `npm run test:fba-box` |
| 2026-07-26 | Site smoke | **pass** | `npm run test:site` |
