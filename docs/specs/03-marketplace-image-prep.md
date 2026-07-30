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
| Walmart | 2200×2200 | square | on | Official recommended; zoom floor 1500 |

User can change size when exactly one marketplace is selected. Always confirm in each Seller Center.

## Spec accuracy (bidirectional)

**Reviewed:** 2026-07-26  

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Amazon main / zoom | Seller forums + SC guidance: ≥1000px longest for zoom; **~1600px+** often cited optimal; white RGB 255; JPEG preferred; often ≤10 MB (reviewed 2026-07-26) | Listing tools / blogs also use **2000×2000** as a higher master | **2000×2000** square default (user-adjustable), white on, JPEG, **≤5 MB** | Default is a **seller master above official 1600+ band**, not “Amazon requires exactly 2000”. Guides must label 1000 / 1600+ / optional 2000 separately. |
| TikTok Shop | Seller University / regional: **1:1**, min **600×600**; JPEG/PNG; file caps often **5 MB** (PH essay also cites 10 MB — use safer 5) | myPixelVault / Picoko recommend **1200×1200**, white/plain main | **1200×1200** square, white on, ≤5 MB | Above official min; matches SERP seller prep tools |
| Etsy listing photos | [Etsy Help](https://help.etsy.com/hc/en-us/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop): recommend ≥**2000** W&H; first photo ≥**635**; (2026-07-26) | Pixelense / craft blogs: 2000×2000 square | **2000×2000**, white **off**, ≤5 MB | White not an Etsy hard rule — leave off |
| eBay | [eBay Help](https://www.ebay.co.uk/help/selling/listings/adding-pictures-listings?id=4148): min ~500; recommend ~**1600×1600**; up to **12 MB**; JPEG/PNG/… (2026-07-26) | Listing blogs standardize on 1600 | **1600×1600**, white off, ≤5 MB | 5 MB under 12 MB official max |
| Shopify | Shopify product image guidance commonly **2048×2048** (merchant docs / theme best practice; confirm in admin) | Reseller tools use 2048 | **2048×2048**, white off, ≤5 MB | Platform is flexible; 2048 = common storefront default |
| Walmart Marketplace | [Marketplace Learn image guidelines](https://marketplacelearn.walmart.com/guides/Item%20setup/Item%20content,%20imagery,%20and%20media/Product-detail-page:-Image-guidelines-&-requirements): **2200×2200** recommended; **1500×1500** zoom min; **1:1**; white **255/255/255**; JPEG/PNG/BMP; ~5 MB (2026-07-26) | Third-party blogs often say 2000 — **official wins** | **2200×2200**, white on, ≤5 MB, upscale floor **1500** | **Corrected 2026-07-26** from 2000 → 2200 |

Acceptance: exports are JPEG squares at preset px; under maxBytes; white pad when enabled. UI already says confirm in Seller Center.

## Competitors

| Site | Notes |
|------|--------|
| ListingPhotoTool | Multi-marketplace one page — customer-correct shape |
| IMResizer / PrivacyCrop | TTS-only or single size |
| myPixelVault | Strong SEO blogs + reseller squarer |

**Wedge:** Multi-platform presets + white BG + EXIF report + ZIP + privacy, with FAQ covering Amazon/TikTok/Etsy search phrases on one URL.

## Monetization

**Fully free** — no batch cap, no Pro CTA. Site revenue = display ads (when live).

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
| 2026-07-26 | Spec accuracy bidirectional audit | pass | Walmart preset corrected 2000→2200; see SPEC-ACCURACY-AUDIT |

| 2026-07-25 | one homepage card | pass | |
| 2026-07-25 | Amazon + TikTok presets | pass | 2000 / 1200 |
| 2026-07-25 | multi-export ZIP folders | pass | amazon/ + tiktok-shop/ |
| 2026-07-25 | batch ZIP + free cap 10 | pass | |
| 2026-07-25 | no upload | pass | |
