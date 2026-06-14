// 一次性脚本：将 demo/i18n/*.js（除 zh.js / en.js）的 names 数组扩到 24 项
// 前 8 项保留本地化，后 16 项追加 en.js 的英文作为占位。
// 跑一次：bun scripts/i18n-expand.mjs
// 跑完后可保留作为参考，或删除。

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ERR from "@3-/log/ERR.js";

const I18N_DIR = join(import.meta.dirname, "..", "demo", "i18n"),
  SKIP_FILES = new Set(["zh.js", "en.js"]);

// 通过动态导入读取 JS 模块的 names 数组，避免正则无法处理转义引号
const readNames = async (file) => {
  const mod = await import(file);
  return mod.default().names;
};

// 从源文件提取前 8 项 names（保留本地化）
const extractFirst8 = async (file) => {
  const names = await readNames(file);
  if (names.length < 8) {
    throw new Error(file + " names 数组少于 8 项，实际 " + names.length);
  }
  return names.slice(0, 8);
};

// 将字符串序列化为双引号 JS 字符串字面量，转义其中的双引号和反斜杠
const jsString = (s) => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';

// 替换源文件中的 names 数组为新数组
const replaceNames = (content, newNames) => {
  // 缩进 4 空格，每行一项，符合现有风格
  const body = "names: [\n" + newNames.map((n) => "    " + jsString(n) + ",").join("\n") + "\n  ],";
  return content.replace(/names:\s*\[([\s\S]*?)\],?/, body);
};

const main = async () => {
  const enNames = await readNames(join(I18N_DIR, "en.js"));
  if (enNames.length !== 24) {
    throw new Error("en.js names 应有 24 项，实际 " + enNames.length);
  }
  const enTail16 = enNames.slice(8); // 后 16 项英文占位

  const files = (await readdir(I18N_DIR)).filter((f) => f.endsWith(".js") && !SKIP_FILES.has(f));

  console.log("Processing " + files.length + " files...");
  let processed = 0;
  for (const f of files) {
    const filepath = join(I18N_DIR, f),
      content = await readFile(filepath, "utf8"),
      first8 = await extractFirst8(filepath),
      newNames = [...first8, ...enTail16],
      newContent = replaceNames(content, newNames);
    await writeFile(filepath, newContent);
    processed++;
  }
  console.log("Done. Processed " + processed + " files.");
};

main().catch((e) => {
  ERR(e);
  process.exit(1);
});
