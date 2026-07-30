/**
 * Feature + SEO E2E for Listing Character Counter — must pass before "shipped".
 */
import { spawn } from "node:child_process";
import path from "node:path";
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

const port = 4334;
const base = `http://127.0.0.1:${port}`;

await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

try {
  await waitForServer(`${base}/tools/listing-character-counter`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const posts = [];
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH"].includes(req.method())) {
      const body = req.postDataBuffer()?.length ?? 0;
      if (body > 0) posts.push({ url: req.url(), method: req.method(), size: body });
    }
  });

  await page.goto(`${base}/tools/listing-character-counter`, { waitUntil: "networkidle" });

  assert("page title SEO", (await page.title()).toLowerCase().includes("amazon title character counter"));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /amazon title character counter/i.test(desc));
  assert("meta has secondary", /75|item highlights|etsy/i.test(desc));
  assert(
    "H1 present",
    (await page.locator("[data-listing-counter] h1").textContent())
      ?.toLowerCase()
      .includes("amazon title character counter"),
  );

  const faqCount = await page.locator(".faq details").count();
  assert("FAQ ≥5", faqCount >= 5, `count=${faqCount}`);

  const ldScripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faqLd = ldScripts.map((t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }).find((j) => j?.["@type"] === "FAQPage");
  assert("FAQPage JSON-LD exists", Boolean(faqLd));
  const qCount = Array.isArray(faqLd?.mainEntity) ? faqLd.mainEntity.length : 0;
  assert("FAQPage questions ≥ on-page FAQ", qCount >= faqCount, `ld=${qCount} html=${faqCount}`);

  const appLd = ldScripts.map((t) => {
    try {
      return JSON.parse(t);
    } catch {
      return null;
    }
  }).find((j) => j?.["@type"] === "WebApplication");
  assert("WebApplication JSON-LD exists", Boolean(appLd));
  assert("offers price 0", String(appLd?.offers?.price) === "0");

  // Feature: Amazon title 75 over-limit
  const title = "A".repeat(76);
  await page.fill("#field-title", title);
  await page.waitForTimeout(100);
  const titleMeter = page.locator('.counter-field[data-field-id="title"] .counter-meter');
  assert("title over shows over class", await titleMeter.evaluate((el) => el.classList.contains("over")));
  assert("title meter shows 76", /76\s*\/\s*75/.test((await titleMeter.textContent()) || ""));

  await page.fill("#field-title", "A".repeat(75));
  await page.waitForTimeout(50);
  assert("title 75 is ok", await titleMeter.evaluate((el) => el.classList.contains("ok")));

  await page.fill("#field-itemHighlights", "B".repeat(126));
  await page.waitForTimeout(50);
  const ihMeter = page.locator('.counter-field[data-field-id="itemHighlights"] .counter-meter');
  assert("item highlights over", await ihMeter.evaluate((el) => el.classList.contains("over")));

  // Backend bytes: "é" is 2 UTF-8 bytes
  const backend = "é".repeat(125); // 250 bytes > 249
  await page.fill("#field-backend", backend);
  await page.waitForTimeout(50);
  const beMeter = page.locator('.counter-field[data-field-id="backend"] .counter-meter');
  const beText = (await beMeter.textContent()) || "";
  assert("backend counts bytes", /bytes/i.test(beText));
  assert("backend over 249 bytes", await beMeter.evaluate((el) => el.classList.contains("over")));

  // Etsy platform
  await page.selectOption("#platform", "etsy");
  await page.waitForTimeout(100);
  assert("etsy title field exists", (await page.locator("#field-title").count()) === 1);
  await page.fill("#field-title", "C".repeat(141));
  await page.waitForTimeout(50);
  const etsyMeter = page.locator('.counter-field[data-field-id="title"] .counter-meter');
  assert("etsy 141 over 140", await etsyMeter.evaluate((el) => el.classList.contains("over")));
  assert("etsy meter 140 limit", /\/\s*140/.test((await etsyMeter.textContent()) || ""));

  // Query platform deep link
  await page.goto(`${base}/tools/listing-character-counter?platform=tiktok-shop`, {
    waitUntil: "networkidle",
  });
  assert(
    "tiktok platform selected",
    (await page.locator("#platform").inputValue()) === "tiktok-shop",
  );
  await page.fill("#field-title", "D".repeat(256));
  await page.waitForTimeout(50);
  assert(
    "tiktok 256 over 255",
    await page
      .locator('.counter-field[data-field-id="title"] .counter-meter')
      .evaluate((el) => el.classList.contains("over")),
  );

  assert("no listing text upload POST", posts.length === 0, JSON.stringify(posts));

  // Guides smoke
  for (const g of [
    "/guides/amazon-title-character-limit",
    "/guides/amazon-item-highlights",
    "/guides/etsy-title-character-limit",
  ]) {
    const res = await page.request.get(`${base}${g}`);
    assert(`guide ${g} 200`, res.status() === 200);
  }

  await browser.close();
  console.log(`\nAll ${results.length} assertions passed.`);
} finally {
  killServer(child);
}
