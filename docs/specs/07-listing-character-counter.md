# 07 — Listing Character Counter

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/listing-character-counter` |
| Primary keyword | amazon title character counter |
| Secondary keywords | amazon 75 character title, etsy title character counter, amazon item highlights character limit, amazon listing character counter |
| SEO gate | **mandatory with ship** |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client TS; no libs required |

## Job

> Paste listing title / Item Highlights / bullets / backend terms / Etsy tags → live character (and UTF-8 byte) counts against marketplace limits with remaining + Pass/Fail — in-browser, no upload.

## Keyword lock (SEO expert §1)

| Field | Value |
|-------|--------|
| Primary | amazon title character counter |
| Secondary (≥3) | amazon 75 character title; etsy title character counter; amazon item highlights character limit; amazon listing character counter |
| Title | Amazon Title Character Counter (75) + Etsy Listing Limits |
| H1 | Amazon Title Character Counter |
| Meta description | Free Amazon title character counter for the 75-character limit, plus Item Highlights (125), bullets, backend bytes, and Etsy 140. Runs in your browser — no signup. |
| FAQ | ≥5 search-shaped (see SEO block) |

**One job = one tool.** Cover Amazon / Etsy / TikTok Shop via platform picker + FAQ — do **not** ship three separate counters.

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| Lynx Media | https://www.lynxmedia.co/tools/amazon-title-character-counter/ | 75 + Item Highlights + bulk + AI rewrite CTA |
| Amalytix | https://www.amalytix.com/en/tools/amazon-title-shortener/ | 75 + 125 AI shortener |
| Listadum | https://www.listadum.com/etsy-title-character-counter | Etsy 140 + mobile preview + SaaS funnel |
| amazon-consultant.co.uk | https://amazon-consultant.co.uk/tools/amazon-title-character-counter/ | **Stale** — still teaches ~200 |
| SellerMagnet | title checker | Style suite (22 checks) — out of scope |

### Wedge

Correct **2026 defaults (75 + 125)** + multi-marketplace + **backend UTF-8 byte** count — free, local, no AI lead-gen.

## Spec accuracy (bidirectional)

**Reviewed:** 2026-07-29  

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Amazon title (non-media) | Seller Central forum News_Amazon: titles ≤**75** chars incl. spaces from **Jul 27, 2026** (except media) | Lynx / Amalytix = 75; some pages still say 200 | **75** | Media exception: FAQ note only (v1) |
| Amazon Item Highlights | Same announcement: **125** chars, searchable | Lynx / Amalytix | **125** | Must-have field |
| Amazon bullets | Category variance; common seller display **500**/bullet | Keywords.am / SellScope | **500** per bullet × 5 | Label “common default — confirm category”; optional note 255 |
| Amazon description | Common SC style **2000** | Teamz Lab / Keywords.am | **2000** | Secondary field |
| Amazon backend search terms | Commonly **249 bytes** US/UK/EU | Keywords.am | **249 bytes** via `TextEncoder` | Not character count |
| Etsy title | Listing editor hard stop **140** | Listadum / Everlyst | **140** | Hard |
| Etsy tags | Common **20** chars × **13** tags | TypeCount / seller docs | 20 × 13 | Should |
| TikTok Shop title | Seller University prefers **40–150**; feed docs **255** hard max | SimpTok 255 | Hard **255**; soft tip 40–150 / first ~60 | Soft ≠ hard fail |

Disclaimer: confirm in Seller Central / Etsy / TikTok Seller Center.

## Feature parity

| Feature | Lynx | Listadum | Amalytix | Us v1 |
|---------|:----:|:--------:|:--------:|-------|
| Live title count vs limit | ✅ | ✅ | ✅ | **must** |
| Remaining + over-limit status | ✅ | ✅ | ✅ | **must** |
| Amazon Item Highlights 125 | ✅ | ❌ | ✅ | **must** |
| Amazon bullets + description | ❌ | ❌ | ❌ | **must** |
| Backend **byte** count | ❌ | ❌ | ❌ | **must** |
| Etsy 140 (+ tags) | ❌ | ✅ | ❌ | **must** |
| TikTok Shop preset | ❌ | ❌ | ❌ | **should** |
| Platform picker | ❌ | ❌ | ❌ | **must** |
| Mobile truncate preview (first N) | — | ✅ | — | **should** |
| Bulk CSV titles | ✅ | ❌ | — | **won't** v1 (speed) |
| AI rewrite / agency CTA | ✅ | SaaS | ✅ | **won't** |
| Signup | soft | yes | soft | **won't** |

## Open-source reuse

| Need | Library | License |
|------|---------|---------|
| Char / byte count | Native JS + `TextEncoder` | — |
| Other | None | — |

## Monetization

**Fully free** + site ads. No Pro / AI unlock.

## Out of scope (v1)

- AI title rewrite  
- Full style-guide suite (forbidden chars, Title Case, 22 checks)  
- ASIN / Seller Central API pull  
- Bulk CSV  
- Pixel-width simulation beyond first-N-char preview  
- Standalone inch converter (deferred)

## SEO (mandatory — ship with v1)

- **Title:** Amazon Title Character Counter (75) + Etsy Listing Limits  
- **H1:** Amazon Title Character Counter  
- **Meta:** Free Amazon title character counter for the 75-character limit, plus Item Highlights (125), bullets, backend bytes, and Etsy 140. Runs in your browser — no signup.  
- **FAQ (≥5):**
  1. What is the Amazon title character limit (75)?
  2. What are Amazon Item Highlights (125 characters)?
  3. How do I use this Amazon title character counter?
  4. What is the Etsy title character limit?
  5. How do Amazon backend search terms byte limits work?
  6. What is the Amazon bullet point character limit?
  7. Does this tool upload my listing copy?
  8. What about TikTok Shop title length?

## Guides (same ship or immediate follow)

| Guide | Primary intent |
|-------|----------------|
| `/guides/amazon-title-character-limit` | amazon 75 character title / amazon title character limit |
| `/guides/amazon-item-highlights` | amazon item highlights 125 |
| `/guides/etsy-title-character-limit` | etsy title character limit 140 |

## Acceptance criteria

- [x] Platform picker Amazon / Etsy / TikTok Shop  
- [x] Amazon: title 75, Item Highlights 125, 5× bullets 500, description 2000, backend 249 bytes  
- [x] Etsy: title 140, tags 20×13  
- [x] TikTok: title 255 + soft guidance  
- [x] Live remaining + Pass/Fail (or over)  
- [x] Truncate preview for title (Amazon ~75 already full; Etsy ~60; TikTok ~60)  
- [x] No upload / no Pro  
- [x] Title + meta + H1 + FAQ≥5 + FAQPage + WebApplication JSON-LD  
- [x] Homepage card + nav + RelatedTools + sitemap  
- [x] E2E feature + SEO assertions  
- [x] Guides linked + IndexNow URLs  

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-29 | `npm run test:listing-counter` (24 asserts) | pass | SEO + Amazon 75/125 + backend bytes + Etsy/TikTok + guides 200 |
| 2026-07-29 | `npm run test:site` | pass | sitemap + homepage card wiring |
