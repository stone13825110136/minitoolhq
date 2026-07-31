# 10 — Background Remover → White Product Background

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/background-remover` |
| Primary keyword | remove background |
| Secondary keywords | white background product photo, amazon white background, remove background white background, product photo background remover, change background to white |
| Status | **draft** (awaiting accept before code) |
| Stack (proposed) | `@huggingface/transformers` + Apache-2.0 ONNX model (see below); Canvas composite; fflate ZIP |

## Job

> Drop product photos → AI removes background in the browser → export **pure white (#FFFFFF) JPG** (Amazon main-image default) or transparent PNG → batch ZIP, no upload.

## Keyword lock

| Field | Value |
|-------|--------|
| Primary | remove background |
| Title | Background Remover — White Background for Product Photos (Free) |
| H1 | Background Remover for Product Photos |
| Meta | Free background remover in your browser. Make Amazon-ready white backgrounds (#FFFFFF) or transparent PNG — batch ZIP, no upload. |
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

## Acceptance criteria

- [ ] Spec accepted
- [ ] Remove BG on ≥2 sample product photos; white JPG corners ≈ #FFFFFF
- [ ] Transparent PNG option works
- [ ] Batch ZIP; no image-byte upload
- [ ] First-load model progress UI (no frozen blank page)
- [ ] Title + meta include primary / white-background intent
- [ ] FAQ ≥5 + matching FAQPage JSON-LD
- [ ] Homepage + RelatedTools + IndexNow
- [ ] E2E `npm run test:background-remover` (SEO + convert smoke; may mock/skip full model in CI if too heavy — document)

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
| | | | |

## Relationship

After ship: Marketplace Resizer (size/pad), Image Compressor, PNG/WebP convert.  
Queued after: deepen Amazon white-background guide SEO.
