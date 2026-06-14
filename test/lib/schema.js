// 测试用例 schema 校验 helper
// 抽出 render-yml.test.mjs 与 svg-output.test.mjs 中重复的 YAML 读取、
// schema 校验逻辑，供三个浏览器测试文件复用。

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const TEST_DIR = "test",
  SCHEMA_FILE = path.join(TEST_DIR, "schema.yml");

// 读取并解析 test/schema.yml，返回 schema 定义对象
const loadSchema = () => yaml.load(readFileSync(SCHEMA_FILE, "utf8"));

// 读取所有 test/*.yml 用例 (排除 schema.yml)，按文件名排序
const loadCases = () =>
  readdirSync(TEST_DIR)
    .filter((f) => f.endsWith(".yml") && f !== "schema.yml")
    .sort()
    .map((f) => ({ file: f, data: yaml.load(readFileSync(path.join(TEST_DIR, f), "utf8")) }));

// schema 类型检查，支持 [type, "null"] 联合类型
const checkType = (val, typeDef) => {
  if (Array.isArray(typeDef))
    return typeDef.some((t) => (t === "null" ? val === null : checkType(val, t)));
  if (typeDef === "object") return val !== null && typeof val === "object" && !Array.isArray(val);
  if (typeDef === "array") return Array.isArray(val);
  return typeof val === typeDef;
};

// schema 递归校验：检查 required 字段和属性类型，返回错误字符串数组
const validate = (obj, def, prefix) => {
  const errs = [];
  for (const req of def.required || [])
    if (!(req in obj)) errs.push(prefix + "." + req + " required");
  const props = def.properties || {};
  for (const [key, val] of Object.entries(obj)) {
    const ps = props[key];
    if (!ps) continue;
    const sub = prefix + "." + key;
    if (ps.type === "object" && val && typeof val === "object" && !Array.isArray(val))
      errs.push(...validate(val, ps, sub));
    else if (!checkType(val, ps.type))
      errs.push(sub + " type mismatch: expected " + JSON.stringify(ps.type));
  }
  return errs;
};

// 对全部用例执行 schema 校验，不合格则直接抛错阻止后续渲染
const assertValidCases = (allCases, schemaDef) => {
  const errs = [];
  for (const c of allCases) errs.push(...validate(c.data, schemaDef, c.data.id));
  if (errs.length) throw new Error("schema validation failed:\n" + errs.join("\n"));
};

// 预加载 schema 和用例，供测试文件直接使用
const schema = loadSchema();
const cases = loadCases();

export { schema, cases, validate, assertValidCases };
