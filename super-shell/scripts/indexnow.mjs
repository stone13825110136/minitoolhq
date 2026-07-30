/**
 * Ping IndexNow (Bing / Yandex / others) after deploy.
 * Usage: node scripts/indexnow.mjs
 * Optional: node scripts/indexnow.mjs https://selltoolhq.com/tools/new-tool
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, "indexnow-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const extra = process.argv.slice(2).filter((u) => /^https:\/\//i.test(u));
const urlList = [...new Set([...config.urlList, ...extra])];

const body = {
  host: config.host,
  key: config.key,
  keyLocation: config.keyLocation,
  urlList,
};

const res = await fetch(config.endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log(`IndexNow HTTP ${res.status}`);
if (text) console.log(text);
console.log(`Submitted ${urlList.length} URL(s) for ${config.host}`);

// 200 / 202 = accepted
if (res.status !== 200 && res.status !== 202) {
  process.exitCode = 1;
}
