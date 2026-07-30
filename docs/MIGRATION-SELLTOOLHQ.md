# Migration — minitoolhq.com → selltoolhq.com

**Brand:** SellTool HQ  
**New primary domain:** https://selltoolhq.com  
**Old domain:** https://minitoolhq.com (keep registered; 301 everything to new)

Cloudflare Pages project name stays `minitoolhq` (deploy target). Only the **public brand + custom domain** change.

## A. Code (done in repo)

- Site canonical / sitemap / OG / JSON-LD → `selltoolhq.com`
- Brand strings → **SellTool HQ**
- Mailto → `contact@selltoolhq.com`
- IndexNow host + URL list → `selltoolhq.com`

## B. Aliyun DNS — selltoolhq.com (you do this)

Console: **云解析 DNS** → domain `selltoolhq.com`

Same pattern as the old site (Cloudflare Pages will show the exact CNAME target; usually `minitoolhq.pages.dev`):

| 主机记录 | 类型 | 记录值 | TTL |
|----------|------|--------|-----|
| `@` | CNAME | `minitoolhq.pages.dev` | 600 |
| `www` | CNAME | `minitoolhq.pages.dev` | 600 |

If apex `@` cannot be CNAME on Aliyun: use URL 显性转发 `@` → `https://www.selltoolhq.com`, and only CNAME `www`.

## C. Cloudflare Pages — custom domain

1. https://dash.cloudflare.com → **Workers & Pages** → project **minitoolhq**
2. **Custom domains** → add:
   - `selltoolhq.com`
   - `www.selltoolhq.com`
3. Wait until SSL status is **Active**

## D. 301 old domain → new (required for SEO)

### Implemented — Pages Functions middleware

`super-shell/functions/_middleware.js` issues a **301** when `Host` is `minitoolhq.com` or `www.minitoolhq.com`, preserving path + query to `https://selltoolhq.com…`.

Deploy with the normal Pages pipeline (`npm run deploy:pages`). Verify:

```bash
curl -sI "https://minitoolhq.com/tools/fba-box-size-checker/"
# Expect: HTTP/2 301  and  Location: https://selltoolhq.com/tools/fba-box-size-checker/
```

### Fallback — Cloudflare Redirect Rules / Bulk Redirects

If middleware is removed, use zone Redirect Rules or Bulk Redirects:

| Source | Target | Status |
|--------|--------|--------|
| `https://minitoolhq.com/*` | `https://selltoolhq.com/$1` | 301 |
| `https://www.minitoolhq.com/*` | `https://selltoolhq.com/$1` | 301 |

## E. Deploy

```bash
cd super-shell
npm run test:site
npm run deploy:pages
```

## F. Search consoles

1. **Google Search Console** — add property `https://selltoolhq.com` → verify → submit `https://selltoolhq.com/sitemap-index.xml` → request index for homepage + tools  
2. Keep old property temporarily; confirm 301s in URL Inspection  
3. **Bing** — add site + sitemap; IndexNow runs via `deploy:pages`  
4. Optional: set email forwarding / mailbox for `contact@selltoolhq.com` (Aliyun 企业邮箱 or Cloudflare Email Routing)

## G. What not to do

- Do not delete `minitoolhq.com` for at least 6–12 months (301 juice)
- Do not run ads on the old brand name
- Do not leave old canonicals pointing at minitoolhq after cutover
