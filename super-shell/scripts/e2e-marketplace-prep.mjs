/**
 * Feature E2E for Marketplace Image Prep — must pass before "shipped".
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const fixtures = path.join(root, "test-fixtures");
const downloadDir = path.join(root, "..", ".tmp-marketplace-prep-test");

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

async function setPlatforms(page, ids) {
  await page.evaluate((wanted) => {
    const boxes = [...document.querySelectorAll('#platformList input[type="checkbox"]')];
    for (const box of boxes) {
      box.checked = wanted.includes(box.value);
    }
    document.querySelector("#platformList")?.dispatchEvent(new Event("change", { bubbles: true }));
  }, ids);
  await page.waitForFunction(
    (wanted) => {
      const checked = [...document.querySelectorAll('#platformList input[type="checkbox"]:checked')].map(
        (el) => el.value,
      );
      return wanted.length === checked.length && wanted.every((id) => checked.includes(id));
    },
    ids,
  );
}

try {
  await waitForServer(`${base}/tools/marketplace-image-prep`);

  const browser = await chromium.launch();
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const uploadedRequests = [];
  page.on("request", (req) => {
    const t = req.resourceType();
    if (t === "xhr" || t === "fetch") {
      uploadedRequests.push({
        url: req.url(),
        method: req.method(),
        size: req.postDataBuffer()?.length ?? 0,
      });
    }
  });

  await page.goto(`${base}/tools/marketplace-image-prep?platform=amazon`, {
    waitUntil: "networkidle",
  });

  async function dismissOverlay() {
    await page.evaluate(() => {
      document.querySelectorAll("vite-error-overlay").forEach((el) => el.remove());
    });
  }

  async function safeClick(selector) {
    await dismissOverlay();
    await page.locator(selector).click({ force: true, timeout: 15000 });
  }

  const title = await page.title();
  assert("page title SEO", /Marketplace Image Resizer/i.test(title));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta has primary keyword", /marketplace image resizer/i.test(desc));
  assert(
    "meta has secondary long-tails",
    /amazon|tiktok shop|etsy/i.test(desc),
  );
  assert(
    "H1 present",
    (await page.locator("[data-marketplace-prep] h1").first().textContent())?.includes(
      "Marketplace Image Resizer",
    ),
  );
  assert("platform checklist", (await page.locator("#platformList input[type='checkbox']").count()) >= 6);
  assert("requirements table", (await page.locator("[data-marketplace-prep] table.data").count()) >= 1);
  const faqCount = await page.locator("[data-marketplace-prep] .faq details").count();
  assert("FAQ count >= 5", faqCount >= 5);
  const faqLd = await page.evaluate(() => {
    const blocks = [...document.querySelectorAll('script[type="application/ld+json"]')];
    for (const el of blocks) {
      try {
        const data = JSON.parse(el.textContent || "");
        if (data["@type"] === "FAQPage" && Array.isArray(data.mainEntity)) {
          return data.mainEntity.length;
        }
      } catch {
        /* ignore */
      }
    }
    return 0;
  });
  assert("FAQPage JSON-LD matches FAQ count", faqLd >= faqCount, `ld=${faqLd} faq=${faqCount}`);

  const home = await context.newPage();
  await home.goto(base, { waitUntil: "domcontentloaded" });
  assert(
    "homepage links to marketplace tool",
    (await home.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
  );
  assert(
    "homepage does not advertise separate Amazon+TikTok cards",
    (await home.locator('a.tool-card[href="/tools/amazon-image-prep"]').count()) === 0 &&
      (await home.locator('a.tool-card[href="/tools/tiktok-shop-image-prep"]').count()) === 0,
  );
  await home.close();

  assert(
    "amazon preset selected",
    await page.locator('#platformList input[value="amazon"]').isChecked(),
  );
  assert("amazon default 2000", (await page.locator("#targetPx").inputValue()) === "2000");
  assert("tweaks visible for single platform", await page.locator("#tweakFields").isVisible());

  await setPlatforms(page, ["tiktok-shop"]);
  await page.waitForFunction(() => document.querySelector("#targetPx")?.value === "1200");
  assert("tiktok preset 1200", (await page.locator("#targetPx").inputValue()) === "1200");

  await setPlatforms(page, ["amazon", "tiktok-shop"]);
  assert(
    "tweaks hidden when multi-select",
    await page.locator("#tweakFields").evaluate((el) => el.hidden === true),
  );

  await setPlatforms(page, ["amazon"]);
  await page.waitForFunction(() => document.querySelector("#targetPx")?.value === "2000");
  assert("tweaks back for single", await page.locator("#tweakFields").isVisible());

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
  assert("single ZIP name pattern", /amazon-images-\d+\.zip$/i.test(path.basename(zipPath)));

  await page.waitForSelector("#reportBody tr", { timeout: 10000 });
  assert("report has 2 rows", (await page.locator("#reportBody tr").count()) === 2);
  assert(
    "status ok after process",
    ((await page.locator("#status").textContent()) || "").toLowerCase().includes("done"),
  );

  const bigPosts = uploadedRequests.filter((r) => r.size > 50_000);
  assert("no large file upload via fetch/xhr", bigPosts.length === 0, JSON.stringify(bigPosts));

  // Multi-platform one ZIP
  await dismissOverlay();
  await safeClick("#clearBtn");
  await setPlatforms(page, ["amazon", "tiktok-shop"]);
  await page.locator("#fileInput").setInputFiles([path.join(fixtures, "product-red-1800.png")]);
  await page.waitForFunction(() => document.querySelector("#queueCount")?.textContent === "1");
  const [multiDownload] = await Promise.all([
    page.waitForEvent("download", { timeout: 120000 }),
    safeClick("#processBtn"),
  ]);
  const multiZipPath = path.join(downloadDir, "multi-" + (await multiDownload.suggestedFilename()));
  await multiDownload.saveAs(multiZipPath);
  assert("multi ZIP downloaded", fs.existsSync(multiZipPath) && fs.statSync(multiZipPath).size > 500);

  const { unzipSync } = await import("fflate");
  const multiNames = Object.keys(unzipSync(fs.readFileSync(multiZipPath)));
  assert(
    "multi ZIP has amazon + tiktok-shop folders",
    multiNames.some((n) => n.startsWith("amazon/")) &&
      multiNames.some((n) => n.startsWith("tiktok-shop/")),
    multiNames.join(", "),
  );
  assert("multi ZIP has 2 entries for 1 image", multiNames.length === 2, multiNames.join(", "));

  await dismissOverlay();
  await safeClick("#clearBtn");
  await setPlatforms(page, ["amazon"]);
  const manyUnique = [];
  for (let i = 0; i < 11; i++) {
    const p = path.join(downloadDir, `cap-${i}.png`);
    fs.copyFileSync(path.join(fixtures, "product-blue-800.png"), p);
    manyUnique.push(p);
  }
  await page.locator("#fileInput").setInputFiles(manyUnique);
  await page.waitForFunction(() => Number(document.querySelector("#queueCount")?.textContent) === 11);
  assert("Pro banner when >10 queued", await page.locator("#proBanner").isVisible());
  assert(
    "Pro CTA present",
    (await page.locator("#proBanner .pro-cta").count()) >= 1,
  );

  const [download2] = await Promise.all([
    page.waitForEvent("download", { timeout: 180000 }),
    safeClick("#processBtn"),
  ]);
  await download2.saveAs(path.join(downloadDir, "cap-batch.zip"));
  await page.waitForSelector("#reportBody tr");
  assert("free tier processes only 10", (await page.locator("#reportBody tr").count()) === 10);

  await dismissOverlay();
  await safeClick("#clearBtn");
  await page.locator("#fileInput").setInputFiles([path.join(fixtures, "product-tall-2400.png")]);
  await page.waitForSelector("#thumbs img");
  await setPlatforms(page, ["amazon"]);
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
      upscaleMinPx: 1600,
      filenamePrefix: "amazon",
    });
    const bmp = await createImageBitmap(out.blob);
    const c = document.createElement("canvas");
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    bmp.close();
    return {
      w: out.row.width,
      h: out.row.height,
      sizeOk: out.blob.size <= 5 * 1024 * 1024,
      corner: [px[0], px[1], px[2]],
      name: out.outputName,
    };
  });
  assert("amazon square 2000", dimCheck.w === 2000 && dimCheck.h === 2000, JSON.stringify(dimCheck));
  assert("output under 5MB", dimCheck.sizeOk);
  assert(
    "corner near white",
    dimCheck.corner[0] >= 250 && dimCheck.corner[1] >= 250 && dimCheck.corner[2] >= 250,
  );
  assert("filename amazon-*.jpg", /^amazon-.+\.jpg$/i.test(dimCheck.name), dimCheck.name);

  const tiktokDim = await page.evaluate(async () => {
    const { processImageFile } = await import("/src/lib/amazon-prep/process.ts");
    const img = document.querySelector("#thumbs img");
    const res = await fetch(img.src);
    const blob = await res.blob();
    const file = new File([blob], "tall.png", { type: "image/png" });
    const out = await processImageFile(file, {
      resizeMode: "square",
      targetPx: 1200,
      maxBytes: 5 * 1024 * 1024,
      whiteBackground: true,
      upscaleBelowZoom: true,
      upscaleMinPx: 1200,
      filenamePrefix: "tiktok-shop",
    });
    return { w: out.row.width, h: out.row.height, name: out.outputName };
  });
  assert("tiktok square 1200", tiktokDim.w === 1200 && tiktokDim.h === 1200, JSON.stringify(tiktokDim));
  assert("filename tiktok-shop-*.jpg", /^tiktok-shop-.+\.jpg$/i.test(tiktokDim.name));

  const zipped = unzipSync(fs.readFileSync(zipPath));
  const names = Object.keys(zipped);
  assert("zip contains 2 files", names.length === 2, names.join(", "));
  assert(
    "single ZIP is flat jpgs (no folder)",
    names.every((n) => n.toLowerCase().endsWith(".jpg") && !n.includes("/")),
    names.join(", "),
  );

  // Deep link multi
  await page.goto(`${base}/tools/marketplace-image-prep?platform=amazon,etsy`, {
    waitUntil: "networkidle",
  });
  assert(
    "deep link selects amazon+etsy",
    (await page.locator('#platformList input[value="amazon"]').isChecked()) &&
      (await page.locator('#platformList input[value="etsy"]').isChecked()) &&
      !(await page.locator('#platformList input[value="tiktok-shop"]').isChecked()),
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
  setTimeout(() => process.exit(process.exitCode ?? 0), 500);
}
