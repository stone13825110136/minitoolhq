# SellTool HQ

**Domain:** https://selltoolhq.com  
**Legacy:** https://minitoolhq.com → 301 to new domain (see `docs/MIGRATION-SELLTOOLHQ.md`)  
**Positioning:** Free, private, browser-based micro tools for creators & sellers (US/English).  
**Monetization:** Display ads only — every tool fully free (no Pro / $4.99).

> Files stay on your device. No signup. No paid unlocks. See [docs/POSITIONING.md](./docs/POSITIONING.md).

## Status

- Domain: **selltoolhq.com** (Aliyun DNS) — separate from hotpicklab; old minitoolhq.com 301s over
- Scaffold: Astro in `super-shell/`
- Process frozen: research → SEO keywords → reuse OSS → spec → build feature+SEO together → test
- Shipped: Marketplace Image Resizer, HEIC to JPG, FBA Box Size Checker

## Quick start

```bash
cd super-shell
npm install
npm run dev
```

## Docs

- [Tool development workflow (frozen)](./docs/TOOL-DEV-WORKFLOW.md)
- [Session handoff](./docs/SESSION-HANDOFF.md)
- Deploy + traffic pipeline: [DEPLOY.md](./DEPLOY.md) + [TRAFFIC-PLAYBOOK.md](./TRAFFIC-PLAYBOOK.md)

- [Competitor checklist](./docs/COMPETITOR-CHECKLIST.md)
- [Spec 01 — Amazon Image Prep](./docs/specs/01-amazon-image-prep.md)

## Agent rules

- `.cursor/rules/minitool-seo-expert.mdc` — SEO work must use SEO expert skill
- `.cursor/skills/minitool-seo-expert/SKILL.md` — SEO expert workflow
- `docs/TRAFFIC-PLAYBOOK.md` — traffic / IndexNow / GSC pipeline

## Deploy

Domain on **Aliyun DNS**; site on Cloudflare Pages. See [docs/DEPLOY.md](./docs/DEPLOY.md).
