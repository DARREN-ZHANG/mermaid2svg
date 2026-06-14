# Mermaid 实现 Review 与改进实施文档

> **For agentic workers:** REQUIRED SUB-SKILL: 执行本文任务时，若在同一会话内并行推进独立任务，使用 `superpowers:subagent-driven-development`；若逐项执行本计划，使用 `superpowers:executing-plans`。用 checkbox 记录进度。

**Goal:** 从测试样本数、代码大小、生成速度、代码风格与优雅度四个维度，把当前 Mermaid -> SVG 实现改进到可度量、可复现、可维护的状态。
**Architecture:** 当前实现以浏览器端 Mermaid 官方 API 为核心，`renderMermaidToSvg -> normalizeSvg` 组成转换链，YAML 用例驱动 Playwright/Vite 测试。改进方向是不自研 parser/layout engine，不增加 npm 包运行时依赖，而是把抽取、体积、速度、测试入口做成稳定工程闭环。
**Tech Stack:** Bun, Vite, Playwright, Mermaid, js-yaml, Node/Bun test, Stylus, Lightning CSS。

---

## Context Summary

本次 review 基于当前工作区文件，不修改 `references/**`、`plugin/**`、`blog/**`、`lib/**`、`../docs/**`。当前工作区已有未提交改动集中在 `demo/i18n/*.js`、`demo/index.*`、`demo/style.styl`、i18n 脚本和报告文件；执行本文任务时只暂存本任务明确修改的文件。

关键证据：

- 测试抽取报告：`extract/report.json` 显示扫描 506 个参考文件，候选 127 条，最终接纳 18 条，跳过 109 条。
- 候选明细：`docs/init/test-candidates.json` 中 `minimal_core` 为 101 条，当前只执行 18 条，占 `minimal_core` 的 17.8%。
- 体积报告：`workflow/reports/size-report.json` 记录 `ours.entry = demo/dist/assets/index-BzHJhuCY.js`，但当前文件不存在；同时 beautiful-mermaid 口径来自本地源码 bundle，不满足“对方在 CDN 的 JS”这一原始需求。
- 当前 `demo/dist/assets` 实测：entry `demo/dist/assets/index-L-_2CYxA.js` raw 218,562 bytes，gzip 70,137 bytes；报告需要以页面实际加载入口和 CDN 对方 JS 为对比对象。
- 速度报告：当前仓库没有 `render-speed-report` 或等价运行时生成速度报告；`demo/i18n/*` 文案也明确标注现有 size chart 是性能代理指标，不是运行时 benchmark。
- 测试入口：`test.sh` 只执行 `bun test test/compare.test.js --only-failures`，未纳入 `test/render-yml.test.mjs` 与 `test/svg-output.test.mjs`。

当前主要风险：

1. 抽取样本少：18 条执行用例无法代表 101 条 `minimal_core` 候选，且 `mermaid-js/mermaid` 来源 77 个候选只接纳 4 条。
2. 体积口径不符合原始需求且报告过期：报告对方侧使用本地 bundle，不是 CDN JS；本项目侧记录的 entry hash 当前不存在；页面 SVG 柱状图未明确绑定“CDN beautiful-mermaid JS vs 本项目打包/gzip 后代码”的唯一口径。
3. 速度不可证：只有 10 秒超时保护，没有真实生成速度数据、分位数、最慢用例和趋势报告。
4. 风格与优雅度：测试 harness 和 schema 校验重复，demo 初始化顺序串行渲染 8 个示例，`test.sh` 与 Mermaid 测试脱节，`package.json` 仍把 `mermaid` 放在 `dependencies`。

已确认决策：

- 维持运行时零依赖。Mermaid 渲染能力只作为 demo 内部浏览器端代码存在，不作为 npm package 公开 API 暴露；`mermaid` 应从 `dependencies` 移到 `devDependencies`，渲染模块应迁出 `src/` 或通过 exports 边界避免被运行时包导出。
- 抽取测试需要扩大样本集，但不做来源文件存在性校验，不新增来源完整性 gate。
- 页面上必须有 SVG 柱状图，用于和 beautiful-mermaid 做尺寸/性能代理对比；柱状图只比较 beautiful-mermaid 在 CDN 上发布的 JS 与本项目打包并 gzip 压缩后的代码大小，不比较本地参考仓库 bundle。

## File Structure

计划创建：

- `workflow/reports/render-speed-report.json`：生成速度基准报告。
- `test/render-speed.test.mjs`：运行 18 条或扩展后的 YAML 用例，记录渲染速度。
- `test/lib/schema.js`：复用 YAML schema 校验逻辑。
- `test/lib/renderHarness.mjs`：复用 Vite + Playwright 浏览器测试 harness。

计划修改：

- `extract/run.js`：移除固定配额导致的样本截断，补充完整候选覆盖率报告。
- `extract/report.json`：由抽取脚本重新生成，包含完整覆盖率数据。
- `test/*.yml`：按 `minimal_core` 全量策略重新生成。
- `test/render-yml.test.mjs`：复用测试 helper，保持渲染能力报告。
- `test/svg-output.test.mjs`：复用测试 helper，保持 SVG 输出规则报告。
- `sh/size-report.js`：测量 beautiful-mermaid CDN JS 与本项目打包产物的 raw/gzip 体积，并校验报告引用文件存在。
- `workflow/reports/size-report.json`：由体积脚本重新生成。
- `demo/const/sizeData.js`：为页面 SVG 柱状图提供 CDN 对比体积字段。
- `demo/index.js`：优化示例渲染调度，接入速度报告入口时不改变核心转换算法。
- `test.sh`：纳入 Mermaid YAML 渲染测试、SVG 输出测试、速度报告生成。
- `package.json`：补充脚本，移动 `mermaid` 到 `devDependencies`，保持运行时零依赖。

---

## 模块 1：测试抽取覆盖

**目标：** 让测试样本从固定配额小样本变成可复现、覆盖全部 `minimal_core` 候选的执行测试集。

**依赖：** 无

**涉及文件：**

- 修改：`extract/run.js`
- 修改：`extract/report.json`
- 修改：`test/*.yml`
- 修改：`test/schema.yml`

**产出：**

- [ ] `extract/report.json` 报告 127 条候选、101 条 `minimal_core`、22 条 `useful_later`、4 条 `unsupported_candidate`。
- [ ] `test/*.yml` 覆盖所有 `classification=minimal_core` 候选。
- [ ] 每条 YAML 都保留 `source.repo`、`source.path`、`diagram.type`、`input.mermaid`、`expect`、`skip`。

### 任务 1.1：移除抽取固定配额

**所属模块：** 模块 1 - 测试抽取覆盖

**目标：** 让 `extract/run.js` 不再用 `TYPE_QUOTA` 截断 `minimal_core`，改为输出全部 `minimal_core` 候选。

**前置条件：**

- 已确认 `docs/init/test-candidates.json` 是当前候选清单。
- 不修改 `references/**`。

**涉及文件：**

- 修改：`extract/run.js:28`
- 修改：`extract/run.js:120`
- 修改：`extract/report.json`
- 修改：`test/*.yml`

**上下文：**

当前 `extract/run.js:28-38` 定义 `TYPE_QUOTA`，`extract/run.js:120-162` 按图类型配额抽样。由于 `docs/init/test-candidates.json` 里有 101 条 `minimal_core`，当前 18 条执行测试不是完整核心样本。保留 `classification_useful_later` 与 `classification_unsupported_candidate` 的报告记录，但不把它们混入执行测试。

**实现步骤：**

- [ ] **步骤 1：删除配额分支**

移除 `TYPE_QUOTA`、`roundRobinPick`，让 `selectTests` 返回：

- `accepted = candidates.filter((c) => c.classification === "minimal_core")`
- `skipped = candidates.filter((c) => c.classification !== "minimal_core").map(...)`

`accepted` 仍按稳定 ID 排序。

- [ ] **步骤 2：增强报告覆盖率**

在 `extract/report.json` 中加入：

- `summary.totalCandidates`
- `summary.minimalCore`
- `summary.acceptedMinimalCore`
- `summary.acceptedMinimalCoreRatio`
- `byClassification`

`acceptedMinimalCoreRatio` 应等于 `"101/101"`。

- [ ] **步骤 3：重新生成 YAML**

运行抽取脚本，检查 `test/*.yml` 数量等于 101。

**验证方式：**

```bash
bun extract/run.js
node -e "const fs=require('fs'); const n=fs.readdirSync('test').filter(f=>f.endsWith('.yml')&&f!=='schema.yml').length; if(n!==101) process.exit(1); console.log(n)"
```

预期结果：命令输出 `101`，`extract/report.json` 中 `accepted` 合计为 101。

**提交说明：**

```bash
git add extract/run.js extract/report.json test
git commit -m "test(extract): include all minimal core mermaid cases"
```

### 任务 1.2：固化样本数量与覆盖率门槛

**所属模块：** 模块 1 - 测试抽取覆盖

**目标：** 让抽取脚本在核心样本数量下降时失败，避免后续改动无意中缩小测试集。

**前置条件：**

- 任务 1.1 已完成。

**涉及文件：**

- 修改：`extract/run.js`
- 修改：`extract/report.json`
- 修改：`test/render-yml.test.mjs`

**上下文：**

当前候选清单有 101 条 `minimal_core`。本任务只校验数量和分类覆盖率，不校验来源文件是否存在，不新增来源完整性 gate。YAML 中仍保留 `source` 字段用于人工阅读和报告展示，但它不是自动验证条件。

**实现步骤：**

- [ ] **步骤 1：抽取脚本写入覆盖率摘要**

`extract/report.json` 增加：

- `summary.totalCandidates`
- `summary.minimalCore`
- `summary.acceptedMinimalCore`
- `summary.acceptedMinimalCoreRatio`
- `byClassification`

- [ ] **步骤 2：抽取脚本设置最小门槛**

在 `extract/run.js` 中定义模块级常量 `MIN_MINIMAL_CORE_ACCEPTED = 101`。实际 accepted 数低于该值时中止抽取，并输出当前数量和期望数量。

- [ ] **步骤 3：测试 runner 校验 YAML 数量**

`test/render-yml.test.mjs` 在读取 `test/*.yml` 后，断言执行用例数为 101。后续如果人工确认扩大样本集，先调整该常量，再重新生成报告。

**验证方式：**

```bash
bun extract/run.js
node -e "const r=JSON.parse(require('fs').readFileSync('extract/report.json','utf8')); if(r.summary.acceptedMinimalCore!==101) process.exit(1); console.log(r.summary.acceptedMinimalCoreRatio)"
```

预期结果：输出 `101/101`。

**提交说明：**

```bash
git add extract/run.js extract/report.json test
git commit -m "test(extract): enforce minimal core case count"
```

---

## 模块 2：页面 SVG 柱状图与 CDN 体积口径

**目标：** 让页面上的 SVG 柱状图满足原始需求：只比较 beautiful-mermaid 在 CDN 上发布的 JS 与本项目打包后 JS 的 raw/gzip 大小，并把这个体积对比作为性能代理指标。

**依赖：** 无

**涉及文件：**

- 修改：`sh/size-report.js`
- 修改：`workflow/reports/size-report.json`
- 修改：`demo/const/sizeData.js`

**产出：**

- [ ] `workflow/reports/size-report.json` 中 beautiful-mermaid 来源是 CDN JS URL，不是 `references/beautiful-mermaid` 本地源码 bundle。
- [ ] `workflow/reports/size-report.json` 中 ours 来源是 `bun run build` 后页面实际加载的 JS 入口或明确的本项目 JS 打包产物。
- [ ] `demo/const/sizeData.js` 与页面 SVG 柱状图只展示 beautiful-mermaid CDN JS 与本项目打包/gzip 后代码的体积对比。
- [ ] 页面文案明确“性能”是传输体积 proxy，不是运行时生成速度 benchmark。

### 任务 2.1：改为 beautiful-mermaid CDN JS 口径

**所属模块：** 模块 2 - 页面 SVG 柱状图与 CDN 体积口径

**目标：** `sh/size-report.js` 不再打包 `references/beautiful-mermaid/src/index.ts`，改为下载或读取 beautiful-mermaid CDN 发布 JS，并测量 raw/gzip 大小。

**前置条件：**

- 已运行 `bun run build` 生成 `demo/dist`。
- 需要人工确认 beautiful-mermaid 的 CDN URL 或 npm 包 dist 文件 URL；确认后把 URL 固化为脚本常量。

**涉及文件：**

- 修改：`sh/size-report.js:14`
- 修改：`sh/size-report.js:66`
- 修改：`workflow/reports/size-report.json`
- 修改：`demo/const/sizeData.js`

**上下文：**

当前 `buildBmReport` 用 `bun build references/beautiful-mermaid/src/index.ts --external elkjs --external entities` 生成本地 bundle。这个数据能复现，但不满足原始需求，因为页面需要对比的是 beautiful-mermaid 在 CDN 上给用户下载的 JS 文件。CDN URL 必须写入报告，报告中保留 `cdnUrl`、`rawBytes`、`gzipBytes`、`contentSha256`。

**实现步骤：**

- [ ] **步骤 1：固化 CDN 输入**

在 `sh/size-report.js` 中定义 `BM_CDN_URL`。该 URL 指向 beautiful-mermaid 发布给浏览器使用的 JS 文件，不指向 GitHub 源码文件，不指向本地 `references/**`。

- [ ] **步骤 2：下载并缓存 CDN JS**

新增 `fetchBmCdn()`，使用 Bun/Node 标准 fetch 获取 `BM_CDN_URL` 内容，写入 `workflow/reports/beautiful-mermaid-cdn.js`。该缓存文件用于报告复现和离线人工核查。

- [ ] **步骤 3：测量 raw/gzip/hash**

复用 `measureFile` 计算 raw/gzip，新增 sha256。`beautifulMermaid` 报告结构为：

```js
{
  source: {
    kind: "cdn",
    url: BM_CDN_URL,
  },
  rawBytes,
  gzipBytes,
  contentSha256,
}
```

- [ ] **步骤 4：删除本地 bundle 对比口径**

移除 `bundleBm()` 和 `references/beautiful-mermaid` 的构建逻辑。报告中不得再把本地 reference bundle 当作页面对比数据。

**验证方式：**

```bash
bun run build
bun sh/size-report.js
node -e "const r=JSON.parse(require('fs').readFileSync('workflow/reports/size-report.json','utf8')); if(r.beautifulMermaid.source.kind!=='cdn') process.exit(1); console.log(r.beautifulMermaid.source.url)"
```

预期结果：输出 beautiful-mermaid CDN JS URL。

**提交说明：**

```bash
git add sh/size-report.js workflow/reports/size-report.json demo/const/sizeData.js
git commit -m "build(size): measure beautiful mermaid cdn js"
```

### 任务 2.2：测量本项目打包/gzip 后代码并驱动 SVG 柱状图

**所属模块：** 模块 2 - 页面 SVG 柱状图与 CDN 体积口径

**目标：** 本项目侧只使用 `bun run build` 后页面实际加载的 JS 产物，生成 `demo/const/sizeData.js`，驱动页面 SVG 柱状图。

**前置条件：**

- 任务 2.1 已完成。

**涉及文件：**

- 修改：`sh/size-report.js`
- 修改：`workflow/reports/size-report.json`
- 修改：`demo/const/sizeData.js`
- 修改：`demo/webc/js/sizeChart.js`
- 修改：`demo/index.pug`
- 修改：`demo/i18n/*.js`

**上下文：**

原始需求是“页面上要有和 beautiful-mermaid 的尺寸和性能对比的 SVG 柱状图”。这里的性能对比只用 JS 传输体积作为 proxy：raw bytes 与 gzip bytes。不要把运行时渲染速度混进这个柱状图；运行时生成速度由模块 3 的 `render-speed-report.json` 单独负责。

**实现步骤：**

- [ ] **步骤 1：解析页面实际 JS 入口**

保留 `parseEntry(DEMO_DIST + "/index.html")`，测量该入口 JS 的 raw/gzip/hash。脚本必须检查入口文件存在；不存在时中止，不写旧数据。

- [ ] **步骤 2：生成页面数据**

`demo/const/sizeData.js` 只包含两组数据：

- `beautifulMermaid`: label、cdnUrl、rawBytes、gzipBytes。
- `ours`: label、entry、rawBytes、gzipBytes。

不加入 Mermaid 动态 chunk 列表，不加入本地 reference bundle。

- [ ] **步骤 3：确认 SVG 柱状图只读 sizeData**

`demo/webc/js/sizeChart.js` 继续输出 SVG；柱状图只画 beautiful-mermaid 与 ours 两组 raw/gzip bars。页面 `demo/index.pug` 保留该 SVG 容器，不改为 canvas/png。

- [ ] **步骤 4：报告写入复现命令**

`verification.commands` 写入：

- `bun run build`
- `bun sh/size-report.js`
- `node -e ...` CDN 口径与 entry 文件存在性校验命令

同时记录 `verification.pageChartUsesReport = true`，并校验 `demo/const/sizeData.js` 与 `workflow/reports/size-report.json` 的四个体积数字一致。

**验证方式：**

```bash
bun run build
bun sh/size-report.js
node -e "const fs=require('fs'); const r=JSON.parse(fs.readFileSync('workflow/reports/size-report.json','utf8')); if(!fs.existsSync(r.ours.entry)) process.exit(1); if(!r.verification.pageChartUsesReport) process.exit(1); console.log(r.ours.gzipBytes)"
```

预期结果：输出本项目打包后 JS 的 gzip bytes。

**提交说明：**

```bash
git add sh/size-report.js workflow/reports/size-report.json demo/const/sizeData.js demo/webc/js/sizeChart.js demo/index.pug demo/i18n
git commit -m "build(size): drive cdn comparison svg chart"
```

---

## 模块 3：生成速度基准

**目标：** 建立浏览器端 Mermaid -> SVG 生成速度报告，记录渲染、归一化和总耗时。

**依赖：** 模块 1

**涉及文件：**

- 创建：`test/render-speed.test.mjs`
- 创建：`workflow/reports/render-speed-report.json`
- 修改：`package.json`
- 修改：`test.sh`

**产出：**

- [ ] `workflow/reports/render-speed-report.json` 包含每条 YAML 用例的 `renderMs`、`normalizeMs`、`totalMs`。
- [ ] 报告包含 `summary.avgMs`、`summary.p50Ms`、`summary.p95Ms`、`summary.maxMs`、`slowest`。
- [ ] `test.sh` 能在常规测试中生成速度报告。

### 任务 3.1：新增速度测试 runner

**所属模块：** 模块 3 - 生成速度基准

**目标：** 用同一浏览器页面测量 YAML 用例的渲染速度，不把 Vite 启动时间计入每条用例。

**前置条件：**

- 任务 1.1 已完成，YAML 执行测试数量为 101。

**涉及文件：**

- 创建：`test/render-speed.test.mjs`
- 创建：`workflow/reports/render-speed-report.json`

**上下文：**

当前 `test/render-yml.test.mjs` 已经能启动 Vite middleware 和 Playwright，并在页面里导入 `src/render/mermaid-to-svg.js`。速度测试应复用这个架构：先启动一次浏览器页面，导入模块，再逐条执行。报告只记录用例内耗时，不把服务器启动、模块加载、浏览器启动计入单条生成速度。

**实现步骤：**

- [ ] **步骤 1：读取 YAML 用例**

从 `test/*.yml` 读取全部非 skipped 用例，保持文件名排序。

- [ ] **步骤 2：页面内计时**

在 `page.evaluate` 内用 `performance.now()` 分别测量：

- `renderMermaidToSvg(text)` 耗时。
- `normalizeSvg(rawSvg)` 耗时。
- 两者相加的 `totalMs`。

- [ ] **步骤 3：写入报告**

生成 `workflow/reports/render-speed-report.json`：

```json
{
  "generatedAt": "...",
  "caseCount": 101,
  "environment": {
    "browser": "chromium",
    "tool": "playwright"
  },
  "summary": {
    "avgMs": 0,
    "p50Ms": 0,
    "p95Ms": 0,
    "maxMs": 0
  },
  "slowest": [],
  "cases": []
}
```

`cases` 中每条记录包括 `id`、`diagramType`、`source`、`renderMs`、`normalizeMs`、`totalMs`、`code`。

**验证方式：**

```bash
bun test test/render-speed.test.mjs
node -e "const r=JSON.parse(require('fs').readFileSync('workflow/reports/render-speed-report.json','utf8')); if(!r.caseCount||!r.summary.p95Ms) process.exit(1); console.log(r.caseCount)"
```

预期结果：输出速度报告中的用例数量。

**提交说明：**

```bash
git add test/render-speed.test.mjs workflow/reports/render-speed-report.json
git commit -m "test(speed): add mermaid render speed report"
```

### 任务 3.2：把速度报告纳入常规测试入口

**所属模块：** 模块 3 - 生成速度基准

**目标：** `test.sh` 运行后一定覆盖 Mermaid 渲染、SVG 输出和速度报告。

**前置条件：**

- 任务 3.1 已完成。

**涉及文件：**

- 修改：`test.sh:8`
- 修改：`package.json:34`

**上下文：**

当前 `test.sh` 只执行上游 MathML compare 测试，未执行 Mermaid YAML 测试。`package.json` 只有 `"test": "bash test.sh"`，可以增加精确脚本以便单独运行。

**实现步骤：**

- [ ] **步骤 1：扩展 package scripts**

增加：

```json
"test:render": "bun test test/render-yml.test.mjs",
"test:svg": "bun test test/svg-output.test.mjs",
"test:speed": "bun test test/render-speed.test.mjs"
```

- [ ] **步骤 2：扩展 test.sh**

在 `bun x oxlint` 后依次运行：

```bash
bun test test/render-yml.test.mjs
bun test test/svg-output.test.mjs
bun test test/render-speed.test.mjs
bun test test/compare.test.js --only-failures
```

- [ ] **步骤 3：记录执行时间**

不设置速度 pass/fail 阈值。首次报告只作为 baseline，阈值由人工确认后再加。

**验证方式：**

```bash
./test.sh
```

预期结果：`render-yml`、`svg-output`、`render-speed`、`compare` 全部通过，并生成三份 report。

**提交说明：**

```bash
git add test.sh package.json workflow/reports/render-speed-report.json workflow/reports/render-capabilities.json workflow/reports/svg-output-compatibility.json
git commit -m "test: include mermaid render checks in main suite"
```

---

## 模块 4：代码风格与优雅度

**目标：** 降低重复代码，收紧模块边界，让 demo 与测试代码更符合项目 JS 规范。

**依赖：** 模块 1、模块 3

**涉及文件：**

- 创建：`test/lib/schema.js`
- 创建：`test/lib/renderHarness.mjs`
- 修改：`test/render-yml.test.mjs`
- 修改：`test/svg-output.test.mjs`
- 修改：`test/render-speed.test.mjs`
- 修改：`demo/index.js`
- 修改：`package.json`

**产出：**

- [ ] schema 校验逻辑只保留一份。
- [ ] Vite + Playwright harness 只保留一份。
- [ ] demo 初始化不串行阻塞 8 个示例渲染。
- [ ] `mermaid` 依赖位置与最终模块边界一致。

### 任务 4.1：抽出测试 helper

**所属模块：** 模块 4 - 代码风格与优雅度

**目标：** 消除 `test/render-yml.test.mjs` 与 `test/svg-output.test.mjs` 中重复的 YAML 读取、schema 校验和浏览器 harness。

**前置条件：**

- 任务 3.1 已完成。

**涉及文件：**

- 创建：`test/lib/schema.js`
- 创建：`test/lib/renderHarness.mjs`
- 修改：`test/render-yml.test.mjs`
- 修改：`test/svg-output.test.mjs`
- 修改：`test/render-speed.test.mjs`

**上下文：**

`test/render-yml.test.mjs:22-62` 和 `test/svg-output.test.mjs` 中存在重复的 schema 读取、`checkType`、`validateObj`、YAML 枚举逻辑。两个文件还重复创建 Vite middleware 和 Playwright 页面。抽出 helper 后，测试文件只保留各自断言规则。

**实现步骤：**

- [ ] **步骤 1：创建 schema helper**

`test/lib/schema.js` 导出：

```js
export const cases = () => [...]
export const validate = (obj, schema, prefix) => [...]
export const assertValidCases = (cases) => [...]
```

函数命名保持 camelCase，变量使用 snake_case。

- [ ] **步骤 2：创建 render harness**

`test/lib/renderHarness.mjs` 导出：

```js
export const openHarness = async (modulePaths) => [browser, page, close];
```

`modulePaths` 是数组，页面内按数组顺序导入模块，并挂到 `window.__mods`。

- [ ] **步骤 3：改造三个测试文件**

三个测试文件改为导入 helper。删除重复 schema 校验函数和重复 server 初始化代码。

**验证方式：**

```bash
bun test test/render-yml.test.mjs
bun test test/svg-output.test.mjs
bun test test/render-speed.test.mjs
```

预期结果：三个命令全部通过。

**提交说明：**

```bash
git add test/lib/schema.js test/lib/renderHarness.mjs test/render-yml.test.mjs test/svg-output.test.mjs test/render-speed.test.mjs
git commit -m "test: share mermaid browser harness"
```

### 任务 4.2：优化 demo 示例渲染调度

**所属模块：** 模块 4 - 代码风格与优雅度

**目标：** 初始化页面时不串行等待 8 个示例全部渲染完成后再设置默认输入。

**前置条件：**

- 模块 3 已建立速度报告，能对比改造前后首屏生成速度。

**涉及文件：**

- 修改：`demo/index.js:286`

**上下文：**

当前 `demo/index.js:289-295` 在 `for...of` 中 `await renderToSvg(src)`，8 个示例串行渲染。随后 `demo/index.js:298-300` 才设置第一个示例并渲染编辑器预览。这会让首屏主预览被示例图库阻塞。

**实现步骤：**

- [ ] **步骤 1：先渲染主预览**

构建示例卡片后，立即设置 `input.value = MERMAID_EXAMPLES[0][2]`，执行 `await renderInput()` 和 `adjustHeight()`。

- [ ] **步骤 2：并发渲染示例缩略图**

把每个示例缩略图渲染任务收集到数组：

```js
const jobs = MERMAID_EXAMPLES.map(...)
await Promise.all(jobs)
```

每个任务只更新自己的 `svg_box`，不修改全局 `current_svg`。

- [ ] **步骤 3：防止旧输入结果覆盖新输入**

给 `renderInput` 增加模块级递增序号 `render_seq`。每次调用记录当前序号，异步返回后只在序号仍匹配时更新 DOM。该序号是并发一致性控制，不改变渲染算法。

**验证方式：**

```bash
bun run build
bun test test/render-speed.test.mjs
```

预期结果：构建通过，速度报告生成；页面主预览仍显示第一个 Mermaid 示例 SVG。

**提交说明：**

```bash
git add demo/index.js workflow/reports/render-speed-report.json
git commit -m "perf(demo): render primary preview before examples"
```

### 任务 4.3：迁移渲染模块以维持运行时零依赖

**所属模块：** 模块 4 - 代码风格与优雅度

**目标：** 将 Mermaid 渲染能力收敛为 demo 内部代码，把 `mermaid` 移到 `devDependencies`，保持 npm package 运行时零依赖。

**前置条件：**

- 已确认项目必须维持运行时零依赖。

**涉及文件：**

- 修改：`package.json:51`
- 修改：`demo/index.js`
- 修改：`test/render-yml.test.mjs`
- 修改：`test/svg-output.test.mjs`
- 修改：`test/render-speed.test.mjs`
- 移动：`src/render/mermaid-to-svg.js`
- 移动：`src/render/normalize-svg.js`
- 创建：`demo/render/mermaid-to-svg.js`
- 创建：`demo/render/normalize-svg.js`

**上下文：**

项目目标已确认：运行时依赖为零。当前 `package.json:51-53` 把 `mermaid` 放在 `dependencies`，同时 `package.json:32` 的 `"./*": "./src/*"` 会暴露 `src/render/*`。这会让 npm package 的公开导出面包含 Mermaid 渲染代码，并使 `mermaid` 成为运行时依赖。正确边界是：Mermaid 渲染模块只服务 demo 和测试，迁到 `demo/render/`；npm package 继续只暴露上游 MathML 库；`mermaid` 移到 `devDependencies`。

**实现步骤：**

- [ ] **步骤 1：移动渲染文件**

把：

- `src/render/mermaid-to-svg.js` -> `demo/render/mermaid-to-svg.js`
- `src/render/normalize-svg.js` -> `demo/render/normalize-svg.js`

迁移后删除 `src/render/` 空目录或确保其中无 Mermaid 代码。

- [ ] **步骤 2：调整 imports**

修改：

- `demo/index.js`
- `test/render-yml.test.mjs`
- `test/svg-output.test.mjs`
- `test/render-speed.test.mjs`

所有 import 路径指向 `/demo/render/...` 或对应相对路径。

- [ ] **步骤 3：移动依赖**

在 `package.json` 中把 `mermaid` 从 `dependencies` 移到 `devDependencies`。如果 `dependencies` 变为空对象，删除空对象。运行 `bun install` 同步 `bun.lock`。

- [ ] **步骤 4：验证公开导出面**

确认 `package.json` exports 不再导出 Mermaid 渲染模块。运行：

```bash
node -e "const p=require('./package.json'); if(p.dependencies&&p.dependencies.mermaid) process.exit(1); console.log('runtime-zero')"
```

**验证方式：**

```bash
bun install
./test.sh
```

预期结果：依赖锁文件同步，完整测试通过，命令输出 `runtime-zero`。

**提交说明：**

```bash
git add package.json bun.lock demo/index.js test src/render demo/render
git commit -m "refactor(render): keep mermaid demo-only"
```

---

## 执行顺序

### 依赖关系

| 任务                                            | blockedBy | 说明                              |
| ----------------------------------------------- | --------- | --------------------------------- |
| 1.1 移除抽取固定配额                            | -         | 可立即启动                        |
| 1.2 固化样本数量与覆盖率门槛                    | 1.1       | 依赖 101 条 accepted 的生成结果   |
| 2.1 改为 beautiful-mermaid CDN JS 口径          | -         | 需要确认 CDN JS URL 后启动        |
| 2.2 测量本项目打包/gzip 后代码并驱动 SVG 柱状图 | 2.1       | 依赖 CDN 口径和新报告结构         |
| 3.1 新增速度测试 runner                         | 1.1       | 用例数量和文件集合由抽取结果决定  |
| 3.2 把速度报告纳入常规测试入口                  | 3.1       | 依赖 `test/render-speed.test.mjs` |
| 4.1 抽出测试 helper                             | 3.1       | 三个测试文件都存在后统一抽取      |
| 4.2 优化 demo 示例渲染调度                      | 3.1       | 需要速度报告对比前后结果          |
| 4.3 迁移渲染模块以维持运行时零依赖              | -         | 已确认运行时零依赖，可立即启动    |

### 执行阶段

**Phase 1（可并行）：**

- 任务 1.1：移除抽取固定配额
- 任务 2.1：改为 beautiful-mermaid CDN JS 口径
- 任务 4.3：迁移渲染模块以维持运行时零依赖

**Phase 2（依赖 Phase 1）：**

- 任务 1.2：固化样本数量与覆盖率门槛
- 任务 2.2：测量本项目打包/gzip 后代码并驱动 SVG 柱状图
- 任务 3.1：新增速度测试 runner

**Phase 3（依赖 Phase 2）：**

- 任务 3.2：把速度报告纳入常规测试入口
- 任务 4.1：抽出测试 helper
- 任务 4.2：优化 demo 示例渲染调度

### 关键路径

`1.1 -> 3.1 -> 3.2 -> 4.1 -> ./test.sh`

这条路径决定测试闭环完成时间。体积模块和运行时零依赖边界改造可与测试抽取并行推进。

---

## Acceptance Criteria

- `bun extract/run.js` 生成 101 条 `minimal_core` YAML 执行测试。
- `extract/report.json` 同时记录 `byClassification`、各来源仓库 accepted/skipped，不新增来源文件存在性 gate。
- `bun test test/render-yml.test.mjs` 全部通过，并生成 `workflow/reports/render-capabilities.json`。
- `bun test test/svg-output.test.mjs` 全部通过，并生成 `workflow/reports/svg-output-compatibility.json`。
- `bun test test/render-speed.test.mjs` 全部通过，并生成 `workflow/reports/render-speed-report.json`。
- `bun run build && bun sh/size-report.js` 后，`workflow/reports/size-report.json` 中 beautiful-mermaid 来源为 CDN JS URL，本项目 entry 文件存在，`demo/const/sizeData.js` 与报告四个体积数字一致。
- 页面 SVG 柱状图只展示 beautiful-mermaid CDN JS 与本项目打包/gzip 后代码的 raw/gzip 体积对比，并把性能表述限定为传输体积 proxy。
- `test.sh` 覆盖 i18n check、format check、minify、lint、Mermaid render、SVG output、speed report、MathML compare。
- `test/render-yml.test.mjs`、`test/svg-output.test.mjs`、`test/render-speed.test.mjs` 不再复制 schema 校验与 Vite/Playwright harness。
- `demo/index.js` 首先渲染主预览，再渲染示例缩略图；用户输入的较新渲染结果不会被较旧异步结果覆盖。
- `package.json` 中 `dependencies` 不包含 `mermaid`，Mermaid 渲染模块不从 npm package exports 暴露。

## Review Findings By Dimension

### 1. 抽取测试样本数

- 当前执行测试只有 18 条，来源分布为 `bm=7`、`maid=7`、`mm=4`。
- `docs/init/test-candidates.json` 中 `minimal_core=101`，当前执行覆盖率为 17.8%。
- `mermaid-js/mermaid` 是最大来源，候选 77 条，当前只接纳 4 条。
- 固定 `TYPE_QUOTA` 是主要瓶颈，导致 `quota_exceeded_*` 成为主要跳过原因。

结论：样本数不足以支撑 Mermaid MVP 的可信回归测试。应把全部 `minimal_core` 纳入执行测试，并用数量门槛防止测试集回退；不新增来源文件存在性校验。

### 2. 代码大小

- 当前报告记录 `demo/dist/assets/index-BzHJhuCY.js`，该文件在当前 `demo/dist` 中不存在。
- 当前 entry chunk 为 `demo/dist/assets/index-L-_2CYxA.js`，raw 218,562 bytes，gzip 70,137 bytes。
- `beautiful-mermaid` 对比值来自 `references/beautiful-mermaid` 本地源码 bundle，不是 CDN JS，不满足原始需求。
- 页面需要 SVG 柱状图展示 beautiful-mermaid CDN JS 与本项目打包/gzip 后代码的 raw/gzip 大小；性能对比只作为传输体积 proxy。

结论：体积数据需要改成 CDN JS 对比口径，并把页面 SVG 柱状图、报告、`demo/const/sizeData.js` 绑定到同一组 raw/gzip 数字。

### 3. 生成速度

- 当前没有速度报告。
- `renderMermaidToSvg` 有 10 秒超时保护，但超时不是速度 benchmark。
- demo 初始化时串行渲染 8 个示例，再渲染主输入预览，首屏路径有可优化空间。
- 输入防抖为 250ms，但没有异步序号控制，较旧的渲染结果存在覆盖较新输入的风险。

结论：先建立无阈值速度 baseline，再用 baseline 指导 demo 调度优化。不要把体积 proxy 当成生成速度结论。

### 4. 代码风格与优雅度

- 测试代码重复：schema 校验和 Vite/Playwright harness 至少在两个测试文件中复制。
- `test.sh` 与 Mermaid 测试脱节，常规测试不能证明 Mermaid 功能仍可用。
- `package.json` 仍是上游 Math 包 metadata，且 `mermaid` 在 `dependencies`，与运行时零依赖目标冲突。
- `src/render` 当前会被 `"./*": "./src/*"` 间接暴露，应迁到 `demo/render/` 并让 Mermaid 只作为 demo/dev 依赖存在。

结论：优先清理测试重复和测试入口，同时执行 demo-only 渲染模块迁移，确保 npm package 运行时零依赖。
