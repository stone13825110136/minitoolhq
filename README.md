# MiniTool HQ

**Domain:** https://minitoolhq.com  
**Positioning:** Free, private, browser-based micro tools for creators & sellers (US/English).

> Files stay on your device. No signup required for core tools.

## Status

- Domain: **minitoolhq.com** (Aliyun DNS) — separate from hotpicklab
- Scaffold: Astro in `super-shell/`
- Process frozen: research → SEO keywords → reuse OSS → spec → build feature+SEO together → test
- Shipped: Amazon Product Image Resizer, FBA Box Size Checker

## Quick start

```bash
cd super-shell
npm install
npm run dev
```

## Docs

- [Tool development workflow (frozen)](./docs/TOOL-DEV-WORKFLOW.md)
- [Session handoff](./docs/SESSION-HANDOFF.md)
- [Tool roadmap](./docs/TOOL-ROADMAP.md)
- [Competitor checklist](./docs/COMPETITOR-CHECKLIST.md)
- [Spec 01 — Amazon Image Prep](./docs/specs/01-amazon-image-prep.md)

## Agent rules

- `.cursor/rules/minitool-dev-workflow.mdc` — always apply; no coding without a spec
- `.cursor/rules/minitool-seo-keywords.mdc` — SEO/long-tail gate; ship with every tool
- `.cursor/rules/minitool-customer-copy.mdc` — customer-facing copy only

## Deploy

Domain on **Aliyun DNS**; site on Cloudflare Pages. See [docs/DEPLOY.md](./docs/DEPLOY.md).
