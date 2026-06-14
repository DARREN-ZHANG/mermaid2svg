// i18n-report 生成脚本 —— 扫描所有 locale 文件，生成覆盖报告
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import CODE from "../demo/webc/I18n/CODE.js";
import NAME from "../demo/webc/I18n/NAME.js";

const __dirname = dirname(fileURLToPath(import.meta.url)),
  I18N_DIR = join(__dirname, "..", "demo", "i18n"),
  OUT = join(__dirname, "..", "workflow", "reports", "i18n-report.json");

// Mermaid demo 翻译 key 列表
const MERMAID_KEYS = [
  "title",
  "subtitle",
  "usage_title",
  "benchmark_title",
  "benchmark_tip",
  "editor_title",
  "editor_tip",
  "editor_placeholder",
  "examples_title",
  "theme_label",
  "empty_hint",
  "err_parse",
  "err_render",
  "err_timeout",
  "err_output",
  "chart_raw",
  "chart_gzip",
  "chart_smaller",
  "names",
];

// 加载英文基准
const enData = (await import(join(I18N_DIR, "en.js"))).default();

// 检测 locale 文件是否包含所有 key（基于文本扫描）
const checkLocaleKeys = (code) => {
  const raw = readFileSync(join(I18N_DIR, code + ".js"), "utf-8"),
    missing = MERMAID_KEYS.filter((k) => !new RegExp("\\b" + k + "\\b\\s*:").test(raw)),
    namesMatch = raw.match(/names:\s*\[([\s\S]*?)\]/),
    namesCount = namesMatch ? (namesMatch[1].match(/"/g) || []).length / 2 : 0;
  return { hasAllKeys: missing.length === 0, missingKeys: missing, namesCount };
};

// 判断 locale 是否使用英文 fallback
const isEnglishFallback = (data) => {
  let identical = 0,
    total = 0;
  for (const k of MERMAID_KEYS) {
    if (k === "names") {
      for (let j = 0; j < enData.names.length; ++j) {
        ++total;
        if ((data.names || [])[j] === enData.names[j]) ++identical;
      }
    } else {
      ++total;
      if (data[k] === enData[k]) ++identical;
    }
  }
  return identical / total > 0.5;
};

// 遍历所有 locale
const locales = [];
for (let idx = 0; idx < CODE.length; ++idx) {
  const code = CODE[idx],
    name = NAME[idx],
    check = checkLocaleKeys(code);
  let fallback = false;
  if (code !== "en") {
    try {
      const data = (await import(join(I18N_DIR, code + ".js"))).default();
      fallback = isEnglishFallback(data);
    } catch {
      fallback = true;
    }
  }
  locales.push({
    code,
    name,
    index: idx,
    hasAllKeys: check.hasAllKeys,
    missingKeys: check.missingKeys,
    namesCount: check.namesCount,
    namesExpected: 8,
    isEnglishFallback: fallback,
  });
}

const translatedCount = locales.filter((l) => !l.isEnglishFallback && l.code !== "en").length,
  fallbackCount = locales.filter((l) => l.isEnglishFallback).length,
  allKeysPresent = locales.every((l) => l.hasAllKeys),
  allNamesCorrect = locales.every((l) => l.namesCount === 8),
  sampleChecks = ["en", "zh", "ja", "de", "fr", "es", "ru", "ko", "ar", "hi"]
    .map((code) => locales.find((l) => l.code === code))
    .filter(Boolean)
    .map((l) => ({
      code: l.code,
      name: l.name,
      allKeysPresent: l.hasAllKeys,
      namesCorrect: l.namesCount === 8,
      isFallback: l.isEnglishFallback,
    }));

const report = {
  generatedAt: new Date().toISOString(),
  loop: "i18n-loop",
  totalLocales: CODE.length,
  translationKeys: MERMAID_KEYS,
  keyCount: MERMAID_KEYS.length,
  fallbackStrategy: {
    description:
      "Languages without Mermaid-specific translations fall back to English text. All keys must exist in every locale file; missing keys are not acceptable.",
    fallbackLocale: "en",
    translatedLocales: ["zh", "ja", "ko", "de", "fr", "es", "ru"],
    translatedCount,
    fallbackCount,
  },
  locales,
  coverage: {
    allKeysPresent,
    allNamesCorrect,
    translatedLocales: translatedCount,
    fallbackLocales: fallbackCount,
    missingKeyLocales: locales.filter((l) => !l.hasAllKeys).map((l) => l.code),
    wrongNamesLengthLocales: locales.filter((l) => l.namesCount !== 8).map((l) => l.code),
  },
  sampleChecks,
  verification: {
    checkScript: "sh/check.js",
    checkPassed: allKeysPresent && allNamesCorrect,
    mechanism:
      "import.meta.glob in demo/index.js eagerly loads all locale modules; onLang callback applies translations to DOM elements by ID",
    localeSwitchTestPath:
      "Page loads at / with default English; language picker (c-i18n component) triggers onLang → getI18n → applyI18n",
    domElementIds: [
      "ui-title",
      "ui-subtitle",
      "ui-usage-title",
      "ui-benchmark-title",
      "ui-benchmark-tip",
      "ui-editor-title",
      "ui-editor-tip",
      "ui-examples-title",
      "mermaid-input (placeholder)",
      ".theme-switcher-label",
    ],
  },
};

writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
console.log("Generated " + OUT);
console.log("  Total locales: " + report.totalLocales);
console.log("  All keys present: " + allKeysPresent);
console.log("  All names correct: " + allNamesCorrect);
console.log("  Translated: " + translatedCount + ", Fallback: " + fallbackCount);
