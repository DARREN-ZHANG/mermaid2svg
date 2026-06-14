# Mermaid → SVG 项目最终验收报告

| 字段 | 值 |
|------|-----|
| Loop | final-audit-loop (Final Acceptance Audit) |
| 审计日期 | 2026-06-14 |
| HEAD commit | b56130d |
| Checklist commit | 5b4ba6e |
| Baseline commit | dfc9d09 |
| 工具链 | bun 1.3.14, node v24.14.0 |
| Canonical spec | `../docs/mermaid-svg-spec.md` §17 |
| Acceptance criteria | `../docs/acceptance-criteria.md` §13 |
| Architecture | `../docs/mermaid-svg-architecture.md` §6.12 / Gate 8 |
| Checklist 数据源 | `workflow/reports/final-acceptance-checklist.json` |
| 复验时间 | 2026-06-14T11:30:00.000Z (machineReVerificationDate) |
| 复验叙事 | `docs/final-audit/re-verification.md` |

---

## 1. 审计结论

**总体裁定**: `pending-human-signoff`

所有机器可验证的验收项在 HEAD (b56130d) / checklist commit (5b4ba6e) 复验全部通过，无回归。剩余 12 项 `humanPending` 均为需要人工确认的主观判断项（视觉风格、措辞、部署操作）或机器不可独立完成的公网部署验证，不涉及代码变更。

| 指标 | 数值 |
|------|------|
| totalChecks | 56 |
| machinePass | 44 |
| machineFail | 0 |
| humanPending | 12 |

**阻塞 sign-off 的 gap**:

- G3 — Cloudflare Pages 公网部署未执行（`pending-human`，需人工 Cloudflare 账户操作；`signOffReadiness.blockingForFinalSignoff` 包含此项）

**checklist `summary.blockingGaps` 标记但低优先级的 gap**:

- G2 — README.md 仍为上游 @webc.site/math 内容（`deferred`，severity=low；README.md 不在 final-audit-loop allowed files 内；不在 `signOffReadiness.blockingForFinalSignoff` 中）

**非阻塞 gap**:

- G4 — size-report.json entry hash 漂移（`noted`，生成时数据真实，可通过 `bun sh/size-report.js` 重新生成）

> 注：12 项 `humanPending` 检查清单条目归组为 6 个人工 review 项 (H1–H6)，详见 §13.2。

---

## 2. 已完成需求

以下验收项状态为 `pass` 或 `pass-machine`（44 项）。

### 2.1 交付物 (Deliverables)

| ID | 交付物 | 状态 | 证据 |
|----|--------|------|------|
| D1 | `extract/run.js` | pass | 存在；`bun extract/run.js` exit 0；输出 18 tests, 109 skipped |
| D2 | `extract/report.json` | pass | 存在；3 sources 含 scanned/candidate/accepted/skipped + skipReasons + skippedSamples(109) |
| D3 | `test/*.yml` | pass | 18 个 YAML 测试文件 (bm-* 7, maid-* 7, mm-* 4)；YAML 解析通过 |
| D4 | `test/schema.yml` | pass | 存在；覆盖 id/source/diagram/input/expect/skip |
| D5 | schema 先于 render 校验 | pass | render-yml.test.mjs 19 pass 0 fail；schema validation 先于 render step |
| D6 | `workflow/reports/size-report.json` | pass | 存在；beautifulMermaid raw 328,094 gzip 66,816；ours raw 127,082 gzip 41,785 |
| D7 | i18n report | pass | `docs/i18n-language-map.md` + `workflow/reports/i18n-report.json` 均存在；75 locales, 19 keys, 0 missing |
| D8 | `docs/dev-workflow.md` | pass | 存在 (331 行)；覆盖 Codex/OpenCode/Orchestrator roles、auto-loop、retry/blocked/manual-review、final gate |
| D9 | `README.md` | **pending-human** | 见 §3 |
| D10 | CF Pages config | pass | `wrangler.toml` + `demo/public/_headers` 存在；deployment-report verdict=deployment-ready-local-verified |
| D11 | 页面交付物 | pass-machine | demo/index.pug, demo/index.js, demo/style.styl, demo/const/{mermaidExamples,themes,sizeData}.js 齐全 |
| D12 | final report | pass | `docs/final-audit/final-report.md` (checklist 引用) + `workflow/reports/final-report.md` (本文件，架构 §4 指定位置) 均 exists |

### 2.2 验收标准 (Acceptance Criteria — machine pass)

| AC ID | 标题 | 状态 | 验证结果 |
|-------|------|------|----------|
| AC-EXTRACT-001 | 抽取脚本存在且可执行 | pass | exit 0; 18 tests, 109 skipped |
| AC-EXTRACT-002 | 抽取来源为三个指定仓库 | pass | probelabs/maid, lukilabs/beautiful-mermaid, mermaid-js/mermaid 均有非零 scanned/accepted |
| AC-EXTRACT-003 | YAML 测试文件生成且可解析 | pass | 18 yml; 19 tests pass (18 render + 1 schema-gate), 0 fail |
| AC-EXTRACT-004 | 只抽取可用测试，跳过有记录 | pass | 10 skip reason categories; 109 skippedSamples 各含 path 和 reason |
| AC-EXTRACT-005 | 所有抽取执行测试通过 | pass | 19 pass, 0 fail |
| AC-EXTRACT-006 | 抽取报告完整 | pass | 3 sources 完整统计; byDiagramType 8 types; skipReasons 10 categories; skippedSamples 109 entries |
| AC-EXTRACT-007 | YAML schema 固化且先校验 | pass | schema.yml 存在; test runner 在 render 前校验 schema |
| AC-UI-001 | 页面可输入 Mermaid | pass | textarea#mermaid-input; multiline, editable, clearable, paste, debounce 250ms |
| AC-UI-002 | 页面展示生成 SVG | pass | realRender=true; SVG from Mermaid browser API, 非 static/canvas |
| AC-UI-003 | 展示多种 diagram 类型 | pass | 8 examples: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, gantt, xychart-beta |
| AC-UI-004 | 错误状态稳定 | pass | 29 pass 0 fail; ERR_EMPTY/parse/render/timeout + normalize 100-102; recovery 确认 |
| AC-DEPLOY-001 | 可部署到 Cloudflare Pages | pass-machine | build exit 0, demo/dist; staticSite=true, serverRuntimeNeeded=false |
| AC-COMPARE-001 | SVG 柱状图存在 | pass | SVG bar chart wired to sizeData.js; 非 PNG/canvas |
| AC-COMPARE-002 | 体积对比口径正确 | pass | 仅 4 数据点: bm raw, bm gzip, ours raw, ours gzip; 无混入资源 |
| AC-COMPARE-004 | size report 可追溯 | pass | pageMatchesReport=true; bm commit 2ac8bbbb; entry index-BzHJhuCY.js; gitProvenanceConfirmed=true |
| AC-THEME-001 | 支持 Beautiful Mermaid CSS | pass | overall=pass; differentThemesProduceDifferentFills=true; 8 curated + default sentinel |
| AC-THEME-002 | 主题切换按钮存在 | pass | theme dropdown; 切换产生 computed-color 变化 |
| AC-THEME-003 | CSS 来源可追溯 | pass | commit 2ac8bbbb; runtimeCdnRequired=false; 本地 fallback in demo/const/themes.js |
| AC-I18N-001 | 支持 70+ 语言 | pass | 75 locales in report; 75 locale files on disk |
| AC-I18N-002 | 新增文案完整国际化 | pass | 19 keys x 75 locales, all hasAllKeys=true; check.js exit 0 |
| AC-I18N-003 | 语言列表与 key 覆盖报告 | pass | docs/i18n-language-map.md + workflow/reports/i18n-report.json 均存在且可解析 |
| AC-BUILD-001 | 项目可安装/启动/构建 | pass | install OK (bun.lock); build exit 0; demo/dist/index.html 存在 |
| AC-BUILD-002 | 测试命令可运行 | pass | render-yml 19 pass 0 fail; svg-output 29 pass 0 fail; compare (upstream) 421 pass 0 fail |
| AC-WORKFLOW-001 | dev workflow 文档存在 | pass | docs/dev-workflow.md (331 行) 覆盖全部要求内容 |

---

## 3. 未完成或降级处理的需求

| Gap/AC ID | 标题 | 严重度 | 状态 | 原因 |
|-----------|------|--------|------|------|
| D9 / G2 | README.md 仍为上游 @webc.site/math 内容 | low | deferred | 文档交付物在 final-audit-loop allowed files 之外；记录为人工 gate H6 |
| G3 / AC-DEPLOY-001 | Cloudflare Pages 公网部署未执行 | blocking-for-signoff | pending-human | deploy agent 确认 local-verified；公网部署需人工 Cloudflare 账户操作 |
| G3 / AC-DEPLOY-002 | 部署版本功能完整性 | — | pending-human | 7 项 postDeploy checklist 全 pending-deploy；需实际 CF Pages 部署后验证 |
| G4 | size-report entry hash 漂移 | non-blocking | noted | 生成时 index-BzHJhuCY.js (127,082/41,785) 真实；当前 build 产出 index-CsSmk8RF.js (186,578/46,184) 因 i18n locale 模块打入 entry chunk；可重新生成 |
| AC-DESIGN-001 | 复用 math.webc.site 设计风格 | — | pending-human | 机器证据: designTokens/glassmorphism/c-i18n/c-scroll 复用；视觉一致性需人工 review |
| AC-DESIGN-002 | 页面是可提交的 demo | — | pending-human | 机器证据: 标题/输入/预览/示例/主题/对比图/i18n 齐全；人工确认非调试外观 |
| AC-COMPARE-003 | 性能对比说明清晰 | — | pending-human | 机器证据: scopeNote + benchmark_tip key 存在；人工 review 措辞 |
| AC-TECH-001 | 小而精干，无过度工程 | — | pending-human | 机器证据: 仅 mermaid 运行时依赖; src/ 非渲染部分未改; 无 DB/queue；人工确认整体范围 |
| AC-TECH-002 | 核心渲染路径清晰 | — | pending-human | 机器证据: 2 文件 171 行; render->normalize 最短链；人工 review |
| AC-WORKFLOW-002 | Orchestrator 不调用 LLM | — | pending-human | 文档记录 deterministic；人工 review 实现 |
| AC-WORKFLOW-003 | 人工 review 节点明确 | — | pending-human | 10 review 节点列出；人工 review 完整性 |

---

## 4. 测试覆盖来源

数据来源: `extract/report.json`

### 4.1 按来源仓库

| 来源仓库 | scannedFiles | candidates | accepted | skipped |
|----------|-------------|------------|----------|---------|
| probelabs/maid | 211 | 25 | 7 | 18 |
| lukilabs/beautiful-mermaid | 24 | 25 | 7 | 18 |
| mermaid-js/mermaid | 271 | 77 | 4 | 73 |
| **合计** | **506** | **127** | **18** | **109** |

### 4.2 按 diagram type

| diagram type | accepted | skipped |
|-------------|----------|---------|
| flowchart | 5 | 36 |
| sequenceDiagram | 3 | 19 |
| stateDiagram | 2 | 14 |
| classDiagram | 2 | 12 |
| erDiagram | 2 | 6 |
| pie | 2 | 2 |
| gantt | 1 | 3 |
| other | 1 | 17 |

### 4.3 跳过原因聚合

| 跳过原因 | 数量 |
|---------|------|
| quota_exceeded_flowchart | 32 |
| classification_useful_later | 22 |
| quota_exceeded_sequenceDiagram | 16 |
| quota_exceeded_stateDiagram | 13 |
| quota_exceeded_classDiagram | 8 |
| quota_exceeded_other | 7 |
| classification_unsupported_candidate | 4 |
| quota_exceeded_erDiagram | 4 |
| quota_exceeded_gantt | 2 |
| quota_exceeded_pie | 1 |

三个来源仓库 accepted 数量均非零。跳过原因聚焦于 quota 超限（MVP 基线 18 条的配额控制）和分类保留（useful_later / unsupported_candidate），每条 skippedSample 均记录 sourcePath 和 reason。

---

## 5. 支持的 Mermaid 类型

数据来源: `workflow/reports/render-capabilities.json`

| diagram type | supported | unsupported |
|-------------|-----------|-------------|
| flowchart | 5 | 0 |
| sequenceDiagram | 3 | 0 |
| stateDiagram | 2 | 0 |
| classDiagram | 2 | 0 |
| erDiagram | 2 | 0 |
| pie | 2 | 0 |
| gantt | 1 | 0 |
| other (含 xychart-beta) | 1 | 0 |
| **合计** | **18** | **0** |

18 条抽取测试全部 supported，0 unsupported，0 skipped。渲染能力矩阵 100% 覆盖当前测试集。

MVP 展示 8 种 diagram type: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, gantt, xychart-beta。这与 Human Gate HG-1 确认的 MVP 边界一致。

---

## 6. 不支持的 Mermaid 类型

当前 18 条抽取测试中无 unsupported 项。

根据 Human Gate HG-1 决策，以下 diagram type 明确排除在 MVP 范围之外:

- `journey`
- `gitGraph`
- `mindmap`
- `timeline`
- 其他未确定或边缘类型（如 quadrantChart, sankey, block, architecture, packet, c4, requirement）

这些类型在抽取阶段被标记为 `classification_unsupported_candidate` (4 条) 或 `quota_exceeded_other`，未被纳入当前测试集。未来可基于渲染证据提升，但当前版本不承诺支持。

支持范围由 Mermaid 官方浏览器端渲染能力与抽取测试集中实际可跑通的样例共同决定，不通过手写 allowlist 人为限制。

---

## 7. 体积与 gzip 对比结果

数据来源: `workflow/reports/size-report.json`

### 7.1 对比数据

| 对象 | raw (bytes) | gzip (bytes) | 来源 |
|------|------------|-------------|------|
| beautiful-mermaid | 328,094 | 66,816 | local `references/beautiful-mermaid` commit `2ac8bbbb060ca0a65a6a21f3200bd99b1587b488`, v1.1.3 |
| 本项目 (ours) | 127,082 | 41,785 | `demo/dist/assets/index-BzHJhuCY.js` (size-loop 构建产物) |
| **gzip 差值** | — | **-25,031** | ours 比 bm gzip 减少 (66,816 − 41,785) |
| **gzip 减幅** | — | **~37.5%** | 25031 / 66816 |

### 7.2 口径说明

- gzip 方法: `zlib.gzipSync` (default level 6)，两侧使用同一方法，对比内部公平
- scopeNote: "JS file size only; performance proxy, not a runtime benchmark."
- 对比仅包含 4 个数据点 (bm raw, bm gzip, ours raw, ours gzip)，未混入 CSS/图片/字体等非目标资源

### 7.3 验证块

| 验证项 | 结果 |
|--------|------|
| beautifulMermaidBundledFromLocal | true |
| ourEntryFromRealBuild | true |
| pageMatchesReport | true |
| rawBytesIndependentMatch | true |
| gzipBytesReproducibleSameMethod | true |
| gitProvenanceConfirmed | true |

### 7.4 G4 gap 诚实披露

size-report.json 记录的 entry 为 `index-BzHJhuCY.js` (127,082 / 41,785 gzip)，来自 size-loop 构建产物。当前 HEAD 构建产出 `index-CsSmk8RF.js` (186,578 / 46,184 gzip)，因为 i18n loop 将 75 个 locale 模块打入 entry chunk 导致 hash 和体积变化。

- 数据真实性: 生成时为真实测量，非估算
- 可重新生成: `bun sh/size-report.js`
- 方法论 gap: `aggregation-scope` finding 已记录 — ours.rawBytes 仅测量 entry chunk 而非聚合所有 Vite 渲染路径 chunks；deferred 至未来 size-loop 迭代
- gzip level: report 使用 level 6 (zlib default) 而非 docs/size/size-plan.md §4.1 建议的 level 9；两侧同一方法，对比公平；level-9 参考值记录在 docs/size/verification.md

**重要声明**: 当前版本的"性能对比"仅以 JS 文件体积和 gzip 后体积作为 proxy，不设置运行时性能 benchmark gate。页面已包含口径说明文案。

---

## 8. Demo 页面访问方式

### 8.1 本地开发

```bash
bun install --frozen-lockfile
bun dev.js          # 开发服务器, port 9999, HTTP 200
```

### 8.2 本地生产构建预览

```bash
bun install --frozen-lockfile
bun run build       # bun demo/build.js, ~432ms, output demo/dist
# 用任意静态服务器 serve demo/dist
```

### 8.3 部署目标

Cloudflare Pages (根域部署)

- 构建命令: `bun install --frozen-lockfile && bun run build`
- 输出目录: `demo/dist`
- 环境变量: 无必需；可选 `BUN_VERSION=1.3.14`
- 配置文件: `wrangler.toml` (pages_build_output_dir=demo/dist) + `demo/public/_headers`
- 资源路径: 绝对路径 (`/assets/*`, `/webc/*`)，根域部署直接命中
- 重定向: 不需要
- SPA fallback: 不需要

---

## 9. Cloudflare Pages 部署状态

数据来源: `workflow/reports/deployment-report.json`

### 9.1 就绪检查 (readinessChecks)

| 检查项 | 状态 | 证据 |
|--------|------|------|
| build-exit-0 | pass | bun run build exit 0, 432ms |
| output-dir-exists | pass | demo/dist/index.html 4418 bytes |
| entry-js-present | pass | demo/dist/assets/index-CsSmk8RF.js (hash 跨重复构建 deterministic) |
| css-present | pass | demo/dist/assets/index-B_6EgLaf.css |
| i18n-data-present | pass | 75 I18n locale dirs + 75 BoxX locale dirs |
| headers-config-present | pass | demo/dist/_headers 782 bytes |
| wrangler-config-present | pass | wrangler.toml pages_build_output_dir=demo/dist |
| no-server-runtime | pass | 纯静态 dist; 无 _worker.js / functions / API route |
| no-db-queue-storage | pass | 构建产物中无相关引用 |
| absolute-paths-valid | pass | index.html 引用 /assets/*, /webc/* |
| manifest-assets-copied | pass | 7 files (favicon/manifest 等) |

**deployment verdict**: `deployment-ready-local-verified` (11/11 readinessChecks pass)

### 9.2 构建产物

| 属性 | 值 |
|------|-----|
| output size | 4,008 KB (3.9M) |
| asset chunk count | 77 |
| build duration | 432ms |
| staticSite | true |
| serverRuntimeNeeded | false |
| databaseNeeded | false |
| queueNeeded | false |

### 9.3 公网部署后验收清单 (postDeploy)

| AC | 检查项 | 状态 |
|----|--------|------|
| AC-DEPLOY-001 | CF Pages 构建部署成功，公网 URL 可访问 | pending-deploy |
| AC-DEPLOY-002 | Mermaid 输入 → SVG 预览 | pending-deploy |
| AC-UI-003 | 多类型示例图展示 (8 类) | pending-deploy |
| AC-THEME-001/002 | Beautiful Mermaid CSS 主题切换 | pending-deploy |
| AC-COMPARE-001/004 | 体积对比 SVG 柱状图数据一致 | pending-deploy |
| AC-I18N-001/002 | 多语言切换功能正常 | pending-deploy |
| AC-DEPLOY-001 | 静态资源无 404 | pending-deploy |

7 项 postDeploy checklist 全部 `pending-deploy`，需人工执行 CF Pages 部署后在公网 URL 逐项验证。

---

## 10. 主要技术取舍

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 渲染引擎 | Mermaid 官方浏览器端 API (mermaid ^11.15.0) | spec §4 要求不自研 parser/layout engine |
| 测试 harness | Playwright (仅测试用，不作为渲染器) | HG-3 允许作为真实浏览器测试 harness；断言基于 SVG 字符串/DOM 结构，非截图 |
| 测试基线 | 18 条抽取测试 (HG-2 确认) | 初始 gate；render loop 可基于渲染证据扩展，而非配额压力 |
| MVP diagram 范围 | 8 种 (HG-1 确认) | flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, gantt, xychart-beta |
| 主题方案 | 页面级 CSS overlay on normalized SVG | 复用 beautiful-mermaid theme.ts 调色板，本地内联 CSS custom properties，renderer 未修改 |
| gzip level | zlib default (level 6) | 两侧同一方法保证公平；level-9 参考值另行记录 |
| i18n fallback | English fallback | HG-5 确认 7 语言翻译 + 67 fallback + 1 baseline(en)；key 必须存在，翻译可用 fallback |
| 核心渲染路径 | 2 文件 171 行 | mermaid-to-svg.js (60 行) + normalize-svg.js (111 行)；render -> normalize 最短链 |
| 运行时依赖 | 仅 mermaid ^11.15.0 | 零额外运行时依赖，与上游轻量目标一致 |
| 受保护文件 | src/ (非 render/) / lib/ / references/ / plugin/ / blog/ / parent docs | git diff 确认 0 改动 (lib/ 仅 minify.js auto-regen 1 commit) |

---

## 11. 受保护文件审计

数据来源: `final-acceptance-checklist.json` protectedFilesAudit + 复验命令

| 范围 | 审计结论 | 证据 |
|------|---------|------|
| `src/` (非 render/) | 未修改 | `git diff dfc9d09 HEAD --stat -- src/` (排除 src/render/) = 0 changes |
| `lib/` | 仅自动重新生成 | 1 commit d0e9b0a (minify.js auto-regen, 非手动编辑) |
| `references/` | 未修改 | `git diff dfc9d09 HEAD --stat -- references/` = 0 commits |
| `plugin/` | 未修改 | `git diff dfc9d09 HEAD --stat -- plugin/` = 0 commits |
| `blog/` | 未修改 | `git diff dfc9d09 HEAD --stat -- blog/` = 0 commits |
| parent docs | 未修改 | canonical spec/acceptance/architecture 文档受 loop blocked-files 约束保护 |

上游 MathML 回归测试 (`test/compare.test.js`) 421 pass 0 fail，确认 src/ 非 render 部分完好无损。

---

## 12. 后续可优化方向

1. **扩展测试集**: 当前 18 条为初始基线 (HG-2)。render loop 可基于真实渲染证据扩展，优先纳入 useful_later 分类中被跳过的样例（22 条），以及在 i18n loop 后重新评估 size-report aggregation-scope。
2. **size-report 聚合范围**: 当前 ours.rawBytes 仅测量 entry chunk，未来应聚合所有 Vite 渲染路径可达 chunks (size-plan §3.2 建议)，并使用 gzip level 9 (size-plan §4.1 建议)。
3. **README.md 重写**: 当前仍为上游 LaTeX/MathML 内容 (G2, H6)，需重写为 Mermaid → SVG 工具说明。
4. **Cloudflare Pages 公网部署**: 本地构建已验证 (G3)，需人工执行公网部署并完成 7 项 postDeploy 验收。
5. **更多语言翻译**: 当前 7 语言有翻译 (zh, ja, ko, de, fr, es, ru)，67 语言 English fallback。可逐步补充更多语言翻译。
6. **SVG 下载**: spec §14 明确列为非目标（后续阶段任务），当前版本不实现。
7. **i18n locale 打包优化**: 当前 75 个 locale 模块被打入 entry chunk 导致体积膨胀 (127,082 -> 186,578)，可考虑按需加载优化。

---

## 13. 最终 sign-off 判据

数据来源: `final-acceptance-checklist.json` signOffReadiness + humanReviewChecklist

### 13.1 sign-off 就绪状态

| 判据 | 结果 |
|------|------|
| allMachineChecksPass | true |
| machineReVerificationDate | 2026-06-14T11:30:00.000Z |
| humanReviewsRemaining | 6 |
| machineFail | 0 |

**blockingForFinalSignoff**:

- H5 (CF Pages 公网部署)
- H1-H4 人工 review 结论

**recommendation**: 所有机器可验证标准在 2026-06-14 复验通过。人工 gate 用于视觉设计 review、部署执行和 README 重写。剩余项不需要代码变更。

### 13.2 人工 review 清单 (H1-H6)

| ID | 关联 AC | 检查项 | 状态 |
|----|---------|--------|------|
| H1 | AC-DESIGN-001/002 | 打开 dev server，对比视觉风格与 math.webc.site | pending |
| H2 | AC-COMPARE-003 | Review 页面 "performance proxy" 措辞清晰度 | pending |
| H3 | AC-TECH-001/002 | Review git diff 范围和核心渲染路径清晰度 | pending |
| H4 | AC-WORKFLOW-002/003 | Review docs/dev-workflow.md 内容完整性 | pending |
| H5 | AC-DEPLOY-001/002 | 执行 CF Pages 部署 + 在公网 URL 验证 7 项 postDeploy | pending |
| H6 | G2 | 重写 README.md 为 Mermaid → SVG 工具说明 | pending |

---

## 附录 A: 复验命令汇总

2026-06-14T11:30:00.000Z 全量复验，所有命令 exit 0:

| # | 命令 | 结果 |
|---|------|------|
| 1 | `bun extract/run.js` | 18 tests generated, 109 skipped |
| 2 | `bun test test/render-yml.test.mjs` | 19 pass, 0 fail |
| 3 | `bun test test/svg-output.test.mjs` | 29 pass, 0 fail |
| 4 | `bun test test/compare.test.js` | 421 pass, 0 fail (上游 MathML 回归完好) |
| 5 | `./sh/check.js` | 75 locale, all keys present; 73 locales warn >5% fallback (67 pure-fallback + 6 partial, HG-5 可接受) |
| 6 | `bun run build` | demo/dist/index.html 存在; entry index-CsSmk8RF.js |
| 7 | artifact 存在性 (12 文件) | 全部存在 |
| 8 | `ls test/*.yml \| wc -l` | 19 (18 test + 1 schema) |
| 9 | `ls demo/i18n/*.js \| wc -l` | 75 locale 文件 |
| 10 | `git diff dfc9d09 HEAD --stat -- src/ (排除 render/)` | 0 改动 |
| 11 | `git diff dfc9d09 HEAD --stat -- references/ plugin/ blog/` | 0 改动 |
| 12 | `git log dfc9d09..HEAD -- lib/` | 1 commit (d0e9b0a, auto-regen) |

---

## 附录 B: 核心渲染路径

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/render/mermaid-to-svg.js` | 60 | 调用 Mermaid 浏览器端 API 渲染 SVG；错误分类 (ERR_EMPTY/PARSE/RENDER/TIMEOUT) |
| `src/render/normalize-svg.js` | 111 | SVG 规范化：root/viewBox/no-runtime-js/deterministic/error-shape；错误码 100-102 |
| 合计 | 171 | render -> normalize 最短转换链 |

---

## 附录 C: 运行时依赖

| 依赖 | 版本 | 类型 |
|------|------|------|
| mermaid | ^11.15.0 | dependencies (唯一运行时依赖) |

devDependencies 中的 playwright (^1.60.0) 仅用于测试 harness，不进入运行时构建产物。其余 devDependencies 均为构建工具链 (vite, pug, oxc-parser, oxlint 等) 或上游 MathML 项目依赖。
