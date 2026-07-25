# 02 — FBA Box Size Checker

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/fba-box-size-checker` |
| Primary keyword | amazon fba box size |
| Secondary keywords | fba box dimensions, amazon fba box size limit, fba carton size checker, awd vs fba box size |
| Status | **shipped** (v1 in `super-shell`) |
| Stack | Astro (`super-shell`) + client-side TS; no server, no upload |

## Job

> Enter inbound carton L×W×H and weight → instant Pass/Fail against current US Amazon FBA (and AWD) box limits, with clear which rule failed and lift-label notes. Runs entirely in the browser.

## Competitors researched

| Site | URL | Notes |
|------|-----|--------|
| GoAura blog | https://goaura.com/blog/amazon-fba-box-size | Strong SEO article; checklist; **no interactive Pass/Fail tool** |
| ParcelPath | https://parcelpath.com/fba-box-size-limit/ | SEO article + shipping CTA; **no checker** |
| Project FBA | https://projectfba.com/amazon-oversize/ | Rules tables; no calculator |
| CrateFit | https://cratefit.com/calculator/size-tier | **Product size-tier / fees** (not inbound carton); free tip → $19–25/mo pack optimizer |
| Nventory / CBM3 / Mistorify | various | **FBA fee / size tier** calculators — different job |
| DimWeigh | https://dimweigh.com/tools/calculator | Carrier DIM / girth — adjacent, not FBA inbound |

### Wedge (one line)

Interactive **inbound carton** Pass/Fail for **FBA vs AWD** (36×25×25 vs 25×25×25) — most SERP results are blogs or product-tier fee tools, not this job.

## Feature parity

| Feature | GoAura (blog) | CrateFit (tier) | DimWeigh | Us v1 |
|---------|:-------------:|:---------------:|:--------:|-------|
| Interactive L×W×H×weight input | ❌ | ✅ (product) | ✅ (carrier) | **must** |
| Inbound FBA carton max (36×25×25, 50 lb) | ✅ text | ❌ | ❌ | **must** |
| AWD carton max (25×25×25, 50 lb) toggle | ✅ text | ❌ | ❌ | **must** |
| Pass / Fail with failing rule named | ❌ | n/a | n/a | **must** |
| Sort sides (longest = length) | — | ✅ | ✅ | **must** |
| Min box size note (6×4×1) | ✅ | ❌ | ❌ | **must** |
| Weight >50 → Team Lift / single-item note | ✅ text | ❌ | ❌ | **must** |
| Weight >100 → Mechanical Lift note | ✅ text | ❌ | ❌ | **should** |
| in/lb and cm/kg units | — | ✅ | ✅ | **must** |
| Batch multiple cartons | — | paid packing | ✅ multi pkg | **should** (free soft cap) |
| SEO rules table + FAQ + disclaimer | ✅ | partial | ✅ | **must** |
| Product FBA fee size-tier estimate | — | ✅ | ❌ | **won't** (v1) |
| 3D bin packing / placement fees | — | paid | ❌ | **won't** |
| Account / upload | ❌ | optional | ❌ | **won't** |

## Amazon rules to encode (US defaults — document “as of” on page)

Sources reviewed: Seller Central forum (length change Jun 20, 2025), GoAura / ParcelPath / Project FBA summaries. Always disclaimer: confirm in Seller Central.

### Program: FBA (small parcel inbound)

| Rule | Value |
|------|-------|
| Max length (longest side) | **36 in** (91.44 cm) |
| Max width | **25 in** |
| Max height | **25 in** |
| Max weight (standard) | **50 lb** (22.68 kg) |
| Min size (guide) | **6 × 4 × 1 in** |
| Min weight (guide) | **~1 lb** (warn only, not hard fail) |

### Program: AWD

| Rule | Value |
|------|-------|
| Max each side | **25 × 25 × 25 in** |
| Max weight | **50 lb** |

### Notes (UI copy, not auto-approve)

- Single oversized item may allow exceptions; tool flags “over limit — check single-oversize exception / Seller Central”.
- >50 lb: Team Lift labeling if allowed; >100 lb: Mechanical Lift.
- Not a substitute for Amazon policy; rules change by region/program.

### Check algorithm (v1)

1. Convert inputs to inches + pounds internally when metric selected.  
2. Sort three sides descending → L ≥ W ≥ H.  
3. Compare against selected program limits.  
4. Result: **Pass** | **Fail** + list of violated rules; optional **Warnings** (under min size/weight).

## Open-source reuse

| Need | Library | License | Notes |
|------|---------|---------|--------|
| Dimension / weight math | None — plain TypeScript | — | No codec needed |
| Do not | reinvent fee tier tables | — | Out of scope v1 |

## Free vs Pro ($4.99/mo)

| | Free | Pro |
|--|------|-----|
| Single-carton check | ✅ unlimited | ✅ |
| Multi-carton rows / run | Up to **5** cartons | **Unlimited** (UI practical cap ~50) |
| FBA + AWD presets | ✅ | ✅ |
| Soft Upgrade CTA | When >5 cartons queued | — |

Same site-wide Pro as Amazon Image Prep (`PRO_CHECKOUT_URL` / `#pro-upgrade`).

## Out of scope (v1)

- Product size-tier / FBA fulfillment fee estimates  
- Carrier DIM / rate quotes  
- Bin packing, pallet rules, LTL  
- Label PDF generation  
- Accounts / server  
- Non-US marketplaces as primary (can note “US-focused”)

## UX outline

1. H1 + privacy/no-upload (numbers stay in browser)  
2. Program toggle: **FBA** | **AWD**  
3. Units: in/lb | cm/kg  
4. Carton row(s): L, W, H, weight (+ Add carton, free max 5)  
5. **Check** → Pass/Fail cards per carton  
6. Rules reference table (FBA vs AWD) + last-reviewed date  
7. FAQ (SEO)  
8. Soft Pro CTA when free multi-carton cap hit  
9. Disclaimer + link stub for Seller Central docs  

## SEO

| Field | Copy (draft) |
|-------|----------------|
| Title | Amazon FBA Box Size Checker — 36×25×25 Pass/Fail (Free) |
| H1 | Amazon FBA Box Size Checker |
| Description | Check inbound carton dimensions and weight against Amazon FBA and AWD box limits. Instant Pass/Fail in your browser — no signup. |
| FAQ topics | What is FBA box size limit 2026?; FBA vs AWD box size; what if over 50 lb?; can box exceed 36 inches?; min box size |

## Acceptance criteria

- [x] Client-side only; no network upload of measurements  
- [x] FBA: fail when longest >36 OR either other side >25 OR weight >50 (standard path)  
- [x] AWD: fail when any side >25 OR weight >50  
- [x] Sides sorted so longest is treated as length  
- [x] in/lb and cm/kg both work  
- [x] Multi-carton free cap 5 with Pro CTA (same pattern as Amazon Prep)  
- [x] SEO: title, H1, rules table, FAQ, disclaimer  
- [x] Homepage Tools card links to this tool  
- [x] `npm run test:fba-box` E2E covers must cases; Test log filled  

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-07-25 | page title / H1 / FAQ / rules table | pass | |
| 2026-07-25 | homepage links to tool | pass | |
| 2026-07-25 | default 20×16×12@28lb Pass FBA | pass | |
| 2026-07-25 | 40in length Fail + names rule | pass | |
| 2026-07-25 | sorted 10×30×20 Pass FBA | pass | |
| 2026-07-25 | AWD fails 30in length | pass | |
| 2026-07-25 | metric 50×40×30cm Pass FBA | pass | |
| 2026-07-25 | free cap 5 + Pro CTA | pass | |
| 2026-07-25 | no measurement body uploads | pass | |
| 2026-07-25 | `npm run test:fba-box` | pass | 16/16 |
