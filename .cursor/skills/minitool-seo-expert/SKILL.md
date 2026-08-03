---
name: minitool-seo-expert
description: >-
  SellTool HQ SEO expert pass — full on-page, technical, and internal-link SEO for
  selltoolhq.com. Use when the user says seo专家, SEO expert, 全面SEO, SEO audit,
  or asks to improve search ranking / indexing for SellTool HQ tools or guides.
---

# SellTool HQ — SEO Expert

Read this skill **before** changing SEO on SellTool HQ. Repo root: `minitoolhq/` (Astro app in `super-shell/`). Live host: **https://selltoolhq.com** (legacy `minitoolhq.com` → 301 only).

## Hard constraints

1. Follow `.cursor/rules/minitool-seo-keywords.mdc` (Title/H1/FAQ/JSON-LD gate).
2. Follow `.cursor/rules/minitool-customer-copy.mdc` — **never** put ads, Pro, $4.99, or “how we make money” on customer pages.
3. **One job = one tool.** Do not split marketplace image prep into separate tools for SEO.
4. Internal strategy lives in `docs/POSITIONING.md` only — not on the site.
5. URL shape: **no trailing slash** (`trailingSlash: 'never'`). Keep canonical, links, and sitemap aligned. (CF may *serve* a slash; canonical + sitemap must stay bare.)

## Workflow (run in order)

### 1. Keyword lock

For each page (tool or guide), confirm in spec or page frontmatter:

| Field | Required |
|-------|----------|
| Primary keyword | 1 search phrase |
| Secondary | ≥3 long-tails |
| Title | Primary; ~≤60 chars |
| H1 | Primary or natural variant |
| Meta description | Primary + ≥1 secondary; ~≤160 chars |
| FAQ | ≥5 search-shaped questions |

Docs: `docs/specs/NN-*.md`, `docs/SEO-GUIDE-CLUSTER.md`, `docs/TRAFFIC-PRIORITY.md`.

### 2. On-page gate (tools)

Ship together with the feature:

- `<title>` + meta + canonical + OG/Twitter via `BaseLayout`
- H1 + lede with primary/secondary phrases (no stuffing)
- FAQ ≥5; FAQPage JSON-LD = same array
- WebApplication JSON-LD (`offers.price: "0"`)
- Homepage card + sitemap URL
- E2E asserts title/meta/H1/FAQ/JSON-LD

### 3. Technical SEO

- Sitemap via `@astrojs/sitemap` — **filter out** redirect-only paths (`/tools/amazon-image-prep`, `/tools/tiktok-shop-image-prep`)
- Redirect stubs: `noindex` if they still emit HTML; CF `_redirects` / middleware for 301
- `robots.txt` points at `sitemap-index.xml`
- Default `og:image` / `twitter:image` sitewide
- BreadcrumbList JSON-LD on tools and guides

### 4. Internal link cluster

- Guides → tools (CTA with correct `?platform=` ids, e.g. `tiktok-shop` not `tiktok`)
- Tools → related guides
- Homepage lists all live guides
- Nav may link Guides lightly — not a dashboard

### 5. Verify

- `cd super-shell && npm run test:site` (and tool E2E if page changed)
- Assert sitemap has tools + all guides; **excludes** redirect stubs; **no trailing slash** on locs
- Live: `$env:BASE_URL='https://selltoolhq.com'; npm run test:site`
- Build + deploy Cloudflare Pages when user wants live

### 6. Post-deploy indexing checklist (give user)

1. Run `npm run indexnow` (or `npm run deploy:pages` which includes it) — Bing/Yandex IndexNow  
2. GSC: sitemap + request index for **new** canonical URLs only  
3. Canonical URL list (update when shipping tools/guides):

```
https://selltoolhq.com/
https://selltoolhq.com/tools/marketplace-image-prep
https://selltoolhq.com/tools/heic-to-jpg
https://selltoolhq.com/tools/png-to-jpg
https://selltoolhq.com/tools/webp-to-jpg
https://selltoolhq.com/tools/image-compressor
https://selltoolhq.com/tools/listing-character-counter
https://selltoolhq.com/tools/fba-box-size-checker
https://selltoolhq.com/guides/amazon-product-image-size
https://selltoolhq.com/guides/etsy-listing-photo-size
https://selltoolhq.com/guides/tiktok-shop-image-size
https://selltoolhq.com/guides/amazon-fba-box-size-limits
https://selltoolhq.com/guides/amazon-dimensional-weight
https://selltoolhq.com/guides/heic-to-jpg-for-amazon
https://selltoolhq.com/guides/heic-to-jpg-for-etsy
https://selltoolhq.com/guides/heic-to-jpg-for-tiktok-shop
https://selltoolhq.com/guides/png-to-jpg-for-amazon
https://selltoolhq.com/guides/amazon-title-character-limit
https://selltoolhq.com/guides/amazon-item-highlights
https://selltoolhq.com/guides/etsy-title-character-limit
https://selltoolhq.com/guides/compress-image-for-amazon
https://selltoolhq.com/guides/compress-image-to-100kb
https://selltoolhq.com/guides/webp-to-jpg
https://selltoolhq.com/guides/jpg-to-png
```

Full traffic levers: `docs/TRAFFIC-PLAYBOOK.md`. Skip redirect URLs (`/tools/amazon-image-prep`, `/tools/tiktok-shop-image-prep`).

## Related docs

- `docs/TRAFFIC-PLAYBOOK.md` — GSC / Bing / IndexNow / directories / ads phases
- `docs/TRAFFIC-PRIORITY.md` — which products pull volume
- `docs/SEO-GUIDE-CLUSTER.md` — guide → tool CTA map

## Audit output format

When user asks for an SEO audit, return:

1. **MUST FIX** (indexing/correctness)
2. **SHOULD** (cluster/CTR)
3. **WON'T** (low ROI this pass)

Then implement MUST + agreed SHOULD unless user says audit-only.

## Do not

- Add `meta keywords`
- Create duplicate tools for keyword variants
- Promise rankings; optimize for crawl, relevance, and cluster strength
