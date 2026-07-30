/**
 * Feature E2E for HEIC to JPG — must pass before "shipped".
 * Builds + previews (stable) like site smoke.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixtures = path.join(root, "test-fixtures");

const results = [];
function log(caseName, pass, notes = "") {
  results.push({ caseName, pass, notes });
  console.log(`${pass ? "PASS" : "FAIL"}  ${caseName}${notes ? " — " + notes : ""}`);
}
function assert(caseName, cond, notes = "") {
  log(caseName, Boolean(cond), notes);
  if (!cond) throw new Error(`Assertion failed: ${caseName}`);
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

async function ensureHeicFixture() {
  const out = path.join(fixtures, "sample.heic");
  if (fs.existsSync(out) && fs.statSync(out).size > 500) return out;
  fs.mkdirSync(fixtures, { recursive: true });
  const urls = [
    "https://github.com/nokiatech/heif_conformance/raw/master/conformance_files/C001.heic",
    "https://raw.githubusercontent.com/nokiatech/heif_conformance/master/conformance_files/C001.heic",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) continue;
      fs.writeFileSync(out, buf);
      console.log("Downloaded HEIC fixture", out, buf.length, "bytes");
      return out;
    } catch (e) {
      console.warn("HEIC download failed", url, e.message);
    }
  }
  return null;
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

const heicPath = await ensureHeicFixture();
const port = 4331;
const base = `http://127.0.0.1:${port}`;

await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

try {
  await waitForServer(`${base}/tools/heic-to-jpg`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const posts = [];
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH"].includes(req.method())) {
      const body = req.postDataBuffer()?.length ?? 0;
      if (body > 0) posts.push({ url: req.url(), method: req.method(), size: body });
    }
  });

  await page.goto(`${base}/tools/heic-to-jpg`, { waitUntil: "networkidle" });

  assert("page title SEO", (await page.title()).toLowerCase().includes("heic to jpg"));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /heic to jpg/i.test(desc));
  assert(
    "H1 present",
    (await page.locator("[data-heic-jpg] h1").textContent())?.toLowerCase().includes("heic to jpg"),
  );
  const faqCount = await page.locator("[data-heic-jpg] .faq details").count();
  assert("FAQ >= 5", faqCount >= 5);
  const faqLd = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
    for (const el of blocks) {
      try {
        const data = JSON.parse(el.textContent || "");
        if (data["@type"] === "FAQPage" && Array.isArray(data.mainEntity)) {
          return data.mainEntity.length;
        }
      } catch {
        /* skip */
      }
    }
    return 0;
  });
  assert("FAQPage JSON-LD >= FAQ count", faqLd >= faqCount);

  const jpgFixture = path.join(fixtures, "product-square-2200.jpg");
  if (!fs.existsSync(jpgFixture)) {
    await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "test:fixtures"]);
  }
  if (fs.existsSync(jpgFixture)) {
    await page.setInputFiles("#heicFiles", jpgFixture);
    await page.waitForTimeout(400);
    const listText = (await page.locator("#fileList").textContent()) || "";
    assert("rejects non-HEIC", /not heic|skipped/i.test(listText));
  }

  if (heicPath) {
    const heic2 = path.join(fixtures, "sample-2.heic");
    fs.copyFileSync(heicPath, heic2);

    await page.click("#clearBtn");
    await page.setInputFiles("#heicFiles", [heicPath, heic2]);
    await page.waitForTimeout(200);
    const listed = ((await page.locator("#fileList").textContent()) || "").toLowerCase();
    assert("batch lists 2 HEIC", (listed.match(/\.heic/g) || []).length >= 2);

    // Quality must: low quality → smaller reported KB than high quality
    await page.evaluate(() => {
      const el = document.querySelector("#quality");
      if (!el) throw new Error("missing #quality");
      el.value = "72";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("#convertBtn");
    await page.waitForSelector('a[download="heic-to-jpg.zip"]', { timeout: 180000 });
    const lowStatus = (await page.locator("#status").textContent()) || "";
    assert("batch convert done", /done|converted/i.test(lowStatus));
    assert("ZIP download link", (await page.locator('a[download="heic-to-jpg.zip"]').count()) >= 1);
    const lowList = (await page.locator("#fileList").textContent()) || "";
    const lowKbs = [...lowList.matchAll(/(\d+)\s*KB/gi)].map((m) => Number(m[1]));
    assert("batch produced 2 JPG sizes", lowKbs.length >= 2, lowList);

    await page.click("#clearBtn");
    await page.setInputFiles("#heicFiles", [heicPath, heic2]);
    await page.evaluate(() => {
      const el = document.querySelector("#quality");
      if (!el) throw new Error("missing #quality");
      el.value = "96";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await page.click("#convertBtn");
    await page.waitForSelector('a[download="heic-to-jpg.zip"]', { timeout: 180000 });
    const highList = (await page.locator("#fileList").textContent()) || "";
    const highKbs = [...highList.matchAll(/(\d+)\s*KB/gi)].map((m) => Number(m[1]));
    assert("high quality produced sizes", highKbs.length >= 2, highList);
    const lowSum = lowKbs.reduce((a, b) => a + b, 0);
    const highSum = highKbs.reduce((a, b) => a + b, 0);
    assert(
      "quality control changes size",
      highSum > lowSum,
      `low=${lowSum}KB high=${highSum}KB`,
    );

    assert(
      "seller next-step link",
      (await page.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
    );
  } else {
    log("HEIC convert (skipped — no fixture)", true, "download failed; SEO gates still required");
  }

  assert(
    "no file upload POST",
    posts.filter((p) => p.size > 500).length === 0,
    JSON.stringify(posts),
  );

  const appLd = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
    for (const el of blocks) {
      try {
        const data = JSON.parse(el.textContent || "");
        if (data["@type"] === "WebApplication") return data;
      } catch {
        /* skip */
      }
    }
    return null;
  });
  assert("WebApplication JSON-LD", Boolean(appLd?.name));
  assert("WebApplication free offer", appLd?.offers?.price === "0");
  assert("no Pro upgrade block", (await page.locator("#pro-upgrade").count()) === 0);

  // Guide SEO sample (not only HTTP 200)
  await page.goto(`${base}/guides/amazon-product-image-size`, { waitUntil: "domcontentloaded" });
  assert(
    "guide title keyword",
    /amazon product image size/i.test(await page.title()),
  );
  const gDesc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("guide meta keyword", /amazon product image size/i.test(gDesc));
  assert("guide FAQ >= 5", (await page.locator(".faq details").count()) >= 5);
  assert(
    "guide CTA to tool",
    (await page.locator('a[href*="/tools/marketplace-image-prep"]').count()) >= 1,
  );

  for (const g of [
    "/guides/etsy-listing-photo-size",
    "/guides/tiktok-shop-image-size",
    "/guides/amazon-fba-box-size-limits",
    "/guides/amazon-dimensional-weight",
  ]) {
    const res = await page.request.get(`${base}${g}`);
    assert(`guide ${g}`, res.ok());
    const html = await res.text();
    assert(`guide ${g} has FAQ details`, (html.match(/<details>/g) || []).length >= 5);
    assert(`guide ${g} has FAQPage LD`, /"@type":\s*"FAQPage"/.test(html));
  }

  await browser.close();
  console.log("\nAll HEIC / guide E2E checks passed:", results.length);
} catch (err) {
  console.error(err);
  console.error("\nResults so far:", results);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
