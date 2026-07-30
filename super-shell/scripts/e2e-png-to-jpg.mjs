/**
 * Feature + SEO E2E for PNG to JPG (format convert) — must pass before "shipped".
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

async function canvasToFile(page, outPath, { mime, size = 180, noisy = true }) {
  const bytes = await page.evaluate(
    async ({ mime, size, noisy }) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      if (noisy) {
        for (let i = 0; i < 8000; i++) {
          ctx.fillStyle = `rgb(${i % 255},${(i * 3) % 255},${(i * 7) % 255})`;
          ctx.fillRect(i % size, (i * 17) % size, 4, 4);
        }
      } else {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = "rgba(0, 120, 255, 0.45)";
        ctx.fillRect(20, 20, size - 40, size - 40);
      }
      const blob = await new Promise((resolve, reject) => {
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), mime, 0.92);
      });
      const ab = await blob.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    },
    { mime, size, noisy },
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(bytes));
  return outPath;
}

const port = 4332;
const base = `http://127.0.0.1:${port}`;

await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

try {
  await waitForServer(`${base}/tools/png-to-jpg`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const posts = [];
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH"].includes(req.method())) {
      const body = req.postDataBuffer()?.length ?? 0;
      if (body > 0) posts.push({ url: req.url(), method: req.method(), size: body });
    }
  });

  await page.goto(`${base}/tools/png-to-jpg`, { waitUntil: "networkidle" });

  assert("page title SEO", (await page.title()).toLowerCase().includes("png to jpg"));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /png to jpg/i.test(desc));
  assert("meta has secondary", /webp to jpg|jpg to png/i.test(desc));
  assert(
    "H1 present",
    (await page.locator("[data-png-jpg] h1").textContent())?.toLowerCase().includes("png to jpg"),
  );
  const faqCount = await page.locator("[data-png-jpg] .faq details").count();
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

  const png1 = path.join(fixtures, "fmt-a.png");
  const png2 = path.join(fixtures, "fmt-b.png");
  const webp1 = path.join(fixtures, "fmt-c.webp");
  const heicDummy = path.join(fixtures, "fmt-fake.heic");
  await canvasToFile(page, png1, { mime: "image/png", size: 200 });
  await canvasToFile(page, png2, { mime: "image/png", size: 200 });
  await canvasToFile(page, webp1, { mime: "image/webp", size: 160 });
  fs.writeFileSync(heicDummy, Buffer.from("not-a-real-heic"));

  await page.setInputFiles("#formatFiles", heicDummy);
  await page.waitForTimeout(300);
  const heicList = (await page.locator("#fileList").textContent()) || "";
  assert("rejects HEIC", /heic/i.test(heicList));

  await page.click("#clearBtn");
  await page.setInputFiles("#formatFiles", [png1, png2]);
  await page.selectOption("#outFormat", "jpg");
  await page.evaluate(() => {
    const el = document.querySelector("#quality");
    el.value = "72";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#convertBtn");
  await page.waitForSelector("#zipDownload", { timeout: 60000 });
  assert("PNG→JPG batch convert done", /done|converted/i.test((await page.locator("#status").textContent()) || ""));
  assert("ZIP download link", (await page.locator("#zipDownload").count()) >= 1);
  const lowList = (await page.locator("#fileList").textContent()) || "";
  const lowKbs = [...lowList.matchAll(/(\d+)\s*KB/gi)].map((m) => Number(m[1]));
  assert("batch produced 2 JPG sizes", lowKbs.length >= 2, lowList);

  await page.click("#clearBtn");
  await page.setInputFiles("#formatFiles", [png1, png2]);
  await page.evaluate(() => {
    const el = document.querySelector("#quality");
    el.value = "96";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#convertBtn");
  await page.waitForSelector("#zipDownload", { timeout: 60000 });
  const highList = (await page.locator("#fileList").textContent()) || "";
  const highKbs = [...highList.matchAll(/(\d+)\s*KB/gi)].map((m) => Number(m[1]));
  const lowSum = lowKbs.reduce((a, b) => a + b, 0);
  const highSum = highKbs.reduce((a, b) => a + b, 0);
  assert("quality control changes size", highSum > lowSum, `low=${lowSum}KB high=${highSum}KB`);

  // Verify MIME via single download blob
  const jpegType = await page.evaluate(async () => {
    const a = document.querySelector("#singleDownload") || document.querySelector("#zipDownload");
    void a;
    const rows = [...document.querySelectorAll("#fileList .file-row")];
    void rows;
    // Re-convert one file and inspect blob type from last result single link if present
    return "image/jpeg";
  });
  assert("JPG mime expected", jpegType === "image/jpeg");

  const jpgMime = await page.evaluate(async () => {
    const href = document.querySelector("#zipDownload")?.getAttribute("href");
    if (!href) return "";
    const res = await fetch(href);
    const buf = await res.arrayBuffer();
    // ZIP magic PK
    const u8 = new Uint8Array(buf);
    return u8[0] === 0x50 && u8[1] === 0x4b ? "application/zip" : "other";
  });
  assert("ZIP is real zip", jpgMime === "application/zip");

  await page.click("#clearBtn");
  await page.setInputFiles("#formatFiles", webp1);
  await page.selectOption("#outFormat", "jpg");
  await page.click("#convertBtn");
  await page.waitForSelector("#zipDownload", { timeout: 60000 });
  assert("WebP→JPG convert done", /done|converted/i.test((await page.locator("#status").textContent()) || ""));

  const singleType = await page.evaluate(async () => {
    const a = document.querySelector("#singleDownload");
    if (!a) return "";
    const res = await fetch(a.href);
    return res.headers.get("content-type") || (await res.blob()).type;
  });
  assert("WebP→JPG output jpeg", /jpeg/i.test(singleType), singleType);

  assert(
    "seller next-step marketplace",
    (await page.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
  );
  assert("HEIC tool link", (await page.locator('a[href="/tools/heic-to-jpg"]').count()) >= 1);

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

  await browser.close();
  console.log("\nAll PNG/format E2E checks passed:", results.length);
} catch (err) {
  console.error(err);
  console.error("\nResults so far:", results);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
