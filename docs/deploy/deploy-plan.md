# Cloudflare Pages Deploy Plan

> Mermaid → SVG Demo 部署计划。本文档由 Deploy Loop 生成，覆盖 HG-6、AC-DEPLOY-001/002 与 spec §11 的全部要求。

---

## 1. 部署模型定性

| 维度 | 结论 | 依据 |
|---|---|---|
| 站点类型 | 纯静态站点（SPA 单页入口） | `demo/dist/index.html` + 静态 JS/CSS/JSON 资源 |
| 服务端运行能力 | **不需要** | 无 SSR、无 API route、无 Functions 依赖 |
| 渲染引擎位置 | 浏览器端 | `import mermaid from "mermaid"` 在构建时打包进 JS chunk（`src/render/mermaid-to-svg.js`） |
| 数据库 / 队列 / 云存储 | 无 | HG-6 明确禁止；构建产物中无相关引用 |
| 多语言机制 | 客户端运行时切换 | 75 个 locale 模块经 `import.meta.glob` 打包；`webc/I18n/i18n/<code>/js.json` 运行时 fetch |

**结论**：Cloudflare Pages 的静态托管能力即可满足全部需求，无需 Pages Functions、Workers 或服务端运行时。

---

## 2. 构建配置（HG-6 核心交付）

### 2.1 构建命令

```
bun install --frozen-lockfile && bun run build
```

- `bun run build` 执行 `package.json` 的 `build` 脚本 → `bun demo/build.js`
- `demo/build.js` 做两件事：
  1. 调用 Vite `build()`（root=`demo`）产出 hashed JS/CSS 到 `demo/dist/assets/`
  2. `cpSync` 拷贝 `webc/I18n/i18n/` 与 `webc/BoxX/i18n/` 到 `demo/dist/webc/`（运行时语言数据）
- `bun.lock` 存在，确保依赖解析一致

### 2.2 输出目录

```
demo/dist
```

| dist 顶层内容 | 来源 | 说明 |
|---|---|---|
| `index.html` | Vite + Pug 插件 | 单页入口 |
| `assets/` | Vite | hashed JS chunk + 合并 CSS |
| `webc/I18n/i18n/` | `build.js` cpSync | 75 语言 JSON（`<code>/js.json`） |
| `webc/BoxX/i18n/` | `build.js` cpSync | BoxX 组件语言 JSON |
| `favicon*`, `site.webmanifest` 等 | `demo/public/` | Vite 自动拷贝到 dist 根 |

### 2.3 所需环境变量

**构建期：无必需环境变量。**

- 构建脚本（`bun demo/build.js`）不读取 `.env`
- `--env-file=.env` 仅用于 `agent:*` 工作流脚本（tsx），不参与生产构建
- 验证：本次本地构建未提供任何环境变量，exit 0

> 可选：`BUN_VERSION=1.3.14`（用于在 CF Pages 固定 bun 版本，非必需）。

### 2.4 重定向 / SPA Fallback

**结论：不需要 `_redirects` 或 SPA fallback。**

依据：
1. 单一入口 `index.html`，无 history API 路由
2. 多语言切换通过 `c-i18n` 组件在客户端 fetch JSON（`/webc/I18n/i18n/<code>/js.json`），不产生新的 URL 路径
3. 所有资源路径为绝对路径（`/assets/...`、`/webc/...`），部署到根域即可直接命中

若未来加入子路径路由或预览路径，再评估 `_redirects` 的 `/* /index.html 200`。

---

## 3. Cloudflare Pages 控制台配置

| 字段 | 推荐值 |
|---|---|
| Framework preset | None（纯静态，无框架预设） |
| Build command | `bun install --frozen-lockfile && bun run build` |
| Build output directory | `demo/dist` |
| Root directory | （留空，仓库根） |
| Environment variables | 无必需；可选 `BUN_VERSION=1.3.14` |
| Build watch paths | 默认（全仓库） |

### 3.1 bun 可用性说明（待部署期验证）

- 项目工具链为 bun（`bun.lock`、`package.json` scripts 使用 `bun`）
- `demo/build.js` 为标准 ESM（`import { build } from "vite"`、`import { cpSync } from "node:fs"`），不依赖 bun 专属 API，理论上 `node demo/build.js` 亦可执行
- Cloudflare Pages 构建镜像对 bun 的支持以平台为准；若镜像未预装 bun，可采用如下任一兜底：

| 兜底方案 | 构建命令 | 说明 |
|---|---|---|
| A（推荐）安装 bun | `npm i -g bun && bun install --frozen-lockfile && bun run build` | 与本地工具链完全一致 |
| B（Node 兜底） | `npm install && node demo/build.js` | `build.js` 为标准 ESM；npm 会做独立解析（无 `bun.lock`） |

> 不确定性记录：本 Deploy Loop 仅做本地构建验证，未在真实 Cloudflare Pages 环境跑通。bun 是否预装于镜像属部署期人工验证项（见 §6）。

---

## 4. 路径与资源正确性

### 4.1 绝对路径在根域部署下成立

构建后的 `index.html` 引用：
- `/assets/index-<hash>.js`、`/assets/index-<hash>.css` 等（Vite 默认 `base: '/'`）
- 运行时 fetch `/webc/I18n/i18n/<code>/js.json`（见 `demo/webc/I18n/i18n.js`）

→ 部署到 Cloudflare Pages 根域（如 `https://<project>.pages.dev`）时，绝对路径直接命中，无需调整 `base`。

> 若部署到子路径（非根），需将 Vite `base` 设为子路径并同步 i18n fetch 前缀。当前规划为根域部署，无需改动。

### 4.2 外部 CDN 依赖

| 资源 | URL | 性质 | 降级 |
|---|---|---|---|
| `_.css` | `https://registry.npmmirror.com/18s/0.2.24/files/_.css` | 样式框架（`index.pug` head） | 加载失败不影响 Mermaid 渲染核心功能；默认主题（`mermaid-default`）本身无 overlay，不依赖任何 CDN（HG-4 / AC-THEME-003） |

默认 Mermaid 渲染 + 默认主题不依赖外部 CDN，满足"默认主题不应依赖外部 CDN 才能正常显示"。

---

## 5. 本地构建验证结果

| 项 | 值 |
|---|---|
| 命令 | `bun run build` |
| 退出码 | 0 |
| 耗时 | 269ms |
| 输出目录 | `demo/dist` |
| dist 总大小 | 3.9 MB |
| asset chunk 数 | 77 |
| chunk-size 警告 | >500kB（预期，已由 Size Loop 记录为体积 proxy，非阻断） |
| 机器可读证据 | `workflow/runs/deploy/run-1/local-build-result.json` |

构建产物关键文件（来自本次构建日志）：

| 文件 | raw | gzip |
|---|---|---|
| `demo/dist/index.html` | 4.41 kB | 1.57 kB |
| `demo/dist/assets/index-CsSmk8RF.js`（entry） | 186.57 kB | 46.82 kB |
| `demo/dist/assets/index-B_6EgLaf.css` | 31.85 kB | 6.08 kB |

> 注：本次重新构建 entry hash 为 `index-CsSmk8RF.js`，与 size-report.json 中 `index-BzHJhuCY.js` 不同（内容有微小变动）。体积对比口径以 Size Loop 报告为准；部署计划仅证明构建可重复且 exit 0。

---

## 6. 部署后功能验收清单（AC-DEPLOY-002）

部署到 Cloudflare Pages 后，需逐项确认（公网 URL）：

| 验收项 | 验证方式 | 对应 AC |
|---|---|---|
| Mermaid 输入 → SVG 预览 | 输入合法 flowchart，确认 SVG 出现 | AC-UI-001/002 |
| 8 类示例图展示 | 滚动至 Examples，确认 SVG 渲染（非截图） | AC-UI-003 |
| 主题切换 | 点击主题按钮，确认 SVG 样式变化、localStorage 持久 | AC-THEME-001/002 |
| 体积对比 SVG 柱状图 | 确认 `#size-chart` 内 SVG 存在、数据与 size-report.json 一致 | AC-COMPARE-001/004 |
| 多语言切换 | 切换 zh/ja/de 等，确认文案更新、功能不崩 | AC-I18N-001/002 |
| 静态资源 200 | DevTools Network 无 404（`/assets/*`、`/webc/I18n/i18n/*`） | AC-DEPLOY-001 |
| 无 hydration 错误 | Console 无 uncaught error | AC-DEPLOY-001 |

---

## 7. 待人工确认项（部署期）

以下为 Deploy Loop 无法在本地闭环、需部署期人工验证的事项：

1. **bun 在 CF Pages 镜像的可用性**：确认是否预装；若否，采用 §3.1 兜底方案 A。
2. **首次部署公网 URL**：记录 production / preview URL 到部署报告。
3. **`_.css` CDN 在部署环境的可达性**：`registry.npmmirror.com` 在 CF 边缘网络的连通性（仅影响装饰样式，不影响核心功能）。
4. **构建时长**：记录 CF Pages 实际构建耗时与退出码。

---

## 8. 约束遵守

| 约束 | 状态 |
|---|---|
| 不新增服务端运行 / 数据库 / 队列 | 满足（纯静态） |
| 不修改 `src/**`、`lib/**`、parent docs、`references/**` | 满足 |
| 不做最终验收签发 | 满足（本 Loop 仅规划，不做 final sign-off） |
| 改动范围限于 `docs/deploy/**`、`workflow/runs/deploy/**` | 满足 |

---

## 9. 交付物索引

| 产物 | 路径 |
|---|---|
| 部署计划（本文件） | `docs/deploy/deploy-plan.md` |
| 本地构建证据（机器可读） | `workflow/runs/deploy/run-1/local-build-result.json` |
| 部署 Loop 最终报告 | `workflow/runs/deploy/run-1/final-report.md` |
