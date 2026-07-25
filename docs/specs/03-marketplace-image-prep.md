# 03 — Marketplace Image Prep (unified)

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/marketplace-image-prep` |
| Primary keyword | marketplace image resizer |
| Secondary keywords | amazon product image resize, tiktok shop image size, etsy listing photo size, ebay product image size, shopify product image size |
| SEO gate | **mandatory with ship** — vertical phrases live on **this one page** (FAQ / table / presets), not separate tools |
| Status | **shipped** (v1) — one tool; Amazon/TikTok vanity URLs redirect in |
| Stack | Astro + reuse `amazon-prep` canvas pipeline |

## Customer rule

**One job → one tool.** Sellers who list on Amazon + TikTok + Etsy use **one** page and switch the platform preset. Do not ship per-marketplace clones.

Vanity redirects (keep old links alive):

- `/tools/amazon-image-prep` → `?platform=amazon`
- `/tools/tiktok-shop-image-prep` → `?platform=tiktok-shop`

## Job

> Check one or more marketplace presets → batch resize listing photos to each platform’s square spec, optional white background (single-platform tweak), ≤5 MB, strip EXIF/GPS → **one ZIP** with a folder per selected marketplace. All in-browser.

## Single or multi export (required — user chooses)

- UI: checkbox select (not a single `<select>`). Select all / clear helpers optional.
- **One checked:** single-platform ZIP (flat files, e.g. `amazon-….jpg`); show size / max MB / white BG / upscale tweaks.
- **Two or more checked:** one ZIP with folders per marketplace, e.g. `amazon/…`, `tiktok-shop/…`; each folder uses that preset’s defaults (tweaks hidden).
- Deep link: `?platform=amazon` or `?platform=amazon,tiktok-shop`.

## Platform presets (v1)

| Platform | Default size | Mode | White BG default | Notes |
|----------|--------------|------|------------------|-------|
| Amazon | 2000×2000 | square | on | Zoom-friendly; upscale floor 1600 |
| TikTok Shop | 1200×1200 | square | on | Official min often 600; 1200 recommended |
| Etsy | 2000×2000 | square | off | Listing zoom |
| eBay | 1600×1600 | square | off | Common zoom target |
| Shopify | 2048×2048 | square | off | Storefront common |
| Walmart | 2000×2000 | square | on | Main image style |

User can change size when exactly one marketplace is selected. Always confirm in each Seller Center.

## Competitors

| Site | Notes |
|------|--------|
| ListingPhotoTool | Multi-marketplace one page — customer-correct shape |
| IMResizer / PrivacyCrop | TTS-only or single size |
| myPixelVault | Strong SEO blogs + reseller squarer |

**Wedge:** Multi-platform presets + white BG + EXIF report + ZIP + privacy, with FAQ covering Amazon/TikTok/Etsy search phrases on one URL.

## Monetization

Free batch **10** / run → Pro CTA (same as prior Amazon Prep).

## Acceptance criteria

- [x] One UI; marketplace checkboxes (multi-select)
- [x] Multi-select → one ZIP with folder per marketplace
- [x] Single-select → size / white BG tweaks visible
- [x] `?platform=` deep link works for one or comma-separated ids
- [x] Old Amazon & TikTok paths redirect / deep-link to this tool
- [x] Batch ZIP, EXIF report, no upload
- [x] FAQ ≥5 covering multi-export + privacy; JSON-LD synced
- [x] Homepage shows **one** image-prep card (not Amazon + TikTok separate)
- [x] `npm run test:marketplace-prep` E2E green

## Test log

Command: `cd super-shell && npm run test:marketplace-prep`

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-25 | SEO title/meta/H1/FAQ JSON-LD | pass | |
| 2026-07-25 | one homepage card | pass | |
| 2026-07-25 | Amazon + TikTok presets | pass | 2000 / 1200 |
| 2026-07-25 | multi-export ZIP folders | pass | amazon/ + tiktok-shop/ |
| 2026-07-25 | batch ZIP + free cap 10 | pass | |
| 2026-07-25 | no upload | pass | |
