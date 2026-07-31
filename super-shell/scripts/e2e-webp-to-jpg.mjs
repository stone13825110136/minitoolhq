/**
 * Feature + SEO E2E for WebP to JPG landing — must pass before "shipped".
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

async function canvasToFile(page, outPath, { mime, size = 180 }) {
  const bytes = await page.evaluate(
    async ({ mime, size }) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = `rgb(${i % 255},${(i * 3) % 255},${(i * 7) % 255})`;
        ctx.fillRect(i % size, (i * 17) % size, 4, 4);
      }
      const blob = await new Promise((resolve, reject) => {
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, 0.92);
      });
      const ab = await blob.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    },
    { mime, size },
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(bytes));
  return outPath;
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
  const posts = [];
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH"].includes(req.method())) {
      const body = req.postDataBuffer()?.length ?? 0;
      if (body > 0) posts.push({ url: req.url(), method: req.method(), size: body });
    }
  });

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

  const webp1 = path.join(fixtures, "webp-landing-a.webp");
  const webp2 = path.join(fixtures, "webp-landing-b.webp");
  await canvasToFile(page, webp1, { mime: "image/webp", size: 180 });
  await canvasToFile(page, webp2, { mime: "image/webp", size: 200 });

  await page.setInputFiles("#formatFiles", [webp1, webp2]);
  await page.click("#convertBtn");
  await page.waitForSelector("#zipDownload", { timeout: 60000 });
  assert(
    "WebP→JPG batch convert done",
    /done|converted/i.test((await page.locator("#status").textContent()) || ""),
  );
  assert("ZIP download link", (await page.locator("#zipDownload").count()) >= 1);

  const zipOk = await page.evaluate(async () => {
    const href = document.querySelector("#zipDownload")?.getAttribute("href");
    if (!href) return false;
    const res = await fetch(href);
    const u8 = new Uint8Array(await res.arrayBuffer());
    return u8[0] === 0x50 && u8[1] === 0x4b;
  });
  assert("ZIP is real zip", zipOk);

  assert(
    "seller next-step marketplace",
    (await page.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
  );
  assert("PNG converter link", (await page.locator('a[href="/tools/png-to-jpg"]').count()) >= 1);
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
  assert("canonical path", /webp-to-jpg/i.test(appLd?.url || ""));

  await browser.close();
  console.log("\nAll WebP→JPG E2E checks passed:", results.length);
} catch (err) {
  console.error(err);
  console.error("\nResults so far:", results);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
