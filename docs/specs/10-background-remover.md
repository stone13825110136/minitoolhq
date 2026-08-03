# 10 — Background Remover → White Product Background

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/background-remover` |
| Primary keyword | remove background |
| Secondary keywords | white background product photo, amazon white background, remove background white background, product photo background remover, change background to white |
| Status | **shipped** (2026-08-03) |
| Stack (proposed) | `@huggingface/transformers` + Apache-2.0 ONNX model (see below); Canvas composite; fflate ZIP |

## Job

> Drop product photos → AI removes background in the browser → export **pure white (#FFFFFF) JPG** (Amazon main-image default) or transparent PNG → batch ZIP, no upload.

## Keyword lock

| Field | Value |
|-------|--------|
| Primary | remove background |
| Title | Remove Background — White Product Photos (Free) |
| H1 | Remove Background for Product Photos |
| Meta | Free remove background tool in your browser. Make Amazon-ready white backgrounds (#FFFFFF) or transparent PNG — batch ZIP, no upload. |
| FAQ | ≥5 (Amazon white bg, #FFFFFF, batch, privacy, quality limits, next resize step) |

## Competitors researched

| Site | URL | Notes |
|------|-----|-------|
| PhotoRoom | photoroom.com | Strong Amazon LP; upload / account funnel; brand heavy |
| Backgroundless | backgroundless.io | Free bulk claim; white RGB 255; browser-local messaging |
| BG Clear | bgclear.ai | Product-photo / Amazon #FFFFFF angle |
| remove.bg | remove.bg | Category leader; credits / paid HD |
| addyosmani/bg-remove | bg.addy.ie | MIT demo; Transformers.js; RMBG-1.4 (license caveat) |

### Feature parity

| Feature | PhotoRoom | Backgroundless | remove.bg | Us v1 |
|---------|-----------|----------------|-----------|-------|
| Remove BG | ✅ | ✅ | ✅ | **must** |
| Pure white #FFFFFF export | ✅ | ✅ | ✅ | **must** (default) |
| Transparent PNG | ✅ | ✅ | ✅ | **must** |
| Batch + ZIP | paid / limited | claimed free | paid | **must** free |
| No upload (local) | ❌/mixed | claimed | ❌ | **must** |
| No signup / no watermark | funnel | claimed | watermark free tier | **must** |
| Brush / refine mask | ✅ | ✅ | ✅ | **won't** v1 |
| AI scene replace | ✅ | sometimes | ❌ | **won't** v1 |
| Auto resize to Amazon 2000 | sometimes | sometimes | ❌ | **should** CTA → Marketplace Resizer (not duplicate) |

### Wedge

**Seller-first:** default **Amazon main-image white (#FFFFFF) JPG**, fully free batch ZIP, privacy (no upload), then deep-link Marketplace Image Resizer. Avoid generic “AI magic” copy.

## Open-source reuse (license-critical)

| Need | Choice | License | Notes |
|------|--------|---------|-------|
| Inference runtime | `@huggingface/transformers` | Apache-2.0 | Prefer WASM; WebGPU optional later |
| Model | `onnx-community/ormbg-ONNX` (or `schirrmacher/ormbg`) | **Apache-2.0** | Commercial-friendly |
| ZIP | existing `fflate` path | MIT | Reuse compressor/convert ZIP helpers |
| Composite white / PNG | Canvas 2D | — | Fill #FFFFFF under cutout |

### Do **not** use (without paid license / legal review)

| Package / model | Why |
|-----------------|-----|
| `@imgly/background-removal` | **AGPL-3.0** — risky for closed ads site |
| `briaai/RMBG-1.4` | **Non-commercial** without BRIA commercial license |

Self-host or pin model assets where practical (first-load ~tens–hundreds MB; show progress; cache in browser).

## Monetization

Fully free + site ads (no Pro / no paid HD unlock).

## Out of scope (v1)

- Server-side inference API
- Manual brush / magic wand refine
- Lifestyle / AI scene backgrounds
- Video / GIF
- HEIC input (point to HEIC→JPG first)
- Guaranteeing Amazon 85% fill / auto-crop (document + CTA to Resizer)

## SEO (mandatory — ship with v1)

- Title / H1 / meta as locked above
- Secondary phrases in lede + table (Amazon white background, #FFFFFF / RGB 255,255,255)
- FAQ ≥5 search-shaped; FAQPage JSON-LD = all FAQs
- WebApplication JSON-LD, price 0
- Homepage card + RelatedTools + IndexNow + sitemap
- Guide later: `/guides/amazon-white-background` (can ship after tool)

## Spec accuracy (bidirectional)

| Platform / claim | Official source (URL + date) | Competitor check | Our v1 default | Notes |
|------------------|------------------------------|------------------|----------------|-------|
| Amazon main image pure white | [Amazon Seller Central — Product image requirements](https://sellercentral.amazon.com/help/hub/reference/G200332540) (reviewed 2026-08-03): pure white background, RGB 255,255,255 | PhotoRoom / Backgroundless / BG Clear all market #FFFFFF white export | Default fill **#FFFFFF** under cutout for JPG | Confirm in Seller Central; rules can vary by category |
| Product fill ~85% of frame | Same Seller Central main-image guidance (common ~85% fill) | Resizers often pad/crop separately | **won't** auto-crop v1 | CTA → Marketplace Image Resizer |
| Main image format | JPEG preferred; PNG also listed in many categories | Competitors export JPG or PNG | Default **JPG**; optional transparent **PNG** | Transparent PNG is for design use, not Amazon main |

## FAQ topics (search-shaped, ≥5)

1. How do I remove background from a product photo?
2. How do I make an Amazon white background (#FFFFFF)?
3. Does this remove background tool upload my images?
4. Can I batch remove backgrounds and download a ZIP?
5. Can I keep a transparent PNG instead of white?
6. Why is the first run slow?
7. Does this guarantee Amazon 85% product fill?
8. Can I use HEIC here?

## Acceptance criteria

- [x] Spec accepted (2026-08-03 — white-bg first)
- [x] Remove BG on real product photo (Nike sample); white JPG look OK (manual 2026-08-03)
- [x] Transparent PNG option in UI (manual spot-check optional)
- [x] Batch ZIP; no image-byte upload (design + Network: model CDN only)
- [x] First-load model progress UI + first-run notice (~40–50 MB)
- [x] Title + meta include primary / white-background intent
- [x] FAQ ≥5 + matching FAQPage JSON-LD
- [x] Homepage + RelatedTools + IndexNow
- [x] E2E SEO gate `SKIP_BG_MODEL=1 npm run test:background-remover` (12/12); feature via manual product photo

## Hosting note (model)

| Option | Decision |
|--------|----------|
| Cloudflare Pages `public/` | **No** — ONNX weights ≥42 MB, over Pages ~25 MB/file limit |
| Cloudflare R2 | Later optional (faster CDN); not required for v1 |
| Hugging Face CDN + `dtype: q8` | **v1** — ~42 MB first download; disclose in UI/FAQ |

## Risks

| Risk | Mitigation |
|------|------------|
| Large model download | Progress UI; cache; optional self-host on Pages/R2 |
| Quality on glass / hair / white-on-white | Honest FAQ; “preview before ZIP”; no overclaim |
| AdSense / “AI” pages | Keep utility copy; avoid generative-scene claims |
| Mobile OOM | Cap max edge (e.g. 2048) before inference; clear error |

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-08-03 | SEO E2E `SKIP_BG_MODEL=1` | **pass** | 12 asserts |
| 2026-08-03 | Manual product-sample-1.jpg → white JPG | **pass** | Real sneaker; user confirmed |
| 2026-08-03 | Flat red test PNG | **fail expected** | Not a product subject; documented |

## Relationship

After ship: Marketplace Resizer (size/pad), Image Compressor, PNG/WebP convert.  
Queued after: deepen Amazon white-background guide SEO.
