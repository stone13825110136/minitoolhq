# Session Handoff — MiniTool HQ

Updated 2026-07-25 from product discussion + first-tool spec.

## Decisions already made

| Topic | Decision |
|-------|----------|
| Brand / domain | **minitoolhq.com** (Aliyun DNS) — separate from hotpicklab |
| Product form | Web tools only first (not PWA, not native) |
| Market | English / US |
| Strategy | Self-operated multi-tool site; **ship one → keep adding**; marketplace later |
| Monetization | **Ads only** — all tools free; **$4.99 Pro cancelled** |
| vs HotPickLab | Utilities only here; naming + tarot Lab = hotpicklab.com — [BRAND-BOUNDARY.md](./BRAND-BOUNDARY.md) |
| Tech | Prefer in-browser / local processing; reuse open-source libs |
| Process | Frozen in [TOOL-DEV-WORKFLOW.md](./TOOL-DEV-WORKFLOW.md) + `.cursor/rules/minitool-dev-workflow.mdc` + **SEO gate** `.cursor/rules/minitool-seo-keywords.mdc` |
| First tool | **Amazon Image Prep** — [specs/01-amazon-image-prep.md](./specs/01-amazon-image-prep.md) |

## What NOT to do first

- Do not rebuild as PWA yet
- Do not start with generic ChatGPT wrappers
- Do not build full PDF suites / Shopify App on day 1
- Do not open “submit a tool” marketplace before traffic
- Do not code a tool without competitor parity + reuse scan + spec

## Growth focus (current)

**Core acquisition = SEO on tool pages** (not ads). Ship keyword-aligned tool URLs → Search Console → more vertical tools.

## Immediate next steps

1. ~~Implement + feature-test `01-amazon-image-prep`~~ — E2E 21/21 pass (`npm run test:amazon-prep`)  
2. ~~Deploy Cloudflare Pages + DNS~~ — live at https://minitoolhq.com (fix www 522 if still broken)  
3. **Traffic:** verify sitemap + submit https://minitoolhq.com in Google Search Console  
4. AdSense / display ads after traffic — **no Pro checkout**  
5. Next SEO tools per [TOOL-ROADMAP.md](./TOOL-ROADMAP.md) / [TRAFFIC-PRIORITY.md](./TRAFFIC-PRIORITY.md)

## Related repos

- https://github.com/stone13825110136/minitoolhq — this site  
- https://github.com/stone13825110136/hotpicklab — keep separate  
- https://github.com/stone13825110136/hotpicklab-pain-research — research only  

## Local path (this PC)

`D:\小工具\minitoolhq`
