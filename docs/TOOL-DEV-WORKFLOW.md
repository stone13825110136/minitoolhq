# Tool Development Workflow (frozen)

Every MiniTool HQ tool follows this process. No coding before a build spec exists.

## Product principles

| Item | Decision |
|------|----------|
| Brand | selltoolhq.com (SellTool HQ) — English / US; legacy minitoolhq.com 301s |
| Form | Web tools only first (not PWA) |
| Privacy default | Process in browser; no file upload servers |
| Ship rhythm | One tool → validate → keep adding |
| Monetization | **Ads only** — all tools fully free (no Pro / $4.99) |
| Marketplace | Help others publish tools **later**, after traffic |
| hotpicklab | Unrelated — keep separate |

## Steps (mandatory)

### 1. Keyword (mandatory — see `.cursor/rules/minitool-seo-keywords.mdc`)

- Primary keyword (what users type)
- Secondary keywords (**≥3** long-tails)
- Job-to-be-done in one sentence
- Draft Title / H1 / meta description / ≥5 FAQ questions that mirror searches

**Gate:** a tool with no discoverable keywords is worthless — do not skip this step or defer SEO.

### 2. Competitor research (30–60 min)

1. Search the primary keyword
2. Open top **3–5** competitors
3. Fill a **feature parity** table:

| Feature | Comp A | Comp B | Comp C | Us v1 |
|---------|--------|--------|--------|-------|
| … | ✅/❌ | ✅/❌ | ✅/❌ | must / should / won't |

4. Note: upload? signup? limits? ads? missing wedge?
5. Optional: run a competitor-research agent/skill ([competitor-research-skill-kit](https://github.com/750928465/competitor-research-skill-kit) or Cursor web fetch)

### 3. Open-source reuse (do not reinvent)

Search before writing codecs:

| Need | Look at first |
|------|----------------|
| Compress / resize | browser-image-compression, compresso, Canvas |
| HEIC | heic-to, heic2any |
| Quality codecs | jSquash (Squoosh WASM) |
| ZIP | fflate, JSZip |
| EXIF read | exifr |
| Multi-tool core | [nouploads](https://github.com/nouploads/nouploads) (MIT) |

Record chosen libs + license in the build spec.

### 4. Build spec

Create `docs/specs/NN-tool-slug.md` using the template below.  
Coding starts only after the spec is merged/accepted.

### 5. Implement (feature + SEO in the same ship)

- Prefer Astro (or existing `super-shell`) + client JS/TS
- **All tools fully free** — no Pro subscription, no paid batch unlock
- Ship tool page **with** full SEO in the same change: Title, H1, description, FAQ (≥5), FAQPage JSON-LD = all FAQs, WebApplication JSON-LD, homepage card, sitemap URL
- Customer voice only — see `.cursor/rules/minitool-customer-copy.mdc` and `.cursor/rules/minitool-seo-keywords.mdc`
- Prefer one `faqs` array in the `.astro` page that renders both HTML FAQ and JSON-LD (no drift)

### 6. Feature test (mandatory — before “shipped”)

`npm run build` alone does **not** count. After coding:

1. Start the app (`npm run dev` or preview) **or** run the tool’s automated E2E script
2. Walk every **must** row in the feature parity table
3. Walk every acceptance-criterion checkbox in the spec
4. For file tools: use real sample files (batch ≥2); confirm download / output
5. For privacy tools: confirm no upload of file bytes (Network tab or equivalent)
6. Confirm there is **no Pro / paid upsell** on the page (ads-only model)
7. **SEO gate:** title + meta description contain primary keyword; FAQ ≥5; FAQPage JSON-LD question count ≥ on-page FAQ count; H1 present
8. Fix failures, re-test
9. Append a **Test log** section to the tool spec (`date`, cases, pass/fail)

Tool E2E examples: `cd super-shell && npm run test:amazon-prep` / `test:fba-box`  
Future tools: add `npm run test:<slug>` with the same SEO assertions.

Do not update roadmap status to **shipped** until feature **and** SEO gates pass.

Site-wide (links, anchors, SEO assets, homepage content — not tool feature depth):  
`cd super-shell && npm run test:site`  
Live: `BASE_URL=https://selltoolhq.com npm run test:site` (PowerShell: `$env:BASE_URL='https://selltoolhq.com'; npm run test:site`)

### 7. After ship

- Add tool to site directory / homepage
- Update `docs/TOOL-ROADMAP.md` status
- Pick next tool → restart at step 1

## Spec template

```markdown
# NN — Tool Name

## Meta
- Slug / URL:
- Primary keyword:
- Secondary keywords: (list ≥3)
- Status: draft | ready | shipped

## Job
One sentence.

## Competitors researched
| Site | URL | Notes |
|------|-----|-------|

## Feature parity
| Feature | … | Us v1 |
|---------|---|-------|

## Open-source reuse
| Need | Library | License |
|------|---------|---------|

## Monetization
- **Fully free** + site ads (no Pro / no paid batch)

## Out of scope (v1)
- …

## SEO (mandatory — ship with v1)
- Title:
- H1:
- Meta description:
- Secondary phrases used in lede / table / FAQ:
- FAQ topics (≥5 search-shaped questions):

## Acceptance criteria
- [ ] Feature musts…
- [ ] Title + meta description include primary keyword
- [ ] FAQ ≥5; FAQPage JSON-LD matches all FAQs
- [ ] Homepage Tools card + sitemap URL
- [ ] E2E includes SEO assertions

## Test log
| Date | Case | Result | Notes |
|------|------|--------|-------|
| | | pass/fail | |
```

## Suggested build order

1. Amazon Image Prep ← current
2. Image Compressor
3. HEIC → JPG
4. Strip EXIF (standalone)
5. Etsy / Shopify presets
6. UTM Builder
