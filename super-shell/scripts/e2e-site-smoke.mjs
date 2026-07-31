/**
 * Site-wide link + content smoke test (not tool feature E2E).
 * Local: builds then previews (so sitemap exists).
 * Live: BASE_URL=https://selltoolhq.com node scripts/e2e-site-smoke.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const externalBase = process.env.BASE_URL?.replace(/\/$/, "") || "";
const useLive = Boolean(externalBase);

const results = [];
function log(name, pass, notes = "") {
  results.push({ name, pass: !!pass, notes });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${notes ? ` — ${notes}` : ""}`);
}
function assert(name, cond, notes = "") {
  log(name, cond, notes);
  if (!cond) throw new Error(`Assertion failed: ${name}`);
}

async function waitForServer(url, ms = 120000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Server did not start: " + url);
}

function killServer(child) {
  try {
    if (process.platform === "win32" && child?.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true });
    } else {
      child?.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      cwd: root,
      shell: true,
      stdio: "inherit",
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

let child = null;
let base = externalBase;

if (!useLive) {
  const port = 4330;
  base = `http://127.0.0.1:${port}`;
  await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
  child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
    { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
  );
}

try {
  if (!useLive) await waitForServer(`${base}/`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  async function open(pathOrUrl) {
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${base}${pathOrUrl}`;
    // Prefer request+setContent when live CF resets browser navigations
    if (useLive) {
      const res = await page.request.get(url, { maxRedirects: 5 });
      assert(`fetch ${pathOrUrl}`, res.status() === 200, `status=${res.status()}`);
      const html = await res.text();
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      // Make relative links resolve for clicks — base tag
      await page.evaluate((b) => {
        let el = document.querySelector("base");
        if (!el) {
          el = document.createElement("base");
          document.head.prepend(el);
        }
        el.href = b + "/";
      }, base);
      return html;
    }
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    return page.content();
  }

  const pagesToVisit = [
    { path: "/", name: "homepage" },
    { path: "/tools/marketplace-image-prep", name: "marketplace prep page" },
    { path: "/tools/heic-to-jpg", name: "heic to jpg page" },
    { path: "/tools/png-to-jpg", name: "png to jpg page" },
    { path: "/tools/webp-to-jpg", name: "webp to jpg page" },
    { path: "/tools/image-compressor", name: "image compressor page" },
    { path: "/tools/listing-character-counter", name: "listing character counter page" },
    { path: "/tools/fba-box-size-checker", name: "fba box page" },
    { path: "/guides/amazon-product-image-size", name: "amazon image guide" },
    { path: "/guides/amazon-fba-box-size-limits", name: "fba box guide" },
    { path: "/guides/amazon-title-character-limit", name: "amazon title limit guide" },
    { path: "/guides/etsy-title-character-limit", name: "etsy title limit guide" },
    { path: "/guides/compress-image-for-amazon", name: "compress for amazon guide" },
    { path: "/guides/compress-image-to-100kb", name: "compress to 100kb guide" },
    { path: "/guides/webp-to-jpg", name: "webp to jpg guide" },
    { path: "/guides/jpg-to-png", name: "jpg to png guide" },
  ];

  const staticAssets = [
    "/favicon.svg",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap-index.xml",
    "/sitemap-0.xml",
    "/BingSiteAuth.xml",
    "/og-default.png",
    "/a7f3c91e4b2d4e8f9c1a6d5e8f0b2a3c11.txt",
  ];

  for (const p of pagesToVisit) {
    const res = await page.request.get(`${base}${p.path}`);
    assert(`${p.name} HTTP 200`, res.status() === 200, `status=${res.status()}`);
  }
  for (const asset of staticAssets) {
    const res = await page.request.get(`${base}${asset}`);
    assert(`asset ${asset} HTTP 200`, res.status() === 200, `status=${res.status()}`);
  }

  const robots = await (await page.request.get(`${base}/robots.txt`)).text();
  assert("robots allows crawl", /Allow:\s*\//i.test(robots));
  assert("robots lists sitemap", /sitemap-index\.xml/i.test(robots));

  const smIndex = await (await page.request.get(`${base}/sitemap-index.xml`)).text();
  assert("sitemap-index has sitemap-0", /sitemap-0\.xml/i.test(smIndex));
  const sm0 = await (await page.request.get(`${base}/sitemap-0.xml`)).text();
  assert("sitemap lists home", /<loc>/i.test(sm0));
  assert("sitemap lists marketplace tool", /marketplace-image-prep/i.test(sm0));
  assert("sitemap lists heic tool", /heic-to-jpg/i.test(sm0));
  assert("sitemap lists png to jpg tool", /png-to-jpg/i.test(sm0));
  assert("sitemap lists webp to jpg tool", /\/tools\/webp-to-jpg/i.test(sm0));
  assert("sitemap lists image compressor", /image-compressor/i.test(sm0));
  assert("sitemap lists listing character counter", /listing-character-counter/i.test(sm0));
  assert("sitemap lists fba tool", /fba-box-size-checker/i.test(sm0));
  assert("sitemap lists amazon image guide", /amazon-product-image-size/i.test(sm0));
  assert("sitemap lists etsy guide", /etsy-listing-photo-size/i.test(sm0));
  assert("sitemap lists tiktok guide", /tiktok-shop-image-size/i.test(sm0));
  assert("sitemap lists fba box guide", /amazon-fba-box-size-limits/i.test(sm0));
  assert("sitemap lists dim weight guide", /amazon-dimensional-weight/i.test(sm0));
  assert("sitemap lists heic amazon guide", /heic-to-jpg-for-amazon/i.test(sm0));
  assert("sitemap lists heic etsy guide", /heic-to-jpg-for-etsy/i.test(sm0));
  assert("sitemap lists heic tiktok guide", /heic-to-jpg-for-tiktok-shop/i.test(sm0));
  assert("sitemap lists png amazon guide", /png-to-jpg-for-amazon/i.test(sm0));
  assert("sitemap lists amazon title limit guide", /amazon-title-character-limit/i.test(sm0));
  assert("sitemap lists item highlights guide", /amazon-item-highlights/i.test(sm0));
  assert("sitemap lists etsy title limit guide", /etsy-title-character-limit/i.test(sm0));
  assert("sitemap lists compress for amazon guide", /compress-image-for-amazon/i.test(sm0));
  assert("sitemap lists compress to 100kb guide", /compress-image-to-100kb/i.test(sm0));
  assert("sitemap lists webp to jpg guide", /webp-to-jpg/i.test(sm0));
  assert("sitemap lists jpg to png guide", /jpg-to-png/i.test(sm0));
  assert(
    "sitemap excludes amazon-image-prep redirect",
    !/\/tools\/amazon-image-prep/i.test(sm0),
  );
  assert(
    "sitemap excludes tiktok-shop-image-prep redirect",
    !/\/tools\/tiktok-shop-image-prep/i.test(sm0),
  );
  assert(
    "sitemap locs have no trailing slash (except home)",
    !/selltoolhq\.com\/[^<]+\/<\/loc>/i.test(sm0),
  );

  const ogHome = await open("/");
  assert("home has og:image", /property=["']og:image["']/i.test(ogHome));
  assert("home has WebSite JSON-LD", /"@type":\s*"WebSite"/i.test(ogHome));
  assert("home has Guides section", /id=["']guides["']/i.test(ogHome));

  const bing = await (await page.request.get(`${base}/BingSiteAuth.xml`)).text();
  assert("BingSiteAuth is XML users", /<users>/i.test(bing) && /<user>/i.test(bing));

  const homeHtml = await open("/");
  assert("home has Tools heading", /<h2[^>]*>\s*Tools\s*<\/h2>/i.test(homeHtml));
  assert("home has What you get", /What you get/i.test(homeHtml));
  assert(
    "home rejects internal jargon",
    !/Job-first, not toolbox-first|swiss army knife/i.test(homeHtml),
  );
  assert(
    "home brand SellTool HQ",
    /SellTool\s*HQ/i.test((await page.locator("header .brand").textContent()) || ""),
  );

  const broken = [];
  for (const p of pagesToVisit) {
    const html = await open(p.path);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href") || ""));
    for (const href of hrefs) {
      if (!href) continue;
      if (href.startsWith("mailto:")) {
        assert(`mailto on ${p.name}`, /contact@selltoolhq\.com/i.test(href), href.slice(0, 80));
        continue;
      }
      // Cloudflare email obfuscation on live — not a real site page
      if (href.includes("/cdn-cgi/")) continue;
      if (/^https?:\/\//i.test(href) && !/selltoolhq\.com|127\.0\.0\.1|localhost/i.test(href)) {
        continue;
      }

      let pathPart = p.path;
      let hash = "";
      if (href.startsWith("#")) {
        hash = href.slice(1);
      } else if (href.startsWith("/#")) {
        pathPart = "/";
        hash = href.slice(2);
      } else if (href.startsWith("/")) {
        const [pathOnly, h] = href.split("#");
        pathPart = pathOnly || "/";
        hash = h || "";
      } else {
        continue;
      }

      const url = `${base}${pathPart}`;
      const res = await page.request.get(url);
      if (res.status() !== 200) {
        broken.push(`${p.name}: ${href} → ${url} status ${res.status()}`);
        continue;
      }
      if (hash) {
        const body = await res.text();
        if (!new RegExp(`id=["']${hash}["']`).test(body)) {
          // Same-page hash: also accept current HTML (SPA-less static)
          if (pathPart === p.path || (pathPart === "/" && p.path === "/")) {
            if (!new RegExp(`id=["']${hash}["']`).test(html)) {
              broken.push(`${p.name}: ${href} → missing #${hash}`);
            }
          } else if (!new RegExp(`id=["']${hash}["']`).test(body)) {
            broken.push(`${p.name}: ${href} → missing #${hash}`);
          }
        }
      }
    }
  }
  assert("no broken internal links/anchors", broken.length === 0, broken.join(" | ") || "all ok");
  // Nav journeys (local uses real clicks; live uses request verification of destinations)
  if (!useLive) {
    async function clickAndWait(selector, urlPred) {
      await Promise.all([page.waitForURL(urlPred), page.locator(selector).click()]);
    }

    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await clickAndWait('a.tool-card[href="/tools/marketplace-image-prep"]', /marketplace-image-prep/);
    assert("card to Marketplace Prep", /Marketplace Image Resizer/i.test(await page.title()));

    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await clickAndWait('a.tool-card[href="/tools/heic-to-jpg"]', /heic-to-jpg/);
    assert("card to HEIC to JPG", /HEIC to JPG/i.test(await page.title()));

    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await clickAndWait('a.tool-card[href="/tools/fba-box-size-checker"]', /fba-box-size-checker/);
    assert("card to FBA Box", /FBA Box Size/i.test(await page.title()));

    await Promise.all([
      page.waitForURL((u) => u.pathname === "/" || u.pathname === "", { waitUntil: "domcontentloaded" }),
      page.locator("header a.brand").click(),
    ]);
    assert("brand back home", (await page.locator("header a.brand").count()) === 1);

    await page.click('a[href="/#tools"]');
    assert("#tools exists", (await page.locator("#tools").count()) === 1);
    await page.click('a[href="/#report-issue"]');
    assert("#report-issue exists", (await page.locator("#report-issue").count()) === 1);
    await page.click('footer a[href="/#value"]');
    assert("#value exists", (await page.locator("#value").count()) === 1);
  } else {
    assert(
      "live nav targets ok",
      (await page.request.get(`${base}/tools/marketplace-image-prep`)).status() === 200 &&
        (await page.request.get(`${base}/tools/heic-to-jpg`)).status() === 200 &&
        (await page.request.get(`${base}/tools/fba-box-size-checker`)).status() === 200,
    );
  }

  await open("/tools/marketplace-image-prep");
  assert("marketplace has drop zone", (await page.locator("#dropZone").count()) === 1);
  assert("marketplace has process btn", (await page.locator("#processBtn").count()) === 1);
  assert(
    "marketplace has platform controls",
    (await page.locator("#platformList, input[name=\"platform\"], #platform").count()) >= 1,
  );
  assert("marketplace has FAQ", (await page.locator(".faq details").count()) >= 5);
  assert("marketplace has no #pro-upgrade", (await page.locator("#pro-upgrade").count()) === 0);
  assert("marketplace has #report-issue", (await page.locator("#report-issue").count()) === 1);
  assert("marketplace has related guides", (await page.locator(".related-guides a").count()) >= 2);
  const mpHtml = await page.content();
  assert("marketplace has BreadcrumbList LD", /"@type":\s*"BreadcrumbList"/i.test(mpHtml));
  assert(
    "marketplace has visible breadcrumbs",
    (await page.locator("nav.breadcrumbs").count()) === 1,
  );
  assert(
    "privacy chip in header",
    /Private · in-browser · no upload/i.test(
      (await page.locator(".privacy-chip").first().textContent()) || "",
    ),
  );
  assert(
    "marketplace has Related tools",
    (await page.locator(".related-tools a[href='/tools/heic-to-jpg']").count()) >= 1,
  );
  assert("marketplace has og:image", /property=["']og:image["']/i.test(mpHtml));

  await open("/tools/heic-to-jpg");
  assert("heic has drop zone", (await page.locator("#dropZone").count()) === 1);
  assert("heic has convert btn", (await page.locator("#convertBtn").count()) === 1);
  assert("heic has FAQ", (await page.locator(".faq details").count()) >= 5);
  assert("heic has no #pro-upgrade", (await page.locator("#pro-upgrade").count()) === 0);

  await open("/tools/fba-box-size-checker");
  assert("fba has check btn", (await page.locator("#checkBtn").count()) === 1);
  assert("fba has program radios", (await page.locator('input[name="program"]').count()) === 2);
  assert("fba has Import CSV", (await page.locator("#importCsvBtn").count()) === 1);
  assert("fba has FAQ", (await page.locator(".faq details").count()) >= 5);
  assert("fba has rules table", (await page.locator("table.data").count()) >= 1);
  assert("fba has no #pro-upgrade", (await page.locator("#pro-upgrade").count()) === 0);
  assert("fba has Related tools", (await page.locator(".related-tools").count()) >= 1);
  assert("fba has visible breadcrumbs", (await page.locator("nav.breadcrumbs").count()) === 1);

  await open("/guides/amazon-fba-box-size-limits");
  assert("fba guide has SpecLegend", (await page.locator(".spec-legend").count()) === 1);
  assert(
    "fba guide has disclaimer",
    /Disclaimer/i.test((await page.locator(".guide-disclaimer").textContent()) || ""),
  );
  assert(
    "fba guide no shop CTA",
    !/pet shop|lunepaws|buy now on our store/i.test(await page.content()),
  );
  assert("fba guide Related tools", (await page.locator(".related-tools").count()) >= 1);

  await open("/guides/amazon-product-image-size");
  assert("amazon image guide SpecLegend", (await page.locator(".spec-legend").count()) === 1);
  assert(
    "amazon image guide labels official vs practice",
    /Official \/ platform|Industry \/ seller practice/i.test(await page.content()),
  );

  await open("/");
  assert("home canonical present", (await page.locator('link[rel="canonical"]').count()) >= 1);
  assert("home og:title present", (await page.locator('meta[property="og:title"]').count()) >= 1);

  await browser.close();
  console.log("\nAll site smoke checks passed.\n\n--- SUMMARY ---");
  for (const r of results) console.log(`| ${r.name} | ${r.pass ? "pass" : "fail"} | ${r.notes} |`);
} catch (err) {
  console.error(err);
  console.log("\n--- SUMMARY (partial) ---");
  for (const r of results) console.log(`| ${r.name} | ${r.pass ? "pass" : "fail"} | ${r.notes} |`);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
