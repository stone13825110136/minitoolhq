# Tool Development Workflow (frozen)

Every MiniTool HQ tool follows this process. No coding before a build spec exists.

## Product principles

| Item | Decision |
|------|----------|
| Brand | minitoolhq.com — English / US |
| Form | Web tools only first (not PWA) |
| Privacy default | Process in browser; no file upload servers |
| Ship rhythm | One tool → validate → keep adding |
| Monetization | Free core + **$4.99/mo** Pro (site-wide unlock) |
| Marketplace | Help others publish tools **later**, after traffic |
| hotpicklab | Unrelated — keep separate |

## Steps (mandatory)

### 1. Keyword

- Primary keyword (what users type)
- Secondary keywords (2–3)
- Job-to-be-done in one sentence

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

### 5. Implement

- Prefer Astro (or existing `super-shell`) + client JS/TS
- Free tier: usable but limited (e.g. batch cap)
- Pro $4.99: unlimited batch / advanced presets — **one subscription for all tools**
- Ship tool page + SEO/FAQ content

### 6. Feature test (mandatory — before “shipped”)

`npm run build` alone does **not** count. After coding:

1. Start the app (`npm run dev` or preview) **or** run the tool’s automated E2E script
2. Walk every **must** row in the feature parity table
3. Walk every acceptance-criterion checkbox in the spec
4. For file tools: use real sample files (batch ≥2); confirm download / output
5. For privacy tools: confirm no upload of file bytes (Network tab or equivalent)
6. Hit free-tier limits and confirm Pro CTA copy
7. Fix failures, re-test
8. Append a **Test log** section to the tool spec (`date`, cases, pass/fail)

Amazon Image Prep E2E: `cd super-shell && npm run test:amazon-prep`  
Future tools: add `npm run test:<slug>` the same way.

Do not update roadmap status to **shipped** until this step passes.

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

## Free vs Pro ($4.99)
- Free:
- Pro:

## Out of scope (v1)
- …

## SEO
- Title:
- H1:
- FAQ topics:

## Acceptance criteria
- [ ] …

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
