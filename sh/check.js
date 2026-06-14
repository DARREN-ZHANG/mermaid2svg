#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join } from "node:path";
import LANG_CODES from "../demo/webc/I18n/CODE.js";
import ERR from "@3-/log/ERR.js";
import ROOT from "./ROOT.js";

const I18N_DIR = join(ROOT, "demo", "i18n"),
  ZH_PATH = join(I18N_DIR, "zh.js"),
  EN_PATH = join(I18N_DIR, "en.js"),
  checkSimilarity = (data, en_data, en_keys) => {
    let total = 0,
      identical = 0;
    const identical_entries = [];

    for (const key of en_keys) {
      if (key === "names") {
        const { names: en_names } = en_data,
          { names = [] } = data;
        for (let j = 0; j < en_names.length; ++j) {
          ++total;
          if (names[j] === en_names[j]) {
            ++identical;
            identical_entries.push("names[" + j + "]: " + en_names[j]);
          }
        }
      } else {
        ++total;
        if (data[key] === en_data[key]) {
          ++identical;
          identical_entries.push(key + ": " + en_data[key]);
        }
      }
    }
    return [identical / total, identical + "/" + total, identical_entries];
  },
  checkFile = async (file_path, zh_keys, en_keys, expected_length, en_data, code) => {
    const { default: lang_fn } = await import(file_path);
    if (typeof lang_fn !== "function") {
      return ["Default export is not a function", false];
    }

    const data = lang_fn();
    if (!data) {
      return ["Data is empty/invalid", false];
    }

    const missing_keys = zh_keys.filter((key) => !(key in data));
    if (missing_keys.length > 0) {
      return ["Missing keys: " + missing_keys.join(", "), false];
    }

    const { names } = data;
    if (!Array.isArray(names)) {
      return ["Names array is missing or invalid", false];
    }

    if (names.length !== expected_length) {
      return ["Names array length is " + names.length + ", expected " + expected_length, false];
    }

    if (code !== "en") {
      const [ratio] = checkSimilarity(data, en_data, en_keys);
      if (ratio > 1) {
        return [undefined, true];
      }
    }
    return [undefined, false];
  },
  check = async () => {
    let zh_data, en_data;
    try {
      const zh_fn = (await import(ZH_PATH)).default;
      zh_data = zh_fn();
    } catch (err) {
      ERR("❌ 无法导入中文基准文件: " + err.message);
      return false;
    }
    try {
      const en_fn = (await import(EN_PATH)).default;
      en_data = en_fn();
    } catch (err) {
      ERR("❌ 无法导入英文基准文件: " + err.message);
      return false;
    }

    const zh_keys = Object.keys(zh_data),
      en_keys = Object.keys(en_data).filter((k) => k !== "title"),
      { names: zh_names } = zh_data,
      expected_length = zh_names.length,
      missing_files = [],
      invalid_files = [],
      warn_files = [];

    for (let i = 0; i < LANG_CODES.length; ++i) {
      const code = LANG_CODES[i],
        rel_path = "demo/i18n/" + code + ".js",
        file_path = join(I18N_DIR, code + ".js");

      if (!existsSync(file_path)) {
        missing_files.push(rel_path);
        continue;
      }

      try {
        const [err_reason, is_warn] = await checkFile(
          file_path,
          zh_keys,
          en_keys,
          expected_length,
          en_data,
          code,
        );
        if (err_reason) {
          invalid_files.push({ rel_path, reason: err_reason });
        } else if (is_warn) {
          warn_files.push(rel_path);
        }
      } catch (err) {
        invalid_files.push({ rel_path, reason: "Parse error: " + err.message });
      }
    }

    if (missing_files.length === 0 && invalid_files.length === 0) {
      if (warn_files.length > 0) {
        console.warn("⚠️  " + warn_files.length + " 个语言文件与英文内容相同超过 5%");
      } else {
        console.log("✅ 所有 " + LANG_CODES.length + " 个语言文件完整且长度正确。");
      }
      return true;
    }

    ERR("❌ 语言文件校验失败！");
    if (missing_files.length > 0) {
      ERR("⚠️ 缺失的语言文件 (" + missing_files.length + " 个):");
      missing_files.forEach((p) => {
        ERR("  - " + p);
      });
    }
    if (invalid_files.length > 0) {
      ERR("⚠️ 格式或内容不正确的语言文件 (" + invalid_files.length + " 个):");
      invalid_files.forEach(({ rel_path, reason }) => {
        ERR("  - " + rel_path + ": " + reason);
      });
    }

    return false;
  };

export default check;

if (import.meta.main) {
  const ok = await check();
  process.exit(ok ? 0 : 1);
}
