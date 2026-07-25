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

> Pick a marketplace preset → batch resize listing photos to that platform’s square (or longest) spec, optional white background, ≤5 MB, strip EXIF/GPS → ZIP. All in-browser.

## Platform presets (v1)

| Platform | Default size | Mode | White BG default | Notes |
|----------|--------------|------|------------------|-------|
| Amazon | 2000×2000 | square | on | Zoom-friendly; upscale floor 1600 |
| TikTok Shop | 1200×1200 | square | on | Official min often 600; 1200 recommended |
| Etsy | 2000×2000 | square | off | Listing zoom |
| eBay | 1600×1600 | square | off | Common zoom target |
| Shopify | 2048×2048 | square | off | Storefront common |
| Walmart | 2000×2000 | square | on | Main image style |

User can change size after picking a preset. Always confirm in each Seller Center.

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

- [x] One UI; platform `<select>` switches defaults
- [x] `?platform=` deep link works for amazon / tiktok-shop / …
- [x] Old Amazon & TikTok paths redirect / deep-link to this tool
- [x] Batch ZIP, EXIF report, no upload
- [x] FAQ ≥5 covering multi-platform + privacy; JSON-LD synced
- [x] Homepage shows **one** image-prep card (not Amazon + TikTok separate)
- [x] `npm run test:marketplace-prep` E2E green

## Test log

Command: `cd super-shell && npm run test:marketplace-prep`

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-25 | SEO title/meta/H1/FAQ JSON-LD | pass | |
| 2026-07-25 | one homepage card | pass | |
| 2026-07-25 | Amazon + TikTok presets | pass | 2000 / 1200 |
| 2026-07-25 | batch ZIP + free cap 10 | pass | |
| 2026-07-25 | no upload | pass | |
