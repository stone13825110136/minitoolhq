# Research — Listing character counter · Inch/cm · Guides deepen

**Date:** 2026-07-29  
**Status:** research complete — **await approval before specs/code**  
**Workflow:** keyword → competitors → (then) `docs/specs/` → build

---

## Executive recommendation

| Priority | Item | Verdict |
|----------|------|---------|
| **P0** | Listing character counter (Amazon/Etsy/TikTok presets) | **Build next** — timely (Amazon **75-char title** live Jul 27, 2026) + seller-native SERP |
| **P0** | Guides: Amazon 75-char title + Item Highlights; Etsy title limit | **Ship with / right after tool** |
| **P2** | Standalone inch ↔ cm converter | **Defer or thin companion** — FBA Box Checker already has in/cm; generic SERP owned by RapidTables |
| — | Profit calculators / AI rewrite / Pro PDF | **Won't** |

---

## Tool A — Listing character counter

### Job (one sentence)

> Paste listing title / bullets / Item Highlights / tags → live character (and byte where needed) counts against marketplace limits, with Pass/Fail remaining — all in-browser, no upload.

### Keyword lock (draft)

| Field | Value |
|-------|--------|
| **Primary** | `amazon title character counter` |
| **Secondary (≥3)** | `amazon 75 character title`, `etsy title character counter`, `amazon item highlights character limit`, `amazon listing character counter` |
| **Also cover via FAQ/presets** | TikTok Shop title limit, backend search terms byte limit, bullet character limit |
| Draft Title | Amazon Title Character Counter (75) + Etsy & Listing Limits \| SellTool HQ |
| Draft H1 | Amazon Title Character Counter — 75 Characters & Listing Limits |
| Draft meta | Free Amazon title character counter for the 75-character limit, plus Item Highlights (125), Etsy 140, and bullet counts. Runs in your browser — no signup. |

**Note:** Primary stays the high-intent tool phrase; **75** must appear in Title/H1/lede because that is the 2026 policy change sellers are searching for.

### Spec accuracy — locked limits (v1 defaults)

| Platform / field | Proposed v1 default | Official / primary source | Competitor check | Notes |
|------------------|---------------------|---------------------------|------------------|-------|
| Amazon title (non-media) | **75 characters** incl. spaces | Seller Central forum News_Amazon, Jun 10 / effective **Jul 27, 2026** | Lynx Media, Amalytix use **75**; amazon-consultant.co.uk still says **200** (stale) | Media exception: note in UI/FAQ, optional “Media (legacy ~200)” toggle later |
| Amazon Item Highlights | **125 characters** | Same Seller Central announcement | Lynx / Amalytix | **Must** ship with title counter — new field |
| Amazon bullets | **500 chars / bullet** (common seller default) | Category variance widely reported (255 apparel etc.) | Keywords.am / SellScope | Label as “common default — confirm category in Seller Central”; optional preset 255 |
| Amazon description | **2000 characters** | Industry consensus / SC style guides | Teamz Lab, Keywords.am | Secondary field |
| Amazon backend search terms | **249 bytes** (US/UK/EU common) | Widely cited; measure **UTF-8 bytes** | Keywords.am | **Must** count bytes, not only chars |
| Etsy title | **140 characters** | Etsy listing editor hard stop (competitors agree) | Listadum, Everlyst | Hard limit |
| Etsy tags | **20 chars × 13 tags** | Common Etsy seller docs | TypeCount guide | Should |
| TikTok Shop title | **255 max**; soft tip **40–150** / first ~60 visible | TikTok Seller University prefers 40–150; feed docs cite 255 hard | SimpTok 255 | Preset + soft guidance, not fake hard fail at 60 |

Disclaimer on every limits table: confirm in Seller Central / Etsy / TikTok Seller Center — rules change.

### Competitors (feature parity)

| Feature | Lynx Media | Amalytix | Listadum (Etsy) | amazon-consultant | SellerMagnet | **Us v1** |
|---------|:----------:|:--------:|:---------------:|:-----------------:|:------------:|-----------|
| Live title count | ✅ 75 | ✅ 75 + AI shorten | ✅ 140 | ✅ but **stale 200** | ✅ + style checks | **must** |
| Item Highlights 125 | ✅ | ✅ | ❌ | ❌ | ❌ | **must** (Amazon) |
| Multi-field (bullets / backend) | ❌ title focus | ❌ | title focus | title | title-heavy | **must** Amazon fields |
| Byte count (backend) | ❌ | ❌ | ❌ | ❌ | ❌ | **must** |
| Etsy 140 | ❌ | ❌ | ✅ | ❌ | ❌ | **must** (platform picker) |
| TikTok preset | ❌ | ❌ | ❌ | ❌ | ❌ | **should** |
| Bulk titles CSV | ✅ | — | ❌ | ❌ | — | **should** (local only) |
| Mobile truncate preview | — | — | ✅ ~60 | — | pixel estimates | **should** |
| AI rewrite / lead-gen CTA | ✅ | ✅ | signup funnel | agency | agency | **won't** |
| Signup / Pro | soft CTA | free+AI | SaaS | agency | SaaS | **won't** |
| Local / no upload | yes | yes | yes | yes | yes | **must** |

### Wedge

1. **Correct 2026 defaults (75 + 125)** while some SERP pages still teach 200.  
2. **One job, multi-marketplace** (Amazon + Etsy + TikTok) — not three tools.  
3. **Backend byte counter** (competitors often skip).  
4. Privacy / free / ads-only — no AI rewrite paywall.

### Open-source reuse

| Need | Approach |
|------|----------|
| Char count | Native JS `string.length` (UTF-16 code units ≈ Amazon/Etsy “characters” for BMP text; document emoji caveat) |
| Byte count | `new TextEncoder().encode(s).length` |
| ZIP/libs | None required |

### Out of scope (v1)

- AI title rewriting  
- Full style-guide suite (forbidden chars, Title Case, 22 checks)  
- ASIN pull from Amazon API  
- Pixel-width simulation beyond simple “first N chars” preview  

---

## Tool B — Inch ↔ cm (FBA / carton)

### Job candidates

| Shape | Pros | Cons |
|-------|------|------|
| Generic `inches to cm` page | Search volume | RapidTables / UnitConverters dominate; **weak ads RPM mix**; not seller-unique |
| L×W×H (+ weight) batch cm↔in / kg↔lb → CTA FBA checker | Seller loop; mutual link with existing tool | Overlaps FBA tool’s unit toggle |
| Fold into FBA Box Checker only | Zero new SERP fight | No new tool URL / less Phase 1 count |

### Keyword reality

- Head: `inches to cm` / `cm to inches` — utility mega-sites.  
- Seller long-tails (`fba cm to inches`, `carton dimensions cm to inches`) thinner but better fit.

### Recommendation

**Do not rush a standalone generic converter.** Options after character counter ships:

1. **Preferred thin v1 (if still want Slot 7):** `/tools/inch-cm-converter` = **carton L×W×H×weight** bidirectional convert + link “Check FBA box limits” (prefill query or copy). Primary keyword something like `cm to inches carton` / `fba inches to cm` — not bare `inches to cm`.  
2. **Or skip Slot 7** and use Phase 1 slots for watermark/rename + more guides.

FBA Box Checker already: `in/lb` ↔ `cm/kg` radios — document this so we don’t duplicate Pass/Fail.

---

## Guides deepen (cluster plan)

| Proposed guide | Primary intent | CTA |
|----------------|----------------|-----|
| `/guides/amazon-title-character-limit` | amazon 75 character title / amazon title character limit 2026 | Listing character counter |
| `/guides/amazon-item-highlights` | amazon item highlights 125 characters | Same tool (Item Highlights field) |
| `/guides/etsy-title-character-limit` | etsy title character limit / 140 | Same tool `?platform=etsy` |
| Optional later | tiktok shop title length | `?platform=tiktok-shop` |

**Policy:** stay on `/guides/*` — no separate blog domain.

Existing image/FBA/HEIC/PNG guides: keep; next deepen pass = **title/limits cluster** tied to new tool (highest timely ROI).

---

## Suggested build order (after approval)

1. Write `docs/specs/07-listing-character-counter.md` (full SEO + Spec accuracy table)  
2. Implement tool + homepage card + RelatedTools + E2E  
3. Ship 2 guides (Amazon 75 + Etsy 140); Item Highlights can be FAQ-first then own guide  
4. Re-decide inch converter (thin seller page vs defer)  
5. IndexNow + GSC new URLs only  

---

## Open questions for product owner

1. Confirm **primary keyword** = `amazon title character counter` (vs `amazon listing character counter`)?  
2. v1 Amazon fields: Title + Item Highlights + 5 bullets + backend **required**; description optional?  
3. Inch converter: **defer** or **thin carton converter** after counter?  
4. Media-category 200-char exception: note-only vs toggle in v1?
