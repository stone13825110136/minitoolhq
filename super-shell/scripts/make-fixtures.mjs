import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "test-fixtures");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

async function savePng(name, drawFn) {
  const b64 = await page.evaluate(async (fnSource) => {
    const fn = new Function(`return (${fnSource})`)();
    const canvas = document.createElement("canvas");
    fn(canvas);
    return canvas.toDataURL("image/png").split(",")[1];
  }, drawFn.toString());
  const file = path.join(outDir, name);
  fs.writeFileSync(file, Buffer.from(b64, "base64"));
  return file;
}

await savePng("product-red-1800.png", (canvas) => {
  canvas.width = 1800;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f2f2f2";
  ctx.fillRect(0, 0, 1800, 1200);
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(450, 200, 900, 800);
});

await savePng("product-blue-800.png", (canvas) => {
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#eeeeee";
  ctx.fillRect(0, 0, 800, 800);
  ctx.fillStyle = "#2980b9";
  ctx.beginPath();
  ctx.arc(400, 400, 260, 0, Math.PI * 2);
  ctx.fill();
});

await savePng("product-tall-2400.png", (canvas) => {
  canvas.width = 1200;
  canvas.height = 2400;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1200, 2400);
  ctx.fillStyle = "#27ae60";
  ctx.fillRect(200, 200, 800, 2000);
});

// JPEG via canvas for "compress" path
const jpgB64 = await page.evaluate(async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 2200;
  canvas.height = 2200;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 2200, 2200);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#dddddd");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2200, 2200);
  ctx.fillStyle = "#8e44ad";
  ctx.fillRect(400, 400, 1400, 1400);
  return canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
});
fs.writeFileSync(path.join(outDir, "product-square-2200.jpg"), Buffer.from(jpgB64, "base64"));

await browser.close();
console.log("Fixtures written to", outDir);
console.log(fs.readdirSync(outDir).join("\n"));
