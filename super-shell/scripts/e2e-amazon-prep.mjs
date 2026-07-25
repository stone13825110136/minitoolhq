/**
 * Feature E2E for Amazon Image Prep — must pass before "shipped".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixtures = path.join(root, "test-fixtures");
// Keep downloads outside the Vite project root to avoid EBUSY file watchers on Windows
const downloadDir = path.join(root, "..", ".tmp-amazon-prep-test");

const results = [];
function log(caseName, pass, notes = "") {
  results.push({ caseName, pass, notes });
  console.log(`${pass ? "PASS" : "FAIL"}  ${caseName}${notes ? " — " + notes : ""}`);
}

function assert(caseName, cond, notes = "") {
  log(caseName, Boolean(cond), notes);
  if (!cond) throw new Error(`Assertion failed: ${caseName}`);
}

async function waitForServer(url, ms = 60000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("Dev server did not start: " + url);
}

// Ensure fixtures
if (!fs.existsSync(path.join(fixtures, "product-red-1800.png"))) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [path.join(__dirname, "make-fixtures.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

fs.rmSync(downloadDir, { recursive: true, force: true });
fs.mkdirSync(downloadDir, { recursive: true });

const port = 4321;
const base = `http://127.0.0.1:${port}`;
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "dev", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

function killServer() {
  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true });
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    /* ignore */
  }
}

let serverLog = "";
child.stdout.on("data", (d) => {
  serverLog += d.toString();
});
child.stderr.on("data", (d) => {
  serverLog += d.toString();
});

try {
  await waitForServer(`${base}/tools/amazon-image-prep`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const uploadedRequests = [];
  page.on("request", (req) => {
    const t = req.resourceType();
    if (t === "xhr" || t === "fetch") {
      uploadedRequests.push({ url: req.url(), method: req.method(), size: req.postDataBuffer()?.length ?? 0 });
    }
  });

  await page.goto(`${base}/tools/amazon-image-prep`, { waitUntil: "networkidle" });

  async function dismissOverlay() {
    await page.evaluate(() => {
      document.querySelectorAll("vite-error-overlay").forEach((el) => el.remove());
    });
  }

  async function safeClick(selector) {
    await dismissOverlay();
    await page.locator(selector).click({ force: true, timeout: 15000 });
  }

  // UI / SEO
  assert("page title SEO", (await page.title()).includes("Amazon Product Image Prep"));
  assert(
    "H1 present",
    (await page.locator("[data-amazon-prep] h1").first().textContent())?.includes(
      "Amazon Product Photo Prep",
    ),
  );
  assert("requirements table", (await page.locator("[data-amazon-prep] table.data").count()) >= 2);
  assert("FAQ count >= 5", (await page.locator("[data-amazon-prep] .faq details").count()) >= 5);

  const home = await context.newPage();
  await home.goto(base, { waitUntil: "domcontentloaded" });
  assert(
    "homepage links to tool",
    (await home.locator('a[href="/tools/amazon-image-prep"]').count()) >= 1,
  );
  await home.close();

  // Batch 2 images → ZIP
  const files2 = [
    path.join(fixtures, "product-red-1800.png"),
    path.join(fixtures, "product-square-2200.jpg"),
  ];
  await page.locator("#fileInput").setInputFiles(files2);
  await page.waitForFunction(() => document.querySelector("#queueCount")?.textContent === "2");
  assert("queue shows 2", (await page.locator("#queueCount").textContent()) === "2");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    safeClick("#processBtn"),
  ]);
  const zipPath = path.join(downloadDir, await download.suggestedFilename());
  await download.saveAs(zipPath);
  assert("ZIP downloaded", fs.existsSync(zipPath) && fs.statSync(zipPath).size > 1000, zipPath);
  assert("ZIP name pattern", /amazon-images-\d+\.zip$/i.test(path.basename(zipPath)));

  // Report rows
  await page.waitForSelector("#reportBody tr", { timeout: 10000 });
  const rowCount = await page.locator("#reportBody tr").count();
  assert("report has 2 rows", rowCount === 2, `got ${rowCount}`);

  // Status ok
  const status = await page.locator("#status").textContent();
  assert("status ok after process", status?.toLowerCase().includes("done"), status ?? "");

  // No large image uploads via fetch/xhr during processing
  const bigPosts = uploadedRequests.filter((r) => r.size > 50_000);
  assert("no large file upload via fetch/xhr", bigPosts.length === 0, JSON.stringify(bigPosts));

  // Free cap banner: add 11 files
  await dismissOverlay();
  await safeClick("#clearBtn");
  const manyUnique = [];
  for (let i = 0; i < 11; i++) {
    const p = path.join(downloadDir, `cap-${i}.png`);
    fs.copyFileSync(path.join(fixtures, "product-blue-800.png"), p);
    manyUnique.push(p);
  }
  await page.locator("#fileInput").setInputFiles(manyUnique);
  await page.waitForFunction(() => Number(document.querySelector("#queueCount")?.textContent) === 11);
  const bannerVisible = await page.locator("#proBanner").isVisible();
  assert("Pro banner when >10 queued", bannerVisible);

  const [download2] = await Promise.all([
    page.waitForEvent("download", { timeout: 180000 }),
    safeClick("#processBtn"),
  ]);
  await download2.saveAs(path.join(downloadDir, "cap-batch.zip"));
  await page.waitForSelector("#reportBody tr");
  const cappedRows = await page.locator("#reportBody tr").count();
  assert("free tier processes only 10", cappedRows === 10, `got ${cappedRows}`);

  // Square default + white BG: inspect via in-page process module
  await dismissOverlay();
  await safeClick("#clearBtn");
  await page.locator("#fileInput").setInputFiles([path.join(fixtures, "product-tall-2400.png")]);
  await page.waitForSelector("#thumbs img");
  await page.selectOption("#resizeMode", "square");
  await page.fill("#targetPx", "2000");
  await page.check("#whiteBg");

  const dimCheck = await page.evaluate(async () => {
    const { processImageFile } = await import("/src/lib/amazon-prep/process.ts");
    const img = document.querySelector("#thumbs img");
    const res = await fetch(img.src);
    const blob = await res.blob();
    const file = new File([blob], "tall.png", { type: "image/png" });
    const out = await processImageFile(file, {
      resizeMode: "square",
      targetPx: 2000,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: true,
      upscaleBelowZoom: true,
    });
    const bmp = await createImageBitmap(out.blob);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    const sizeOk = out.blob.size <= 5 * 1024 * 1024;
    bmp.close();
    return {
      w: out.row.width,
      h: out.row.height,
      size: out.blob.size,
      sizeOk,
      corner: [px[0], px[1], px[2]],
      name: out.outputName,
    };
  });

  assert("square output 2000x2000", dimCheck.w === 2000 && dimCheck.h === 2000, JSON.stringify(dimCheck));
  assert("output under 5MB", dimCheck.sizeOk, String(dimCheck.size));
  assert(
    "corner near white",
    dimCheck.corner[0] >= 250 && dimCheck.corner[1] >= 250 && dimCheck.corner[2] >= 250,
    JSON.stringify(dimCheck.corner),
  );
  assert("filename amazon-*.jpg", /^amazon-.+\.jpg$/i.test(dimCheck.name), dimCheck.name);

  // Longest side mode
  const longest = await page.evaluate(async () => {
    const { processImageFile } = await import("/src/lib/amazon-prep/process.ts");
    const img = document.querySelector("#thumbs img");
    const res = await fetch(img.src);
    const blob = await res.blob();
    const file = new File([blob], "tall.png", { type: "image/png" });
    const out = await processImageFile(file, {
      resizeMode: "longest",
      targetPx: 2000,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: false,
      upscaleBelowZoom: true,
    });
    return { w: out.row.width, h: out.row.height };
  });
  assert(
    "longest side = 2000",
    Math.max(longest.w, longest.h) === 2000,
    JSON.stringify(longest),
  );

  // Upscale small image
  await dismissOverlay();
  await safeClick("#clearBtn");
  await page.locator("#fileInput").setInputFiles([path.join(fixtures, "product-blue-800.png")]);
  await page.waitForSelector("#thumbs img");
  const up = await page.evaluate(async () => {
    const { processImageFile } = await import("/src/lib/amazon-prep/process.ts");
    const img = document.querySelector("#thumbs img");
    const res = await fetch(img.src);
    const blob = await res.blob();
    const file = new File([blob], "small.png", { type: "image/png" });
    const out = await processImageFile(file, {
      resizeMode: "longest",
      targetPx: 2000,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: false,
      upscaleBelowZoom: true,
    });
    return Math.max(out.row.width, out.row.height);
  });
  assert("upscale below 1600 → >=1600", up >= 1600, String(up));

  // Unzip check: at least 2 jpeg entries in first zip
  const { unzipSync } = await import("fflate");
  const zipped = unzipSync(fs.readFileSync(zipPath));
  const names = Object.keys(zipped);
  assert("zip contains 2 files", names.length === 2, names.join(", "));
  assert(
    "zip entries are jpg",
    names.every((n) => n.toLowerCase().endsWith(".jpg")),
    names.join(", "),
  );

  await browser.close();
  console.log("\nAll assertions passed.");
} catch (err) {
  console.error("\nE2E failed:", err);
  console.error("Server log (tail):\n", serverLog.slice(-2000));
  process.exitCode = 1;
} finally {
  console.log("\n--- SUMMARY ---");
  for (const r of results) {
    console.log(`| ${r.caseName} | ${r.pass ? "pass" : "fail"} | ${r.notes} |`);
  }
  killServer();
  // Force-exit so Windows npm doesn't hang on orphaned chromedriver/astro
  setTimeout(() => process.exit(process.exitCode ?? 0), 500);
}
