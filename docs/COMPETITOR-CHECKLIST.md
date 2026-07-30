# Competitor checklist (30–60 min per tool)

**Required before coding.** Full process: [TOOL-DEV-WORKFLOW.md](./TOOL-DEV-WORKFLOW.md).  
Cursor rule: `.cursor/rules/minitool-dev-workflow.mdc`.

## Steps

1. Google the main keyword (e.g. `amazon product image resize`)
2. Open top 3–5 results
3. Fill **quick scan** table + **feature parity** table
4. Search GitHub/npm for reusable libs (MIT/Apache preferred)
5. Write one-line wedge + monetization (**fully free + ads**)
6. Lock **primary + ≥3 secondary keywords**, Title, H1, description, ≥5 FAQ questions (see `.cursor/rules/minitool-seo-keywords.mdc`)
7. **Spec accuracy (format / size / limits tools)** — fill bidirectional table: official Seller Central/Help + core competitors; lock defaults only after reconcile (rule: `.cursor/rules/minitool-spec-accuracy.mdc`)
8. Create `docs/specs/NN-tool-slug.md` — then code feature **and** SEO together

Optional: competitor-research agent/skill  
https://github.com/750928465/competitor-research-skill-kit

## Spec accuracy (when tool claims format, px, MB, L×W×H, weight)

| Platform / claim | Official source (URL + date) | Competitor check (top tools/guides) | Our v1 default | Notes |
|------------------|------------------------------|-------------------------------------|----------------|-------|
| | | | | |

## Quick scan

| Competitor | Upload to server? | Signup? | Limits | Ads / UX pain | Missing feature |
|------------|-------------------|---------|--------|---------------|-----------------|
| | | | | | |
| | | | | | |
| | | | | | |

## Feature parity

| Feature | Comp A | Comp B | Comp C | Us v1 (must/should/won't) |
|---------|--------|--------|--------|---------------------------|
| | | | | |
| | | | | |

## Open-source reuse

| Need | Candidate lib | License | Use in v1? |
|------|---------------|---------|------------|
| | | | |

## Our wedge (fill before build)

- One-line difference:
- Monetization (fully free + ads):
- Primary keyword:
- Secondary keywords (≥3):
- Primary SEO title:
- Meta description draft:

## Market pain signals

1. Hate uploading sensitive files to random servers  
2. Free tier limits and signup walls  
3. Prefer free tools + ads over subscriptions  
4. Vertical workflow tools convert better than generic suites  
5. AI wrappers without a specific job are ignored  

## Volume vs money

| Type | Examples | Note |
|------|----------|------|
| High volume | Compress, HEIC, Amazon prep | Privacy + batch wedge; **ads** |
| Higher intent | UTM, listing checkers | Add after image line has traffic |
