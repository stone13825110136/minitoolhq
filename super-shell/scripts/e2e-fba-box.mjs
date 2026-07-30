/**
 * Feature E2E for FBA Box Size Checker — must pass before "shipped".
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

async function waitForServer(url, ms = 90000) {
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

const port = 4328;
const base = `http://127.0.0.1:${port}`;
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["astro", "dev", "--host", "127.0.0.1", "--port", String(port), "--force"],
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
  await waitForServer(`${base}/tools/fba-box-size-checker`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const posts = [];
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH"].includes(req.method())) {
      const body = req.postDataBuffer()?.length ?? 0;
      if (body > 0) posts.push({ url: req.url(), method: req.method(), size: body });
    }
  });

  await page.goto(`${base}/tools/fba-box-size-checker`, { waitUntil: "networkidle" });

  // SEO (primary: amazon fba box size)
  assert("page title SEO", (await page.title()).includes("FBA Box Size Checker"));
  const fbaDesc = (await page.locator('meta[name="description"]').getAttribute("content")) || "";
  assert("meta description has primary keyword", /amazon fba box size/i.test(fbaDesc));
  assert(
    "meta has secondary long-tail",
    /carton size|box dimensions|AWD/i.test(fbaDesc),
  );
  assert(
    "H1 present",
    (await page.locator("[data-fba-box] h1").textContent())?.includes("FBA Box Size Checker"),
  );
  assert("rules table", (await page.locator("[data-fba-box] table.data").count()) >= 1);
  const fbaFaqCount = await page.locator("[data-fba-box] .faq details").count();
  assert("FAQ >= 5", fbaFaqCount >= 5);
  const fbaFaqLd = await page.evaluate(() => {
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
  assert(
    "FAQPage JSON-LD matches FAQ count",
    fbaFaqLd >= fbaFaqCount,
    `ld=${fbaFaqLd} faq=${fbaFaqCount}`,
  );

  const home = await context.newPage();
  await home.goto(base, { waitUntil: "domcontentloaded" });
  assert(
    "homepage links to tool",
    (await home.locator('a[href="/tools/fba-box-size-checker"]').count()) >= 1,
  );
  await home.close();

  await page.click("#checkBtn");
  await page.waitForSelector(".result-card.pass");
  assert("default sample Pass", (await page.locator(".result-card.pass").count()) === 1);
  const dimText = (await page.locator(".dim-ref").first().textContent()) || "";
  assert("DIM reference shown", /DIM reference|Dimensional weight/i.test(dimText));
  assert("DIM divisor 139", /÷\s*139|\/\s*139|÷ 139/.test(dimText) || dimText.includes("139"));
  assert("DIM not a fee quote", /not a fee quote/i.test(dimText));
  // 20×16×12 = 3840 / 139 ≈ 27.63; actual 28 → billable ≈ 28
  assert(
    "DIM math for sample",
    /27\.6|27\.63|27\.62/.test(dimText) && /28/.test(dimText),
    dimText.slice(0, 200),
  );
  assert("export enabled after check", !(await page.locator("#exportCsvBtn").isDisabled()));

  await page.fill(".len", "40");
  await page.fill(".wid", "20");
  await page.fill(".hei", "20");
  await page.fill(".wgt", "30");
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card.fail");
  assert("oversize Fail", (await page.locator(".result-card.fail").count()) === 1);
  const failText = (await page.locator(".result-card.fail").textContent()) || "";
  assert("fail names length rule", /Longest side|max length/i.test(failText), failText.slice(0, 140));

  await page.fill(".len", "10");
  await page.fill(".wid", "30");
  await page.fill(".hei", "20");
  await page.fill(".wgt", "20");
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card.pass");
  assert("sorted sides Pass FBA", (await page.locator(".result-card.pass").count()) === 1);

  await page.check('input[name="program"][value="awd"]');
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card.fail");
  assert("AWD fails 30in length", (await page.locator(".result-card.fail").count()) === 1);
  assert("AWD unit panel visible", await page.locator("#awdUnitPanel").isVisible());
  assert(
    "FAQ covers Jul 2026 AWD",
    (await page.locator("[data-fba-box] .faq details").filter({ hasText: /July 31, 2026/i }).count()) >= 1,
  );
  assert(
    "privacy callout present",
    /Private by design|never uploaded/i.test((await page.locator(".privacy-callout").textContent()) || ""),
  );

  // Carton within AWD outer limits + unit over Jul 2026 threshold → unit Fail
  await page.fill(".len", "20");
  await page.fill(".wid", "16");
  await page.fill(".hei", "12");
  await page.fill(".wgt", "28");
  await page.fill("#unitLen", "18");
  await page.fill("#unitWid", "10");
  await page.fill("#unitHei", "6");
  await page.fill("#unitWgt", "8");
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card");
  const awdCards = page.locator(".result-card");
  assert("AWD carton+unit yields 2 cards", (await awdCards.count()) === 2);
  assert(
    "AWD unit fails at 18in exclusive",
    (await page.locator(".result-card.fail").filter({ hasText: /AWD unit/i }).count()) >= 1,
  );

  await page.fill("#unitLen", "12");
  await page.fill("#unitWid", "10");
  await page.fill("#unitHei", "6");
  await page.fill("#unitWgt", "8");
  await page.click("#checkBtn");
  await page.waitForFunction(() => {
    const cards = [...document.querySelectorAll(".result-card")];
    return cards.length === 2 && cards.every((c) => c.classList.contains("pass"));
  });
  assert("AWD carton+unit both Pass", (await page.locator(".result-card.pass").count()) === 2);

  await page.check('input[name="program"][value="fba"]');
  assert("AWD unit panel hidden on FBA", !(await page.locator("#awdUnitPanel").isVisible()));
  await page.check('input[name="units"][value="metric"]');
  await page.fill(".len", "50");
  await page.fill(".wid", "40");
  await page.fill(".hei", "30");
  await page.fill(".wgt", "10");
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card.pass");
  assert("metric Pass FBA", (await page.locator(".result-card.pass").count()) === 1);

  for (let i = 0; i < 5; i++) await page.click("#addCartonBtn");
  await page.waitForFunction(() => document.querySelectorAll(".carton-row").length === 6);
  assert("no Pro banner on FBA tool", (await page.locator("#proBanner").count()) === 0);
  assert("no Pro upgrade section", (await page.locator("#pro-upgrade").count()) === 0);

  const rowCount = await page.locator(".carton-row").count();
  for (let i = 0; i < rowCount; i++) {
    const row = page.locator(".carton-row").nth(i);
    await row.locator(".len").fill("18");
    await row.locator(".wid").fill("14");
    await row.locator(".hei").fill("10");
    await row.locator(".wgt").fill("15");
  }
  await page.click("#checkBtn");
  await page.waitForSelector(".result-card");
  assert("checks all 6 cartons free", (await page.locator(".result-card").count()) === 6);
  assert(
    "status has no Pro upsell",
    !/Upgrade to Pro/i.test((await page.locator("#status").textContent()) || ""),
  );

  // Local CSV import (FileReader only — no upload)
  const csv = "length,width,height,weight\n18,14,10,15\n22,16,12,30\n40,20,20,25\n";
  await page.setInputFiles("#csvFileInput", {
    name: "cartons.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf8"),
  });
  await page.waitForFunction(() => document.querySelectorAll(".carton-row").length === 3);
  assert("CSV import loads 3 rows", (await page.locator(".carton-row").count()) === 3);
  assert(
    "CSV status mentions local/import",
    /Imported 3|Nothing uploaded|not uploaded|from CSV/i.test(
      (await page.locator("#status").textContent()) || "",
    ),
  );
  await page.click("#checkBtn");
  await page.waitForFunction(() => document.querySelectorAll(".result-card").length >= 3);
  assert("CSV check yields 3+ result cards", (await page.locator(".result-card").count()) >= 3);
  assert(
    "CSV oversize carton fails",
    (await page.locator(".result-card.fail").count()) >= 1,
  );
  assert(
    "each carton card has DIM ref",
    (await page.locator(".result-card .dim-ref").count()) >= 3,
  );

  // FAQ coverage for new features
  assert(
    "FAQ covers CSV import",
    (await page.locator("[data-fba-box] .faq details").filter({ hasText: /CSV/i }).count()) >= 1,
  );
  assert(
    "FAQ covers dimensional weight",
    (await page.locator("[data-fba-box] .faq details").filter({ hasText: /dimensional weight/i }).count()) >=
      1,
  );

  assert("no measurement body uploads", posts.length === 0, JSON.stringify(posts));

  await browser.close();
  console.log("\nAll assertions passed.\n\n--- SUMMARY ---");
  for (const r of results) {
    console.log(`| ${r.caseName} | ${r.pass ? "pass" : "fail"} | ${r.notes} |`);
  }
} catch (err) {
  console.error(err);
  console.error("\nServer log:\n", serverLog.slice(-4000));
  killServer();
  process.exit(1);
} finally {
  killServer();
}
