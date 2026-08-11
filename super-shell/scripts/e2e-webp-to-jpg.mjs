/**
 * SEO E2E for WebP→JPG thin landing (points to format hub with ?out=jpg).
 */
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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

const port = 4333;
const base = `http://127.0.0.1:${port}`;

await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

try {
  await waitForServer(`${base}/tools/webp-to-jpg`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${base}/tools/webp-to-jpg`, { waitUntil: "networkidle" });

  assert("page title SEO", (await page.title()).toLowerCase().includes("webp to jpg"));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /webp to jpg/i.test(desc));
  assert(
    "H1 present",
    (await page.locator("[data-webp-jpg] h1").textContent())?.toLowerCase().includes("webp to jpg"),
  );
  const faqCount = await page.locator("[data-webp-jpg] .faq details").count();
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

  assert(
    "CTA to hub with out=jpg",
    (await page.locator('a[href="/tools/png-to-jpg?out=jpg"]').count()) >= 1,
  );
  assert(
    "no full converter drop zone on thin landing",
    (await page.locator("#formatFiles").count()) === 0,
  );
  assert(
    "seller next-step marketplace",
    (await page.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
  );
  assert("hub link", (await page.locator('a[href="/tools/png-to-jpg"]').count()) >= 1);

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
  assert("canonical path", /webp-to-jpg/i.test(appLd?.url || ""));

  await page.click('a[href="/tools/png-to-jpg?out=jpg"]');
  await page.waitForURL(/png-to-jpg\?out=jpg/, { timeout: 15000 });
  assert(
    "hub opens with JPG selected",
    (await page.locator("#outFormat").inputValue()) === "jpg",
  );
  assert("hub drop zone present", (await page.locator("#formatFiles").count()) === 1);

  await browser.close();
  console.log("\nAll WebP→JPG thin-landing E2E checks passed:", results.length);
} catch (err) {
  console.error(err);
  console.error("\nResults so far:", results);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
