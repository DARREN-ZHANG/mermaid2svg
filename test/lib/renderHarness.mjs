// 浏览器渲染测试 harness
// 抽出 render-yml / svg-output / render-speed 三个测试文件中重复的
// Vite 中间件 + HTTP 服务器 + Playwright 浏览器初始化逻辑。
// 调用 openHarness(modulePaths) 即可获得 [browser, page, close]，
// 页面内模块按数组顺序挂到 window.__mods。

import { createServer as createHttpServer } from "node:http";
import { chromium } from "playwright";
import { createServer as createViteServer } from "vite";

// harness 页面路由路径 (统一使用一个，因为每次测试运行在独立服务器中)
const HARNESS_PATH = "/__test_harness__";

// 启动 Vite + HTTP 服务器 + Playwright 浏览器，
// 按顺序将 modulePaths 对应模块导入到 window.__mods 数组。
// 返回 [browser, page, close]，close 为异步清理函数。
const openHarness = async (modulePaths) => {
  // 用 vite 中间件处理 mermaid 及其依赖的模块解析
  const vite = await createViteServer({
    root: ".",
    server: { middlewareMode: true },
    logLevel: "error",
    appType: "custom",
    optimizeDeps: { include: ["mermaid"] },
  });

  // 包裹 vite 中间件，附加测试 harness 页面路由
  const httpServer = createHttpServer((req, res) => {
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

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl + HARNESS_PATH);

  // 预加载模块到页面全局 window.__mods 数组
  // 并行导入：ES 规范保证 Promise.all 结果顺序与入参数组一致，可安全替代顺序加载
  const urls = modulePaths.map((p) => baseUrl + p);
  await page.evaluate(async (u) => {
    window.__mods = await Promise.all(u.map((url) => import(url)));
  }, urls);

  // 异步清理：关闭浏览器、页面、HTTP 服务器、Vite 服务器
  // 每步单独 try-catch，避免单个资源失败导致后续资源泄漏
  const close = async () => {
    await page?.close().catch(() => {});
    await browser?.close().catch(() => {});
    httpServer?.close();
    await vite?.close().catch(() => {});
  };

  return [browser, page, close];
};

export { openHarness };
