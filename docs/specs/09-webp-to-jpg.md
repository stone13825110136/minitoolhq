# 09 — WebP to JPG Converter (SEO landing)

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/webp-to-jpg` |
| Primary keyword | webp to jpg |
| Secondary keywords | convert webp to jpg, webp to jpeg, batch webp to jpg, webp to jpg no upload |
| Status | shipped |
| Stack | Reuses `lib/format-convert` + `scripts/png-to-jpg.ts` (`data-webp-jpg`) |

## Job

> Drop WebP images → convert to JPG in the browser → batch ZIP download, no upload.

## Relationship to `/tools/png-to-jpg`

**Same conversion engine.** Dedicated URL for the high-volume `webp to jpg` query.  
Original format-convert spec said “don’t split pages”; **superseded for traffic** (2026-07-31): one job engine, two SEO landings (PNG-primary vs WebP-primary). Cross-link both tools.

## Keyword lock

| Field | Value |
|-------|--------|
| Primary | webp to jpg |
| Title | WebP to JPG Converter — Free Batch (No Upload) |
| H1 | WebP to JPG Converter |
| Meta | Free WebP to JPG converter in your browser. Batch convert WebP to JPEG, ZIP download — no upload, no signup. |
| FAQ | ≥5 |

## Competitors

| Site | Notes |
|------|--------|
| LocalJPG / AnyWebP / convert.now | Local WebP→JPG; some paywall ZIP |
| png-to-jpg (ours) | Already converts WebP; weaker for `webp to jpg` SERP title |

### Wedge

**Fully free batch WebP→JPG, no upload, seller CTA** into Marketplace Image Resizer / Amazon guides.

## Monetization

Fully free + ads.

## Out of scope v1

- Server convert, HEIC (use HEIC tool), in-place disk write

## Acceptance

- [x] `/tools/webp-to-jpg` works; defaults to JPG out
- [x] SEO title/H1/meta/FAQ/JSON-LD
- [x] Homepage card + RelatedTools + IndexNow + sitemap
- [x] Guide `/guides/webp-to-jpg` CTA points here
- [x] E2E `npm run test:webp-to-jpg` + site smoke includes page

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-31 | `npm run test:webp-to-jpg` (14 asserts) | **pass** | Feature + SEO; Chromium via Playwright |

## Next (queued)

**Background remover → white product background** (high traffic, seller main-image job) after this ships.
