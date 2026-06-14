// Mermaid YAML 渲染测试
// 读取 test/schema.yml 校验每条 test/*.yml，再通过 Playwright 调用 demo/render/mermaid-to-svg.js 渲染，
// 断言 <svg 根节点和 viewBox，并将支持/不支持结果写入 workflow/reports/render-capabilities.json

import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import yaml from "js-yaml";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";
import { test, describe, before, after } from "node:test";

const OK = 0,
  TEST_DIR = "test",
  SCHEMA_FILE = path.join(TEST_DIR, "schema.yml"),
  REPORT_DIR = "workflow/reports",
  REPORT_FILE = path.join(REPORT_DIR, "render-capabilities.json"),
  RENDERER_PATH = "/demo/render/mermaid-to-svg.js",
  HARNESS_PATH = "/__render_test__";

// 读取 schema 定义
const schema = yaml.load(readFileSync(SCHEMA_FILE, "utf8"));

// 读取所有测试用例 (排除 schema.yml)
const all_cases = readdirSync(TEST_DIR)
  .filter((f) => f.endsWith(".yml") && f !== "schema.yml")
  .sort()
  .map((f) => ({ file: f, data: yaml.load(readFileSync(path.join(TEST_DIR, f), "utf8")) }));

// schema 类型检查，支持 [type, "null"] 联合类型
const checkType = (val, type_def) => {
  if (Array.isArray(type_def))
    return type_def.some((t) => (t === "null" ? val === null : checkType(val, t)));
  if (type_def === "object") return val !== null && typeof val === "object" && !Array.isArray(val);
  if (type_def === "array") return Array.isArray(val);
  return typeof val === type_def;
};

// schema 递归校验：检查 required 字段和属性类型
const validateObj = (obj, def, prefix) => {
  const errs = [];
  for (const req of def.required || [])
    if (!(req in obj)) errs.push(prefix + "." + req + " required");
  const props = def.properties || {};
  for (const [key, val] of Object.entries(obj)) {
    const ps = props[key];
    if (!ps) continue;
    const sub = prefix + "." + key;
    if (ps.type === "object" && val && typeof val === "object" && !Array.isArray(val))
      errs.push(...validateObj(val, ps, sub));
    else if (!checkType(val, ps.type))
      errs.push(sub + " type mismatch: expected " + JSON.stringify(ps.type));
  }
  return errs;
};

// 渲染前做 schema 校验，不合格则直接阻止渲染
const schema_errors = [];
for (const c of all_cases) schema_errors.push(...validateObj(c.data, schema, c.data.id));
if (schema_errors.length)
  throw new Error("schema validation failed before render:\n" + schema_errors.join("\n"));

// 渲染结果存储
const results = [];
let browser, page, httpServer, vite;

describe("render-yml", () => {
  before(async () => {
    // 用 vite 中间件处理 mermaid 及其依赖的模块解析
    vite = await createViteServer({
      root: ".",
      server: { middlewareMode: true },
      logLevel: "error",
      appType: "custom",
      optimizeDeps: { include: ["mermaid"] },
    });

    // 包裹 vite 中间件，附加测试 harness 页面路由
    httpServer = createHttpServer((req, res) => {
      const url = (req.url || "/").split("?")[0];
      if (url === HARNESS_PATH) {
        res.setHeader("Content-Type", "text/html");
        res.end("<!DOCTYPE html><html><body></body></html>");
        return;
      }
      vite.middlewares(req, res);
    });

    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const port = httpServer.address().port,
      baseUrl = "http://127.0.0.1:" + port;

    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto(baseUrl + HARNESS_PATH);

    // 预加载渲染器模块到页面全局
    await page.evaluate(async (url) => {
      window.__m2s = await import(url);
    }, baseUrl + RENDERER_PATH);

    // 逐个渲染可执行用例
    for (const c of all_cases) {
      const d = c.data;
      if (d.skip && d.skip.enabled) {
        results.push({
          id: d.id,
          diagramType: d.diagram.type,
          source: d.source.repo,
          ok: false,
          skipped: true,
          errorCode: -1,
          error: d.skip.reason,
        });
        continue;
      }
      const out = await page.evaluate(async (text) => {
        return await window.__m2s.renderMermaidToSvg(text);
      }, d.input.mermaid);
      const code = out[0],
        svg = typeof out[1] === "string" ? out[1] : "",
        ok = code === OK && svg.includes("<svg") && /viewBox=/.test(svg);
      results.push({
        id: d.id,
        diagramType: d.diagram.type,
        source: d.source.repo,
        ok,
        skipped: false,
        errorCode: code,
        error: code === OK ? null : out[1],
        svg: ok ? svg : null,
      });
    }
  });

  after(async () => {
    writeCapabilities();
    await page?.close();
    await browser?.close();
    httpServer?.close();
    await vite?.close();
  });

  // schema 校验：所有 YAML 必须匹配 test/schema.yml
  test("schema: all YAML cases match test/schema.yml", () => {
    const errs = [];
    for (const c of all_cases) errs.push(...validateObj(c.data, schema, c.data.id));
    assert.deepEqual(errs, [], "schema validation failures:\n" + errs.join("\n"));
  });

  // 每个可执行用例的渲染断言
  for (const c of all_cases) {
    const d = c.data;
    if (d.skip && d.skip.enabled) continue;

    test("render: " + d.id, () => {
      const r = results.find((x) => x.id === d.id);
      assert.ok(r, "no render result for " + d.id);
      assert.equal(r.errorCode, OK, "render failed (code " + r.errorCode + "): " + r.error);
      assert.ok(r.svg.includes("<svg"), "SVG root missing");
      assert.ok(/viewBox=/.test(r.svg), "viewBox missing");
      // 检查期望文本
      for (const text of d.expect.svg.containsText)
        assert.ok(r.svg.includes(text), "expected text missing in SVG: " + text);
    });
  }
});

// 生成渲染能力报告
const writeCapabilities = () => {
  const supported = results.filter((r) => r.ok),
    unsupported = results.filter((r) => !r.ok && !r.skipped),
    skipped = results.filter((r) => r.skipped);

  // 按 diagram type 聚合
  const by_type = {};
  for (const r of results) {
    if (r.skipped) continue;
    const t = r.diagramType;
    by_type[t] = by_type[t] || { supported: 0, unsupported: 0 };
    by_type[t][r.ok ? "supported" : "unsupported"]++;
  }

  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    supported: supported.map((r) => ({
      id: r.id,
      diagramType: r.diagramType,
      source: r.source,
    })),
    unsupported: unsupported.map((r) => ({
      id: r.id,
      diagramType: r.diagramType,
      source: r.source,
      errorCode: r.errorCode,
      error: r.error,
    })),
    byDiagramType: by_type,
    summary: {
      total: results.length,
      supported: supported.length,
      unsupported: unsupported.length,
      skipped: skipped.length,
    },
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");
};
