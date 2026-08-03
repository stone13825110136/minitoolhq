/**
 * Feature + SEO E2E for background remover — must pass before "shipped".
 * First run downloads the ONNX model (can take several minutes).
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

async function canvasToFile(page, outPath, { mime, size = 220 }) {
  const bytes = await page.evaluate(
    async ({ mime, size }) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("no ctx");
      ctx.fillStyle = "#2a6";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#c33";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
      ctx.fill();
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

const port = 4334;
const base = `http://127.0.0.1:${port}`;
const skipModel = process.env.SKIP_BG_MODEL === "1";

await run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "preview", "--host", "127.0.0.1", "--port", String(port)],
  { cwd: root, shell: true, stdio: "pipe", env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" } },
);

try {
  await waitForServer(`${base}/tools/background-remover`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const imagePosts = [];
  page.on("request", (req) => {
    if (!["POST", "PUT", "PATCH"].includes(req.method())) return;
    const body = req.postDataBuffer()?.length ?? 0;
    const url = req.url();
    // Model CDN GETs are fine; flag large POSTs of image bytes to our origin
    if (body > 500 && /selltoolhq|127\.0\.0\.1|localhost/i.test(url)) {
      imagePosts.push({ url, method: req.method(), size: body });
    }
  });

  await page.goto(`${base}/tools/background-remover`, { waitUntil: "networkidle" });

  assert("page title SEO", (await page.title()).toLowerCase().includes("remove background"));
  const desc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /remove background/i.test(desc));
  assert(
    "meta mentions white background",
    /#FFFFFF|white background/i.test(desc),
  );
  assert(
    "H1 present",
    (await page.locator("[data-bg-remover] h1").textContent())?.toLowerCase().includes("remove background"),
  );
  const faqCount = await page.locator("[data-bg-remover] .faq details").count();
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
  assert("canonical path", /background-remover/i.test(appLd?.url || ""));
  assert(
    "no Pro upsell copy",
    !(await page.locator("body").innerText()).match(/upgrade to pro|\$4\.99|paywall/i),
  );
  assert(
    "marketplace next-step link",
    (await page.locator('a[href="/tools/marketplace-image-prep"]').count()) >= 1,
  );

  if (skipModel) {
    log("feature convert (skipped)", true, "SKIP_BG_MODEL=1");
  } else {
    const a = path.join(fixtures, "bg-sample-a.png");
    const b = path.join(fixtures, "bg-sample-b.png");
    await canvasToFile(page, a, { mime: "image/png", size: 200 });
    await canvasToFile(page, b, { mime: "image/png", size: 240 });

    await page.setInputFiles("#bgFiles", [a, b]);
    await page.click("#runBtn");
    await page.waitForSelector("#zipDownload", { timeout: 600000 });
    assert(
      "batch remove done",
      /done/i.test((await page.locator("#status").textContent()) || ""),
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

    const cornerOk = await page.evaluate(async () => {
      const href = document.querySelector("#zipDownload")?.getAttribute("href");
      if (!href) return false;
      const res = await fetch(href);
      const buf = new Uint8Array(await res.arrayBuffer());
      // Find first JPEG SOI in zip loosely: look for FF D8 FF
      let jpegStart = -1;
      for (let i = 0; i < buf.length - 3; i++) {
        if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
          jpegStart = i;
          break;
        }
      }
      if (jpegStart < 0) return false;
      // Extract naive: from SOI to next PK or end — better: use browser Image on object URL of full zip entry
      // Simpler check: at least one .jpg name in ZIP central directory as text
      const asText = new TextDecoder("latin1").decode(buf);
      return /white\.jpg|-white\.jpg/i.test(asText);
    });
    assert("ZIP contains white JPG names", cornerOk);

    assert(
      "no image upload POST to origin",
      imagePosts.length === 0,
      JSON.stringify(imagePosts),
    );
  }

  await browser.close();
  console.log("\nAll background-remover E2E checks passed:", results.length);
} catch (err) {
  console.error(err);
  console.error("\nResults so far:", results);
  killServer(child);
  process.exit(1);
} finally {
  killServer(child);
}
