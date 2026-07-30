# MiniTool HQ — Positioning (locked)

**Updated:** 2026-07-26  

## Positioning

> Private browser tools for creators & sellers.  
> **Every tool is free. Revenue = display ads.**

| Item | Decision |
|------|----------|
| Brand / domain | **selltoolhq.com** (SellTool HQ) — English / US. Old `minitoolhq.com` → 301 only. |
| Product | Focused web tools (marketplace images, HEIC, box size, …) |
| Privacy | Process in browser; no file-upload servers |
| **Monetization** | **Ads only** |
| **Pricing** | **All tools fully free — no Pro, no $4.99, no batch paywall** |
| HotPickLab | Separate site — naming Lab only |

## Cancelled

- Site-wide Pro subscription (**$4.99/mo**) — **removed**  
- Free-tier batch caps used to upsell Pro — **removed**  
- Gumroad / Lemon Squeezy checkout for MiniTool HQ tools — **not planned**

## Implications for product & engineering

1. Do not add Pro CTAs, `#pro-upgrade`, or “Upgrade to Pro” copy on any tool page  
2. Do not slice queues with `FREE_BATCH_LIMIT` for monetization  
3. Workflow / specs / E2E must assume **fully free** tools  
4. Ads placement comes after traffic + AdSense (or equivalent) approval — product stays free regardless  

## Customer-facing copy (hard)

**Do not put this positioning on the public site.** Customers only need: free, private, in-browser, no signup.  
Do **not** mention ads, AdSense, Pro, $4.99, paywalls, or “how we make money” in UI, FAQ, homepage, or footer.

See also: [BRAND-BOUNDARY.md](./BRAND-BOUNDARY.md), [TOOL-DEV-WORKFLOW.md](./TOOL-DEV-WORKFLOW.md), `.cursor/rules/minitool-dev-workflow.mdc`
