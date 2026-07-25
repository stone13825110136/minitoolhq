# Deploy — minitoolhq.com (domain on Aliyun)

Domain stays on **Aliyun DNS**. Hosting can be Cloudflare Pages (recommended) or another static host.

## Architecture

```
Browser → minitoolhq.com (Aliyun DNS) → CNAME → xxx.pages.dev (Cloudflare Pages)
```

You do **not** need to transfer the domain away from Aliyun.

## 1. Push this repo to GitHub

```bash
git add -A
git commit -m "Ship Amazon Image Prep and site scaffold"
git push origin main
```

## 2. Cloudflare Pages (first time)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → Connect GitHub `stone13825110136/minitoolhq`
2. Build settings:

| Setting | Value |
|---------|--------|
| Root directory | `super-shell` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` (Environment variable `NODE_VERSION=22`) |

3. Deploy → note the URL, e.g. `https://minitoolhq.pages.dev`

## 3. Aliyun DNS (万网 / 云解析)

Console: **阿里云** → **云解析 DNS** → domain `minitoolhq.com`

Add records (Cloudflare will show the exact target; often `minitoolhq.pages.dev` or a `*.cdn.cloudflare.net` host):

| 主机记录 | 类型 | 记录值 | 说明 |
|----------|------|--------|------|
| `@` | CNAME | `minitoolhq.pages.dev` | apex — if Aliyun allows CNAME on @ |
| `www` | CNAME | `minitoolhq.pages.dev` | www |

**If apex `@` cannot be CNAME** on Aliyun:

- Use Cloudflare **Custom domain** wizard (it may give flattened CNAME / A targets), **or**
- Point only `www` first, and redirect `@` → `www` with a URL 显性/隐性转发 (Aliyun 域名转发), **or**
- Enable Cloudflare nameservers later (optional; not required for first go-live)

TTL: 600 seconds for first setup.

## 4. Cloudflare custom domain

Pages project → **Custom domains** → add `minitoolhq.com` and `www.minitoolhq.com` → follow DNS instructions → wait for SSL (usually minutes).

## 5. Smoke check online

- Open `https://minitoolhq.com/tools/amazon-image-prep` (or `*.pages.dev` before DNS)
- Drop 2 images → ZIP downloads
- DevTools Network: no image upload

## Alternative: direct upload (no Git connect)

```bash
cd super-shell
npm run build
npx wrangler pages deploy dist --project-name=minitoolhq
```

Requires `npx wrangler login` once in the browser.
