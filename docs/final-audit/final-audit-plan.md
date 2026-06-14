# Final Acceptance Audit Plan

- **Loop**: final-audit-loop
- **Phase**: plan
- **Plan author**: final-audit agent (init executor)
- **Created**: 2026-06-14
- **Canonical references**: `../docs/mermaid-svg-spec.md` §17 (完成定义), `../docs/acceptance-criteria.md` §13 (最终完成定义), `../docs/mermaid-svg-architecture.md` §6.12 / Gate 8
- **Allowed outputs of this loop**: `docs/final-audit/**`, `workflow/runs/final-audit/**`, `workflow/reports/final-report.md`
- **Scope discipline**: 审计现有 artifact，不新增功能实现。本计划定义“如何验收”，`workflow/reports/final-report.md` 将记录“验收结论”。

---

## 1. 审计目标

对照 canonical spec 与 acceptance criteria，对前 8 个 loop（init → render → svg-output → web-demo → theme → size → i18n → deploy）的产物进行一次性、机器可读 + 人工 review 复核的验收，产出最终 gate 结论。

验收必须回答三个问题：

1. **交付物是否齐全**（spec §16 / AC §13 的 deliverable 清单）。
2. **每条 AC-* 是否满足**（机器证据优先，无法自动化的项标注为 human review）。
3. **是否存在需要人工 sign-off 或阻塞项**（blocked task / gap / 方法论偏差）。

审计原则与 architecture §6.12 一致：决策只依据规约、exit code、测试报告、build 报告、size 报告、deployment 状态和 acceptance checklist，不依据自然语言主观判断。

---

## 2. 审计方法学

每条检查项标注两种性质：

- **M (machine)**：可由脚本/命令产生确定性结果（exit code、JSON 字段、文件存在性、字节计数）。主控可直接判定 pass/fail。
- **H (human)**：需要人工 review 才能判断（视觉一致性、文档完整性、部署后公网行为）。主控记录为 `pending-human`，不自动放行。

判定规则：

- 一条 AC 下所有 M 项 pass 且 H 项已记录 review 结论 → 该 AC pass。
- 任一 M 项 fail → 该 AC fail，审计暂停并回到对应 loop 修复（除非该项被显式标注为 deferred / non-blocking 并记录原因）。
- H 项未完成 review → AC 标记 `pending-human`，不阻塞其它 AC，但阻塞最终 sign-off。

复跑要求：所有 M 项命令必须可在 clean checkout 上重复执行并得到一致结论（确定性优先，时间戳/哈希等已知波动字段允许差异）。

---

## 3. 交付物清单审计（spec §16 / AC §13）

按 spec §16 与 AC §13 列出的最终交付物逐项核对。下表记录**当前**审计时刻的探查结论（基于 preflight.files.txt 与各 loop report），执行阶段需逐项复验。

| # | 交付物 | 性质 | 当前状态 | 备注 |
|---|--------|------|----------|------|
| D1 | `extract/run.js` | M | ✅ 存在 | 可被 `bun extract/run.js` 执行 |
| D2 | `extract/report.json` | M | ✅ 存在 | 三来源均有 scanned/candidate/accepted/skipped + skipReasons + skippedSamples |
| D3 | `test/*.yml` | M | ✅ 18 个 | bm-* / maid-* / mm-* 前缀 |
| D4 | `test/schema.yml` | M | ✅ 存在 | 覆盖 id/source/diagram/input/expect/skip |
| D5 | schema 先校验再渲染 | M | 待复验 | render-yml.test.mjs 内置 schema 校验步骤，执行阶段确认 fail-fast |
| D6 | `workflow/reports/size-report.json` | M | ✅ 存在 | 含 beautifulMermaid + ours raw/gzip + verification |
| D7 | `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json` | M | ✅ 两者皆有 | i18n-report.json 75 locale / 19 key |
| D8 | `docs/dev-workflow.md` | M | ❌ **缺失** | **GAP**：AC-WORKFLOW-001 要求，当前 repo 未找到 |
| D9 | `README.md`（反映 Mermaid→SVG） | H | ❌ **未更新** | **GAP**：仍为上游 @webc.site/math 内容 |
| D10 | Cloudflare Pages 部署配置/说明 | M+H | ⚠️ 配置就绪，未实部署 | wrangler.toml + demo/public/_headers 存在；deployment-report verdict=local-verified |
| D11 | 页面交付（输入/预览/示例/主题/对比图/i18n） | M+H | ✅ 各 loop report pass | 复验在 §5 |
| D12 | `workflow/reports/final-report.md` | M | ❌ 尚未生成 | **本 loop 产出**，非计划阶段产物 |

**审计前置结论**：D8（dev-workflow.md）、D9（README）、D12（final-report.md）是当前明确缺口。其中 D8/D9 属于文档交付物，需在本 loop 或紧邻的人工 gate 补齐；D12 是本 loop execution 阶段的产物。

---

## 4. Spec §17 完成定义逐条审计

| Spec §17 条款 | 对应 AC | 性质 | 当前证据来源 | 状态 |
|---|---|---|---|---|
| extract/run.js 存在且可执行 | AC-EXTRACT-001 | M | `extract/run.js` | ✅ |
| 从三个仓库抽取可用测试 | AC-EXTRACT-002/003 | M | `extract/report.json` sources | ✅ |
| test/*.yml 成功生成 | AC-EXTRACT-003 | M | 18 个 yml | ✅ |
| schema 存在且先校验 | AC-EXTRACT-007 | M | `test/schema.yml` + render-yml.test.mjs | ✅（执行阶段复验 fail-fast） |
| extract/report.json 统计完整 | AC-EXTRACT-006 | M | report.json | ✅ |
| 所有执行抽取测试跑通 | AC-EXTRACT-005 | M | render-capabilities.json 18/18 | ✅（执行阶段复跑） |
| 页面可输入 Mermaid 查看图 | AC-UI-001/002 | M+H | web-demo-report.json | ✅ |
| 页面展示多类型示例 | AC-UI-003 | M+H | 8 种 diagram | ✅ |
| 复用 math.webc.site 风格 | AC-DESIGN-001 | H | designTokens/glassmorphism 证据 | ⚠️ 待人工 review |
| 页面含 SVG 柱状对比图 | AC-COMPARE-001 | M+H | size-report.json + demo sizeChart | ✅ |
| 对比口径正确且与 report 一致 | AC-COMPARE-002/004 | M | size-report.json verification.pageMatchesReport | ✅（执行阶段交叉校验） |
| 支持 beautiful-mermaid CSS 主题切换 | AC-THEME-001/002 | M+H | theme-css-report.json overall=pass | ✅ |
| CSS 来源可追溯 | AC-THEME-003 | M | theme-css-report.json cssSource.commit | ✅ |
| 七十多种语言国际化 + report | AC-I18N-001/003 | M | i18n-report.json 75 locale | ✅ |
| 新增文案完整国际化 | AC-I18N-002 | M+H | 19 key × 75 locale allKeysPresent | ✅ |
| 可部署 Cloudflare Pages | AC-DEPLOY-001 | M+H | deployment-report.json verdict=local-verified | ⚠️ **未实部署**，postDeploy checklist 全 pending-deploy |
| 部署后核心功能可用 | AC-DEPLOY-002 | H | 需公网 URL | ❌ 待人工部署 |
| docs/dev-workflow.md 存在 | AC-WORKFLOW-001/002/003 | M | — | ❌ **缺失** |
| 实现小而精，无过度工程 | AC-TECH-001/002 | H | 改动范围 review | ⚠️ 待人工 review |

---

## 5. Acceptance Criteria 逐条检查矩阵

下表是 execution 阶段的执行清单。每行：AC 编号 → 检查项 → 验证方法（命令/证据）→ 性质 → 预期通过判据。

### 5.1 测试抽取（AC-EXTRACT-001 … 007）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| EXTRACT-001 | 抽取脚本存在可执行 | `test -f extract/run.js && bun extract/run.js` exit 0 | M | 文件存在 + 可重复执行 |
| EXTRACT-002 | 来源为三个指定仓库 | report.json `sources` 含 maid/beautiful-mermaid/mermaid-js | M | 三 key 均在 |
| EXTRACT-003 | 生成 test/*.yml 可解析 | 遍历 test/*.yml（排除 case/）YAML parse 成功 | M | ≥18 文件 |
| EXTRACT-004 | 仅抽取可用测试 | report.json skipReasons 非空 + skippedSamples 有路径/原因 | M | 跳过有记录 |
| EXTRACT-005 | 所有执行测试跑通 | `bun test test/render-yml.test.mjs` | M | pass==accepted count, fail==0 |
| EXTRACT-006 | 抽取报告完整 | report.json 每来源 scanned/candidate/accepted/skipped + byDiagramType + skipReasons | M | 字段齐全 |
| EXTRACT-007 | schema 固化且先校验 | render-yml.test.mjs 先 schema 校验再渲染；构造缺字段 yml 应在 schema 阶段失败 | M | fail-fast 成立 |

### 5.2 页面功能（AC-UI-001 … 004）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| UI-001 | 可输入 Mermaid | web-demo-report.json input.status=pass + 人工 dev server 验证 | M+H | textarea 存在可编辑 |
| UI-002 | 可查看 SVG | web-demo-report.json svgPreview realRender=true | M | 真实 Mermaid 渲染非静态 |
| UI-003 | 多类型示例 | web-demo-report.json exampleCount=8 / diagramTypes 8 种 | M | 8 类 |
| UI-004 | 错误状态稳定 | svg-output.test.mjs syntheticRules 全 pass + web-demo errorStates | M | ERR_EMPTY/parse/timeout + recovery |

### 5.3 设计风格（AC-DESIGN-001/002）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| DESIGN-001 | 复用 math.webc.site 风格 | 对照 demo/style.styl designTokens + web-demo-report designReuse | H | 人工 review 一致性 |
| DESIGN-002 | 可提交 demo | 人工打开页面 review 布局/标题/说明 | H | 非调试页 |

### 5.4 部署（AC-DEPLOY-001/002）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| DEPLOY-001 | 可部署 CF Pages | `rm -rf demo/dist && bun run build` exit 0 + wrangler.toml pages_build_output_dir | M | 本地构建可复现 |
| DEPLOY-001 | 公网可访问 | 实际触发 CF Pages 部署，访问 production URL | H | **当前阻塞项**：未实部署 |
| DEPLOY-002 | 部署版功能完整 | 公网逐项测输入/示例/主题/对比图/i18n | H | postDeployAcceptanceChecklist 全 pass |

### 5.5 对比图（AC-COMPARE-001 … 004）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| COMPARE-001 | SVG 柱状图存在 | DOM 含 `#size-chart` 内 `<svg>`；非 png/canvas | M+H | SVG 元素存在 |
| COMPARE-002 | 体积口径正确 | size-report.json 仅比较 4 项（bm raw/gzip + ours raw/gzip） | M | 无混入资源 |
| COMPARE-003 | 性能表述清晰 | 页面说明 size 为 proxy、无 runtime benchmark 声明 | H | 人工 review |
| COMPARE-004 | report 可追溯 | size-report.json verification.pageMatchesReport=true + CDN url/commit + entry 路径 | M | 页面数据==report |

### 5.6 主题（AC-THEME-001/002/003）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| THEME-001 | 支持 BM CSS | theme-css-report overall=pass + 切换后 computed-color 变化 | M | differentThemesProduceDifferentFills |
| THEME-002 | 主题切换按钮 | theme-css-report paletteSwitchProbe + 人工点击 | M+H | 切换可见生效 |
| THEME-003 | CSS 来源可追溯 | theme-css-report cssSource.commit + cdnIndependence.runtimeCdnRequired=false | M | 默认主题无 CDN 依赖 |

### 5.7 国际化（AC-I18N-001/002/003）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| I18N-001 | 七十多种语言 | i18n-report totalLocales=75 | M | 75 |
| I18N-002 | 新文案完整国际化 | i18n-report coverage.allKeysPresent=true + missingKeyLocales=[] | M | 0 缺失 |
| I18N-003 | 语言/key 报告 | i18n-report.json 存在 + sampleChecks | M | 报告可解析 |

### 5.8 构建（AC-BUILD-001/002）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| BUILD-001 | 可安装/启动/构建 | `bun install --frozen-lockfile && bun dev.js(200) && bun run build(exit0)` | M | 全 exit 0 |
| BUILD-002 | 测试命令可运行 | `bun test test/render-yml.test.mjs test/svg-output.test.mjs` | M | 全 pass |

### 5.9 技术边界（AC-TECH-001/002）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| TECH-001 | 小而精 | git diff 范围 review + 新增依赖清单（仅 mermaid） | H | 无无关重构 |
| TECH-002 | 核心路径清晰 | review src/render/{mermaid-to-svg,normalize-svg}.js | H | render→normalize 最短链 |

### 5.10 AI Workflow（AC-WORKFLOW-001/002/003）

| AC | 检查项 | 验证方法 | 性质 | 判据 |
|---|---|---|---|---|
| WORKFLOW-001 | dev-workflow.md 存在 | `test -f docs/dev-workflow.md` | M | **当前缺失 → GAP** |
| WORKFLOW-002 | Orchestrator 不调 LLM | 文档说明决策依据为 exit code/report | H | review |
| WORKFLOW-003 | 人工 review 节点明确 | 文档列出 10 个 review 节点 | H | review |

---

## 6. 已识别缺口与风险（执行阶段必须处理）

按严重度排序：

### G1 — `docs/dev-workflow.md` 缺失（阻塞 AC-WORKFLOW-001/002/003）
- **性质**：文档交付物，spec §16 明确列出。
- **处理建议**：属文档写作，非功能实现。若 phase prompt allowed files 允许 `docs/**`，可在本 loop 补；否则记录为阻塞项交人工。spec/架构/workflow loop 现有材料充足（human-gate-decisions.md、loop-execution-order.md、各 loop-summary.md），文档化成本低。
- **判定**：在 execution 阶段确认 allowed files；若不允许写，标记 `blocked → manual`。

### G2 — `README.md` 未反映 Mermaid→SVG（spec §16 交付物）
- **性质**：README 仍为上游 @webc.site/math。
- **处理建议**：同 G1，文档交付物。建议重写为 Mermaid→SVG 工具说明（保留上游 fork 来源引用）。
- **判定**：受限 allowed files；记录缺口。

### G3 — Cloudflare Pages 实际部署未执行（阻塞 AC-DEPLOY-001/002 公网部分）
- **性质**：deployment-report verdict=local-verified；postDeployAcceptanceChecklist 全 `pending-deploy`。
- **处理建议**：final-audit loop **不执行部署**（deploy agent 边界）。审计只能确认本地就绪；公网验证列为最终人工 gate。
- **判定**：M 项（本地构建）pass；H 项（公网）`pending-human`，阻塞最终 sign-off 但不阻塞审计报告生成。

### G4 — Size report 方法论偏差（已记录 finding，非阻塞）
- **gzip level**：report 用 zlib default level 6，docs/size/size-plan.md §4.1 推荐 level 9。两侧同方法，内部公平，level-9 参考值已记入 docs/size/verification.md。**status=acceptable**。
- **aggregation scope**：ours.rawBytes 仅测 entry chunk 未聚合全部 render-path chunks。docs/size/size-plan.md §3.2 推荐聚合。**status=noted**，已知方法论 gap，deferred。
- **处理建议**：在 final-report 中如实记录，不作为 fail，但标注为“后续 size-loop 迭代项”。

### G5 — `workflow/reports/final-report.md` 待生成本 loop execution 阶段产出。

### G6 — 受保护文件未被修改的确认（AC-TECH 辅证）
- 执行阶段应 grep 确认 `src/`（除新增 render/）、`lib/`、`../docs/*` canonical、`references/**`、`plugin/**`、`blog/**` 在本 loop 无改动。

---

## 7. 验证命令矩阵（execution 阶段执行脚本基础）

主控/执行 agent 应按以下顺序跑，所有 M 项 exit 0 方可进入 sign-off：

```text
# 1. 抽取可重复
bun extract/run.js                                            # exit 0

# 2. schema + 渲染测试
bun test test/render-yml.test.mjs                             # pass==accepted, fail==0
bun test test/svg-output.test.mjs                             # all pass

# 3. 上游 MathML 回归（不破坏）
bun test test/compare.test.js --only-failures                 # 0 failures

# 4. 规范检查链
./sh/check.js                                                 # i18n key 完整 exit 0
bun x oxfmt --check '!lib/**'                                 # exit 0
bun minify.js                                                 # exit 0
bun x oxlint                                                  # exit 0

# 5. 生产构建
rm -rf demo/dist && bun run build                             # exit 0, demo/dist/index.html 存在

# 6. size report 复现
bun sh/size-report.js                                         # exit 0, 数字与 size-report.json 一致

# 7. artifact 存在性
test -f extract/run.js
test -f extract/report.json
test -f test/schema.yml
test -f workflow/reports/size-report.json
test -f workflow/reports/i18n-report.json
test -f docs/i18n-language-map.md
# 以下为缺口，当前预期 fail（见 G1/G2）
test -f docs/dev-workflow.md
```

---

## 8. 人工 review 清单（H 项，最终 sign-off 前）

1. **DESIGN-001/002**：dev server 打开页面，对照 math.webc.site 视觉一致性。
2. **COMPARE-003**：页面“性能 proxy”措辞是否清晰、无 runtime benchmark 夸大。
3. **TECH-001/002**：`git diff` 总览改动范围 + 核心路径 review。
4. **WORKFLOW-002/003**：dev-workflow.md 内容 review（依赖 G1 解决）。
5. **DEPLOY-001/002**：CF Pages 公网部署 + 功能逐项验证（依赖实际部署）。

---

## 9. 最终 sign-off 判据（Gate 8）

final-report.md 生成 `overall: pass` 需同时满足：

1. §5 所有 **M 项** 全 pass（允许 G4 notated finding 不算 fail）。
2. §6 G1/G2 已解决或经人工确认接受降级（deferred）。
3. §6 G3（公网部署）记录为 `pending-human`，并明确不阻塞审计闭环、阻塞交付提交。
4. §8 人工 review 清单全部有结论（pass 或 accepted-deferred）。
5. 受保护文件确认未被本 loop 修改。
6. `workflow/reports/final-report.md` 写入，覆盖 spec §12 final-report 规范字段（已完成需求/未完成/测试覆盖来源/支持类型/不支持类型/体积对比/demo 访问/部署状态/技术取舍/后续方向）。

若任一 M 项 fail → final-report `overall: fail`，记录失败 AC 与回退 loop，不签收。

---

## 10. 不做的事（边界）

- 不实现新功能（phase blocked files）。
- 不修改 canonical parent docs（`../docs/*`）、`references/**`、`src/`（除 render/）、`lib/`。
- 不执行真实 Cloudflare Pages 部署（deploy agent 职责）。
- 不删除任何受保护/上游文件。
- 不为追求 pass 而删除失败测试或绕过渲染。
