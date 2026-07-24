# Session Handoff — MiniTool HQ

Packaged from Cursor chat (2026-07-24) so work can continue on another machine.

## Decisions already made

| Topic | Decision |
|-------|----------|
| Brand / domain | **minitoolhq.com** (Mini Tool HQ) — bought on Aliyun |
| Old domain | `hotpicklab.com` — keep for now; do not block MiniTool HQ |
| Product form | **Web tools only** first (not PWA, not native apps) |
| Market | English / US-oriented |
| Monetization | Free core + small unlock ($5–15) via Gumroad / Lemon Squeezy; ads later if traffic exists |
| Tech cost | Prefer non-heavy-AI tools (local browser processing) — cheaper than AI token apps |
| Shipping style | Thin tools, iterate fast; user has time, wants any income |

## What NOT to do first

- Do not rebuild as PWA yet
- Do not start with generic ChatGPT wrappers
- Do not price-war to $1
- Do not build full PDF suites / Shopify App on day 1
- Do not abandon for another shiny idea mid-build

## Business context (from same chat)

Also discussed (lower priority than MiniTool HQ right now):

- Fiverr Affiliate: pays on **new buyer first order** + ~10% revshare 12 months; US bank wire OK; traffic is the hard part
- Pinterest: possible but slow; needs landing page, not raw affiliate links
- Selling websites / ebooks / Shopify stores: possible, but same traffic bottleneck
- Platform selling: Gumroad / Lemon Squeezy / Chrome Web Store later

## Immediate next steps (at home)

1. Confirm DNS for `minitoolhq.com` (Aliyun DNS is fine initially)
2. Scaffold a simple tools site (Astro recommended — familiar from hotpicklab)
3. Ship **Tool A + Tool B** first (see TOOL-ROADMAP.md)
4. Deploy (Cloudflare Pages recommended)
5. Optional: Gumroad product for Pro unlock

## Related GitHub repos (existing)

- https://github.com/stone13825110136/hotpicklab — old HotPick Lab / trends site
- https://github.com/stone13825110136/hotpicklab-pain-research — pain research notes
- This repo: **minitoolhq** (new home for the tools site)

## Local path (this PC)

`d:\做网站挣钱\minitoolhq`
