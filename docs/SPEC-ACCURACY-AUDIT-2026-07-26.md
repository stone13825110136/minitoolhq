# Spec accuracy audit — shipped tools

**Date:** 2026-07-26  
**Rule:** `.cursor/rules/minitool-spec-accuracy.mdc`

| Tool | Verdict | Action taken |
|------|---------|--------------|
| Marketplace Image Prep | **Pass after fix** | Amazon / Etsy / TikTok / eBay / Shopify defaults OK; **Walmart 2000→2200** to match Marketplace Learn |
| FBA Box Size Checker | **Pass** | FBA 36×25×25 / 50 lb and AWD 25×25×25 match SC Jun 2025 threads + SERP |
| HEIC → JPG | **Pass** | JPEG output correct for listing uploads; no invented platform px on this tool |

Full tables live in:

- [specs/03-marketplace-image-prep.md](./specs/03-marketplace-image-prep.md) § Spec accuracy  
- [specs/02-fba-box-size-checker.md](./specs/02-fba-box-size-checker.md) § Spec accuracy  
- [specs/04-heic-to-jpg.md](./specs/04-heic-to-jpg.md) § Spec accuracy  

**Policy reminders coded as intentional (not bugs):**

- Amazon/eBay **maxBytes 5 MB** while official caps are higher (10–12 MB) — conservative for upload reliability  
- TikTok default **1200** (above official **600** min) — matches seller prep competitors  
- Always “confirm in Seller Central” on UI / guides  
