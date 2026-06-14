// 通过 Google Translate 非官方 API 批量生成 SVG 操作按钮的 i18n 文案
// 调用失败或返回英文时自动回退/重试；已生成且有效的语言会跳过
import { existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CODE from "../demo/webc/I18n/CODE.js";

const __dirname = dirname(fileURLToPath(import.meta.url)),
  OUT = join(__dirname, "..", "demo", "const", "svgActionsI18n.js"),
  BASE = {
    copy_svg: "Copy SVG",
    download_svg: "Download SVG",
    copy_ok: "Copied",
    copy_fail: "Copy failed",
  },
  BASE_TEXT = Object.values(BASE).join("\n"),
  KEYS = Object.keys(BASE),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let out = {};
if (existsSync(OUT)) {
  try {
    out = (await import(OUT)).default || {};
  } catch {}
}

const parseParts = (json) => {
  if (!Array.isArray(json) || !Array.isArray(json[0])) return [];
  const first = json[0];
  if (
    first.length === 1 &&
    Array.isArray(first[0]) &&
    typeof first[0][0] === "string" &&
    first[0][0].includes("\n")
  ) {
    return first[0][0].split("\n");
  }
  return first.map((item) => (Array.isArray(item) ? item[0] : ""));
};

const translate = async (target) => {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=" +
    target +
    "&dt=t&q=" +
    encodeURIComponent(BASE_TEXT);
  try {
    const res = await fetch(url),
      json = await res.json(),
      parts = parseParts(json);
    if (parts.length >= 4) {
      const entry = {};
      for (let i = 0; i < 4; ++i) {
        const val = (parts[i] || "").trim();
        entry[KEYS[i]] = val || Object.values(BASE)[i];
      }
      return entry;
    }
  } catch {}
  return { ...BASE };
};

const isFallback = (code) => code !== "en" && out[code] && out[code].copy_svg === BASE.copy_svg;

for (let i = 0; i < CODE.length; ++i) {
  const code = CODE[i];
  if (out[code] && !isFallback(code)) {
    console.log("[" + (i + 1) + "/" + CODE.length + "] " + code + " (skip)");
    continue;
  }
  out[code] = await translate(code);
  console.log("[" + (i + 1) + "/" + CODE.length + "] " + code);
  await sleep(150);
}

const content =
  "// 由 sh/gen-svg-actions-i18n.mjs 自动生成\n" +
  "export default " +
  JSON.stringify(out, null, 2) +
  ";\n";
writeFileSync(OUT, content);
console.log("Generated " + OUT);
