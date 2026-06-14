// Mermaid 渲染速度基准测试
// 复用 render-yml.test.mjs 的 Vite + Playwright 测试架构，
// 在同一浏览器页面内逐条测量 YAML 用例的 renderMermaidToSvg 与 normalizeSvg 耗时。
// 仅记录用例内耗时，不把服务器启动、模块加载、浏览器启动计入单条生成速度。

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
  REPORT_DIR = "workflow/reports",
  REPORT_FILE = path.join(REPORT_DIR, "render-speed-report.json"),
  RENDERER_PATH = "/demo/render/mermaid-to-svg.js",
  NORMALIZER_PATH = "/demo/render/normalize-svg.js",
  HARNESS_PATH = "/__render_speed_test__";

// 读取所有测试用例 (排除 schema.yml)，按文件名排序
const allCases = readdirSync(TEST_DIR)
  .filter((f) => f.endsWith(".yml") && f !== "schema.yml")
  .sort()
  .map((f) => ({ file: f, data: yaml.load(readFileSync(path.join(TEST_DIR, f), "utf8")) }));

// 仅测量非 skipped 用例
const measurableCases = allCases.filter((c) => !(c.data.skip && c.data.skip.enabled));

// 每条用例的速度记录
const speedRecords = [];
let browser, page, httpServer, vite;

describe("render-speed", () => {
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

    // 预加载渲染器和归一化模块到页面全局
    await page.evaluate(
      async (urls) => {
        window.__m2s = await import(urls.renderer);
        window.__norm = await import(urls.normalizer);
      },
      { renderer: baseUrl + RENDERER_PATH, normalizer: baseUrl + NORMALIZER_PATH }
    );

    // JIT 预热：Mermaid 首次渲染会触发懒加载与代码编译，
    // 即便 optimizeDeps 已预打包也无法完全消除。
    // 在测量循环前做一次丢弃结果的预热渲染，避免首个用例被 JIT 开销污染。
    await page.evaluate(async () => {
      await window.__m2s.renderMermaidToSvg("graph LR\n  A-->B");
    });

    // 逐条测量可执行用例
    for (const c of measurableCases) {
      const d = c.data;
      // 在页面内用 performance.now 分别测量 render 与 normalize 耗时
      const measured = await page.evaluate(async (text) => {
        const t0 = performance.now();
        const renderOut = await window.__m2s.renderMermaidToSvg(text);
        const t1 = performance.now();
        const renderMs = t1 - t0;
        const renderCode = renderOut[0],
          rawSvg = renderOut[1],
          diagramType = renderOut[2];
        // 渲染失败时不测量 normalize
        if (renderCode !== 0) {
          return {
            code: renderCode,
            diagramType: diagramType || null,
            renderMs,
            normalizeMs: 0,
            totalMs: renderMs,
          };
        }
        const t2 = performance.now();
        const normOut = window.__norm.normalizeSvg(rawSvg);
        const t3 = performance.now();
        const normalizeMs = t3 - t2;
        return {
          code: normOut[0],
          diagramType: diagramType || null,
          renderMs,
          normalizeMs,
          totalMs: renderMs + normalizeMs,
        };
      }, d.input.mermaid);

      speedRecords.push({
        id: d.id,
        diagramType: measured.diagramType || d.diagram.type,
        source: d.source.repo,
        renderMs: round3(measured.renderMs),
        normalizeMs: round3(measured.normalizeMs),
        totalMs: round3(measured.totalMs),
        code: measured.code,
      });
    }
  });

  after(async () => {
    writeSpeedReport();
    await page?.close();
    await browser?.close();
    httpServer?.close();
    await vite?.close();
  });

  // 断言速度记录已采集且字段完整
  test("speed records have expected fields", () => {
    assert.ok(speedRecords.length > 0, "未采集到任何速度记录");
    assert.equal(
      speedRecords.length,
      measurableCases.length,
      "速度记录数量应等于可测量用例数量"
    );
    // 检查每条记录的字段完整性
    for (const r of speedRecords) {
      assert.ok(r.id, "记录缺少 id");
      assert.ok(r.diagramType, "记录缺少 diagramType");
      assert.ok(r.source, "记录缺少 source");
      assert.equal(typeof r.renderMs, "number", "renderMs 应为数字");
      assert.equal(typeof r.normalizeMs, "number", "normalizeMs 应为数字");
      assert.equal(typeof r.totalMs, "number", "totalMs 应为数字");
      assert.equal(r.code, OK, "用例 " + r.id + " 渲染失败 (code " + r.code + ")");
      assert.ok(r.totalMs > 0, "totalMs 应大于 0");
    }
  });
});

// 保留三位小数，避免浮点精度噪声
const round3 = (n) => Math.round(n * 1000) / 1000;

// 计算百分位：采用 nearest-rank 方法
// 将样本升序排列后取第 ceil(p * n) - 1 位的值 (0-indexed)
const percentile = (sortedValues, p) => {
  const n = sortedValues.length;
  if (n === 0) return 0;
  const idx = Math.max(0, Math.min(n - 1, Math.ceil(p * n) - 1));
  return sortedValues[idx];
};

// 生成速度报告 JSON
const writeSpeedReport = () => {
  // 仅统计成功渲染的用例（code === OK），
  // 失败用例仍记录在 cases[] 数组中以保持可观测性，但不参与汇总统计。
  const okRecords = speedRecords.filter((r) => r.code === OK);
  const totals = okRecords.map((r) => r.totalMs).sort((a, b) => a - b);
  const n = totals.length;
  const sum = totals.reduce((acc, v) => acc + v, 0);
  const avgMs = n > 0 ? round3(sum / n) : 0;
  const p50Ms = round3(percentile(totals, 0.5));
  const p95Ms = round3(percentile(totals, 0.95));
  const maxMs = n > 0 ? round3(totals[n - 1]) : 0;

  // 按 totalMs 降序取最慢 10 条（同样仅含成功用例）
  const slowest = [...okRecords]
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 10);

  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    caseCount: speedRecords.length,
    environment: {
      browser: "chromium",
      tool: "playwright",
    },
    summary: {
      avgMs,
      p50Ms,
      p95Ms,
      maxMs,
    },
    slowest,
    cases: speedRecords,
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + "\n");
};
