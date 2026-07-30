# Deploy — selltoolhq.com (domain on Aliyun)

Primary site: **https://selltoolhq.com** (SellTool HQ).  
Cloudflare Pages project name: `minitoolhq` (legacy project id — fine to keep).

Migration checklist (DNS + 301 from old domain): [MIGRATION-SELLTOOLHQ.md](./MIGRATION-SELLTOOLHQ.md)

## Architecture

```
Browser → selltoolhq.com (Aliyun DNS) → CNAME → minitoolhq.pages.dev (Cloudflare Pages)
minitoolhq.com → 301 → selltoolhq.com
```

## Deploy + IndexNow

```bash
cd super-shell
npm run deploy:pages
```

Builds → Cloudflare Pages (`minitoolhq`) → IndexNow for **selltoolhq.com**.

Requires `npx wrangler login` once.

## After every deploy

1. Confirm `https://selltoolhq.com` returns 200  
2. Confirm old URLs 301 to new host  
3. GSC: request index for **new** URLs only when shipping pages  
4. IndexNow key must be live: `/a7f3c91e4b2d4e8f9c1a6d5e8f0b2a3c11.txt` on selltoolhq.com  

Full traffic notes: [TRAFFIC-PLAYBOOK.md](./TRAFFIC-PLAYBOOK.md).
