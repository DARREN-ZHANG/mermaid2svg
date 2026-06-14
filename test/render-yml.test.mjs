// Mermaid YAML 渲染测试
// 读取 test/schema.yml 校验每条 test/*.yml，再通过 Playwright 调用 demo/render/mermaid-to-svg.js 渲染，
// 断言 <svg 根节点和 viewBox，并将支持/不支持结果写入 workflow/reports/render-capabilities.json

import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { schema, cases, validate, assertValidCases } from "./lib/schema.js";
import { openHarness } from "./lib/renderHarness.mjs";

const OK = 0,
  REPORT_DIR = "workflow/reports",
  REPORT_FILE = path.join(REPORT_DIR, "render-capabilities.json"),
  RENDERER_PATH = "/demo/render/mermaid-to-svg.js";

// 渲染前做 schema 校验，不合格则直接阻止渲染
assertValidCases(cases, schema);

// 核心样本数量门槛，与 extract/run.js 保持一致
const MIN_MINIMAL_CORE_ACCEPTED = 101;

// 用例数量必须匹配门槛，防止候选集意外收缩
assert.equal(
  cases.length,
  MIN_MINIMAL_CORE_ACCEPTED,
  "测试用例数量应为 " + MIN_MINIMAL_CORE_ACCEPTED + ", 实际 " + cases.length,
);

// 渲染结果存储
const results = [];
let page, closeHarness;

describe("render-yml", () => {
  before(async () => {
    const [, p, close] = await openHarness([RENDERER_PATH]);
    page = p;
    closeHarness = close;

    // 逐个渲染可执行用例
    for (const c of cases) {
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
        return await window.__mods[0].renderMermaidToSvg(text);
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
    await closeHarness?.();
  });

  // schema 校验：所有 YAML 必须匹配 test/schema.yml
  test("schema: all YAML cases match test/schema.yml", () => {
    const errs = [];
    for (const c of cases) errs.push(...validate(c.data, schema, c.data.id));
    assert.deepEqual(errs, [], "schema validation failures:\n" + errs.join("\n"));
  });

  // 每个可执行用例的渲染断言
  for (const c of cases) {
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
