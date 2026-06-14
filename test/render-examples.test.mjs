// Demo 全量示例渲染测试
// 遍历 demo/const/mermaidExamples.js 中所有 src，
// 通过 Playwright harness 调用 renderMermaidToSvg + normalizeSvg，
// 断言每条都能产出带 <svg 根节点和 viewBox 的合法 SVG。
// 用途：防止 mermaidExamples.js 在追加示例时引入语法错误。

import assert from "node:assert/strict";
import { test, describe, before, after } from "node:test";
import MERMAID_EXAMPLES from "../demo/const/mermaidExamples.js";
import { openHarness } from "./lib/renderHarness.mjs";

const OK = 0,
  RENDERER_PATH = "/demo/render/mermaid-to-svg.js",
  NORMALIZER_PATH = "/demo/render/normalize-svg.js";

// 渲染单条 mermaid 源：返回 [code, svg]
const renderOne = async (page, src) => {
  const [code, raw] = await page.evaluate(async (text) => {
    return await window.__mods[0].renderMermaidToSvg(text);
  }, src);
  if (code !== OK) return [code, raw];
  const [nCode, normalized] = await page.evaluate(async (r) => {
    return await window.__mods[1].normalizeSvg(r);
  }, raw);
  return [nCode, normalized];
};

describe("render-examples", () => {
  let page, closeHarness;

  before(async () => {
    const [, p, close] = await openHarness([RENDERER_PATH, NORMALIZER_PATH]);
    page = p;
    closeHarness = close;
  });

  after(async () => {
    await closeHarness?.();
  });

  // 至少有 8 条基线（防止 mermaidExamples.js 误删）
  test("baseline: 至少 8 条示例", () => {
    assert.ok(
      MERMAID_EXAMPLES.length >= 8,
      "MERMAID_EXAMPLES 应至少有 8 条，实际 " + MERMAID_EXAMPLES.length,
    );
  });

  // 每条独立测试，命名包含 displayName 便于定位失败
  for (const [type, name, src] of MERMAID_EXAMPLES) {
    test("render: " + name + " [" + type + "]", async () => {
      const [code, svg] = await renderOne(page, src);
      assert.equal(code, OK, "render failed for " + name + ": " + svg);
      assert.ok(typeof svg === "string" && svg.includes("<svg"), "SVG root missing for " + name);
      assert.ok(/viewBox=/.test(svg), "viewBox missing for " + name);
    });
  }
});
