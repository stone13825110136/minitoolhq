# 09 — WebP to JPG (thin SEO landing)

## Meta

| Field | Value |
|-------|--------|
| Slug / URL | `/tools/webp-to-jpg` |
| Primary keyword | webp to jpg |
| Secondary keywords | convert webp to jpg, webp to jpeg, batch webp to jpg, webp to jpg no upload |
| Status | shipped (thin landing) |
| Stack | Static Astro page → CTA to `/tools/png-to-jpg?out=jpg` |

## Job

> SEO entry for people searching **webp to jpg**. Conversion runs on the PNG / JPG / WebP hub with JPG pre-selected.

## Relationship to `/tools/png-to-jpg`

**Same product job.** Do **not** ship a second full converter UI. This URL keeps the `webp to jpg` SERP landing; the hub owns presets, `?out=`, and ZIP.

## Keyword lock

| Field | Value |
|-------|--------|
| Primary | webp to jpg |
| Title | WebP to JPG Converter - Free Batch (No Upload) |
| H1 | WebP to JPG Converter |
| Meta | Free WebP to JPG converter for marketplace uploads. Opens our PNG / JPG / WebP hub with JPG selected — batch ZIP, no upload. |
| FAQ | ≥5 |

## Acceptance

- [x] Thin page: title/H1/meta/FAQ/JSON-LD
- [x] Primary CTA → `/tools/png-to-jpg?out=jpg`
- [x] No `#formatFiles` drop zone on this page
- [x] Homepage does **not** list a separate WebP tool card
- [x] Guide CTA points to hub `?out=jpg`
- [x] E2E `npm run test:webp-to-jpg`

## Test log

| Date | Case | Result | Notes |
|------|------|--------|-------|
| 2026-08-11 | Thin landing + hub CTA | PASS | e2e webp + site |
