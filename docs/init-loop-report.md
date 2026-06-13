# Init Loop Report

> Phase 8 — 初始化阶段最终报告，供人工 review 后决定是否进入 Formal Task Decomposition Loop。

## 1. 最终状态

**Partially Ready** — 核心产出全部健全，但存在环境工具链缺口和 7 项待 Human Gate 确认的决策。

| 维度 | 状态 | 说明 |
|---|---|---|
| 项目盘点 | READY | 完整记录项目结构、受保护文件、技术栈 |
| 仓库清理 | READY | 16 个无关文件已移除，6 次 commit，可 git revert 回滚 |
| 参考仓库挖掘 | READY | 3 仓库 × 2 轮审计 = 127 候选，字节级验证无误 |
| 测试抽取 | READY | `extract/run.js` 幂等可执行，18 条 YAML + schema + report |
| Spec / Acceptance 提案 | READY | 基于实际挖掘结果的调整建议已撰写 |
| 验证 | PARTIAL | 核心产物验证通过；bun 未安装阻断 test.sh 完整流程 |

---

## 2. 项目认知

### 2.1 原始项目

- **fork 来源**: `https://github.com/webc-site/math` — 全球最小最快的网页 Markdown 公式渲染器（TeX → MathML）
- **包名**: `@webc.site/math` (v0.1.22)，许可证 MulanPSL-2.0
- **运行时**: Bun（开发和构建），ESM module
- **构建**: Vite 8 + Pug + Stylus + LightningCSS + Rolldown
- **部署目标**: Cloudflare Pages（静态站点），当前无 CF Pages 配置

### 2.2 Mermaid 集成主战场

Mermaid → SVG 的页面改造集中在 `demo/` 目录：
- `demo/index.pug` — 主页面模板（当前为 MathML demo，需改写）
- `demo/index.js` — 页面逻辑（需改写）
- `demo/style.styl` — 主样式（需扩展）
- `demo/i18n/` — 75 个语言文件（需新增 Mermaid key）
- `demo/webc/` — Web Components（Box/BoxX/Scroll/Btn/Lg/I18n 可复用）
- `demo/const/formulas.js` — 数学公式数据（需替换为 Mermaid 示例）
- `demo/size.svg` / `demo/speed.svg` — MathML 对比图（需替换为 Mermaid 版本）

### 2.3 受保护文件（不可修改/删除）

| 路径 | 保护原因 |
|---|---|
| `src/**` | 上游 TeX → MathML 库 |
| `lib/**` | 编译产物 |
| `../docs/mermaid-svg-spec.md` | 项目规约 |
| `../docs/acceptance-criteria.md` | 验收标准 |
| `../docs/mermaid-svg-architecture.md` | 技术架构 |
| `../references/**` | 参考仓库 |
| `plugin/**`, `blog/**`, `readme/**` | 上游项目资产 |
| `.github/workflows/npm.yml` | 上游 CI |
| `demo/webc/Math.js` | 上游组件 |
| `test/case/*.yml` | 上游 MathML 测试 |

### 2.4 已识别的风险与未知

1. **mermaid 包引入方式**: mermaid 包体积较大（~1MB+），需确认是否浏览器端按需加载或 CDN
2. **test.sh 兼容**: 当前 test.sh 含 `bun x oxfmt` 和 `bun minify.js`，Mermaid 测试需兼容
3. **测试环境 DOM 方案**: Mermaid 浏览器端 API 需 DOM 环境，bun test 中需解决（禁止 puppeteer/playwright）
4. **beautiful-mermaid 对比口径**: CDN JS 指哪个文件、版本如何固定需确认
5. **Cloudflare Pages 构建**: 当前无配置，需确定构建命令和输出目录
6. **devDependencies 冗余**: katex/mathjax/cli-table3 等已无用但尚未清理

---

## 3. 已保留内容

共保留约 50 项文件/目录，按类别汇总：

| 类别 | 代表路径 | 说明 |
|---|---|---|
| 受保护 | `src/`, `lib/`, `../docs/*`, `references/**`, `plugin/`, `blog/`, `readme/` | Spec 禁止修改 |
| Demo 框架 | `demo/index.pug`, `demo/index.js`, `demo/style.styl`, `demo/build.js`, `vite.config.js`, `dev.js` | Mermaid 页面改造基础 |
| i18n 系统 | `demo/i18n/` (75 语言), `demo/webc/I18n.js` + `I18n/`, `sh/check.js` | 75 种语言国际化复用 |
| Web Components | `demo/webc/Box/`, `BoxX/`, `Btn/`, `Scroll/`, `Lg/`, `js/` | UI 布局复用 |
| SVG 资源 | `demo/svg/bg.svg`, `npm.svg`, `github.svg`, `i18n.svg` | 设计风格复用 |
| 测试框架 | `test/case/*.yml` (7 个), `test/compare.js`, `test/compare.test.js`, `test.sh` | 上游 MathML 测试保留 |
| 构建工具 | `minify.js`, `sh/ROOT.js`, `sh/hook/`, `package.json`, `knip.js` | 构建链保留 |

详见 `docs/init/preserve-list.md`。

---

## 4. 已移除内容

共移除 16 个文件，分 6 次 git commit 完成：

| Step | 已删除 | Commit | 原因 |
|---|---|---|---|
| A | `sh/bench/` (5 文件) | `b99300a` | MathML 性能基准脚本，Mermaid 不需要 |
| B | `sh/gen_formula_svg.js`, `sh/stringAnalyze.js`, `sh/unicodeUnescape.js` | `bce85a5` | MathML 专用工具脚本 |
| C | `extract/katex.js`, `extract/mathjax.js`, `extract/lib.js`, `extract/run.js` (旧) | `50c5240` | TeX 抽取逻辑，Mermaid 版从零重写 |
| D | `dist.js` | `32df38d` | npm 发布脚本，Mermaid 项目不发布 npm |
| E | `demo/svg/demo.zh.svg`, `demo/svg/demo.en.svg`, `demo/svg/x.svg` | `db7204e` | MathML demo 截图和未使用图标 |
| — | `knip.js` 更新 | `d0c26f2` | 移除 7 个已不存在的 entry 路径 |

所有删除均可通过 `git revert` 逐一回滚。详见 `docs/init/cleanup-execution.md`。

### 未修改 package.json

devDependencies 中存在冗余的 MathML 依赖（katex, mathjax, oxc-parser, cli-table3 等），按策略不在 cleanup 阶段修改，留待后续 Human Gate 确认后统一清理。

---

## 5. 已暂缓内容

以下条目按 cleanup-plan.md §3 暂缓处理，需后续 Phase 完成后决定：

| 路径 | 暂缓原因 |
|---|---|
| `demo/size.svg` | 需等 Mermaid size report 就绪后替换 |
| `demo/speed.svg` | Mermaid 项目可能只做 size 对比 |
| `demo/const/formulas.js` | 需等 Mermaid 示例数据确定后替换 |
| `README.mdt` / `README.md` | 最终需更新但非优先 |
| `workflow/runs/init/` | Init Loop 执行记录，可清理但不紧急 |
| `workflow/state/init-loop.state.json` | Init Loop 状态文件 |
| `workflow/hooks/pre-commit.test.mjs` | 需确认是否仍需 |
| `knip.js` devDependencies 清理 | 需在所有保留文件确认不依赖后再统一清理 |
| `.env` / `.opencode/` / `opencode.jsonc` | 需人工审批 |

---

## 6. 参考仓库分析

### 6.1 分析的仓库

| 仓库 | 本地路径 | scanned files | candidates | accepted | skipped |
|---|---|---|---|---|---|
| `probelabs/maid` | `references/maid` | 211 | 25 | 7 | 18 |
| `lukilabs/beautiful-mermaid` | `references/beautiful-mermaid` | 24 | 25 | 7 | 18 |
| `mermaid-js/mermaid` | `references/mermaid` | 271 | 77 | 4 | 73 |
| **合计** | | **506** | **127** | **18** | **109** |

### 6.2 两轮审计

挖掘分两轮执行：
1. **第一轮**: 5 个并行 explore 子代理，产出 104 个候选
2. **第二轮**: 5 个并行 explore 子代理，逐条验证现有候选的 sourcePath 与 input 字节级一致（无误判），并补录 23 个经源文件验证的新候选

最终 127 候选全部通过字节级验证，无虚构路径、无内容损坏。

### 6.3 仓库特征

- **maid**: `test-fixtures/` 下 `.mmd` 文件路径清晰，覆盖 6 种类型（无 erDiagram）
- **beautiful-mermaid**: 全部候选来自单一文件 `samples-data.ts`（85 条 `Sample[]`），覆盖 6 种类型（无 pie/gantt/journey）
- **mermaid**: 候选最大的来源，需混合策略提取（spec 文件嵌入字符串 + demos HTML + .mmd 固件），覆盖全部 diagram type

详见 `docs/init/reference-inventory.md`。

---

## 7. 已生成测试摘要

### 7.1 测试文件

| 产出 | 位置 | 数量 |
|---|---|---|
| YAML 测试 | `test/*.yml` | 18 个 |
| Schema | `test/schema.yml` | 1 个 |
| 抽取脚本 | `extract/run.js` | 1 个（幂等可执行） |
| 抽取报告 | `extract/report.json` | 1 个（含 109 条 skippedSamples） |
| 候选清单 | `docs/init/test-candidates.json` | 127 条 |

### 7.2 Diagram Type 覆盖

| type | accepted | 来源数 |
|---|---|---|
| flowchart | 5 | 3 (maid + bm + mermaid) |
| sequenceDiagram | 3 | 3 |
| classDiagram | 2 | 2 (maid + bm) |
| stateDiagram | 2 | 2 (maid + bm) |
| erDiagram | 2 | 2 (bm + mermaid) |
| pie | 2 | 2 (maid + mermaid) |
| gantt | 1 | 1 (maid) |
| other (xychart-beta) | 1 | 1 (bm) |
| **总计** | **18** | **3/3** |

### 7.3 候选分类

| classification | 数量 | 说明 |
|---|---|---|
| minimal_core | 101 | 当前预期能稳定渲染的核心样例 |
| useful_later | 22 | 语法正确但偏大/边缘，留待 Render Loop 验证 |
| unsupported_candidate | 4 | 实验性图表（sankey/block/architecture/packet），确定性风险 |
| invalid_or_non_deterministic | 0 | 无故意损坏输入 |

### 7.4 选取算法

按类型配额 + 来源轮询策略：
1. 仅接受 `minimal_core` 分类
2. 每种 type 按配额选取（flowchart=5, sequence=3, class/state/er=2, pie/gantt=2/1, other=1）
3. 同优先级内交替从不同来源取，确保多样性
4. P0 > P1 > P2

详见 `docs/test-inventory.md`。

---

## 8. Spec / Acceptance 提案摘要

### 8.1 Spec 更新提案（`docs/spec-update-proposal.md`）

基于实际挖掘结果提出以下建议（**不直接修改 canonical spec**）：

1. **MVP 支持边界**: 核心 6 种（flowchart/sequence/class/state-v2/er/pie）+ 扩展 2 种（gantt/xychart-beta）
2. **unsupported_candidate 处置**: 4 种实验性类型（sankey/block/architecture/packet）保守排除，保留升级路径
3. **测试集扩展路径**: Render Loop 后逐步纳入 useful_later 候选，目标扩至 30-40 条
4. **依赖风险**: mermaid 版本需锁定；beautiful-mermaid CSS 覆盖面待确认；测试环境 DOM 方案待确认
5. **source URL**: 当前全部为 null，需在 Render Loop 前补全

### 8.2 Acceptance 更新提案（`docs/acceptance-update-proposal.md`）

补充以下验收标准：

| 编号 | 标题 | 核心要求 |
|---|---|---|
| AC-EXTRACT-008 | 抽取报告字段完整性 | skippedSamples 含 id/repo/path/type/reason |
| AC-EXTRACT-009 | source URL 可追溯性 | test/*.yml 中 source.url 不为 null |
| AC-EXTRACT-010 | 抽取脚本幂等性 | 连续两次运行输出一致 |
| AC-RENDER-001 | MVP 测试全通过 | 18 条非 skip 测试通过渲染 |
| AC-RENDER-002 | 错误输入处理 | 空输入/非法语法有清晰提示 |
| AC-TEST-001 | 测试运行器 CI 可调用 | 退出码反映结果，schema 校验前置 |

---

## 9. 验证摘要

### 9.1 通过项

| 验证项 | 结果 | 说明 |
|---|---|---|
| `node extract/run.js` | PASS | 生成 18 YAML + schema + report |
| `node sh/check.js` | PASS | 75 个语言文件完整 |
| Schema 字段校验 | PASS | 18 个 YAML 顶层字段齐全 |
| report.json 合法性 | PASS | 3 来源全覆盖，109 条跳过可追溯 |
| extract/run.js 幂等性 | PASS | 多次运行输出一致（仅时间戳变化） |

### 9.2 未通过项（环境缺口）

| 验证项 | 结果 | 原因 | 影响 |
|---|---|---|---|
| `./test.sh` | FAIL (exit 127) | 环境无 bun | 完整测试链无法运行 |
| `./sh/check.js` | FAIL (exit 127) | shebang 为 bun | 需用 `node sh/check.js` 替代 |
| `bun test test/compare.test.js` | FAIL (exit 127) | 无 bun | MathML 测试无法执行 |
| `npm test` / `npm run build` | FAIL | package.json 无对应 script | CI 无法通过标准命令调用 |

### 9.3 预期未实现项

| 验证项 | 状态 | 说明 |
|---|---|---|
| Mermaid 测试 runner | 不存在 | 初始化阶段不实现转换器，Render Loop 构建 |
| Mermaid 渲染集成 | 不存在 | 同上 |
| Demo 页面改写 | 未开始 | Web Demo Loop |

### 9.4 当前 Git Diff

相对于 HEAD 的未提交改动（9 文件）：
- `extract/report.json` — 仅 `generatedAt` 时间戳变更（验证重跑产生）
- `lib/*` — 早期 minify 产物差异（非本阶段产生）
- `workflow/*`, `opencode.jsonc`, `package.json` — workflow loop 基础设施改动（非本阶段产生）

详见 `docs/init/verification.md`。

---

## 10. 待 Human Gate 决策

以下 7 项决策需要人工确认。不阻断任务图生成，但相关任务执行到对应 gate 时必须暂停：

| 编号 | 决策项 | 关键问题 | 建议处置 |
|---|---|---|---|
| HG-1 | MVP 支持边界 | 是否接受 8 种类型？是否纳入 journey/gitGraph/mindmap？ | 先接受 8 种，高确定性类型作为 Phase 2 扩展 |
| HG-2 | 测试配额策略 | 18 条是否足够？配额比例是否合理？ | 接受 18 条为初始 gate，Render Loop 后扩大 |
| HG-3 | 测试环境 DOM 方案 | 用 jsdom / linkedom / happy-dom？（禁止 puppeteer/playwright） | Render Loop 前确认 |
| HG-4 | beautiful-mermaid 对比口径 | CDN JS 指哪个文件？版本如何固定？本项目对比哪个 build artifact？ | Size Loop 前确认 |
| HG-5 | i18n 语言列表对齐 | 新增哪些 Mermaid key？fallback 策略？语言列表是否与原项目完全一致？ | I18N Loop 前确认 |
| HG-6 | Cloudflare Pages 部署 | 构建命令？输出目录？SPA fallback？ | Deploy Loop 前确认 |
| HG-7 | extract/run.js 扩展方案 | skippedSamples 是否需完整 input？source URL 何时补全？配额是否动态调整？ | Render Loop 前确认 |

### 人工审批项（cleanup 遗留）

| 路径 | 需审批原因 |
|---|---|
| `.env` | 可能含敏感配置 |
| `.opencode/` + `opencode.jsonc` | OpenCode Agent 配置 |
| `workflow/loops/init/` | Init Loop 核心逻辑 |
| `conf` | knip.js 引用但目录可能不存在 |
| `docs/superpowers/plans/` | 需确认保留价值 |
| package.json devDependencies 清理 | 需确认所有保留文件不再依赖 |

---

## 11. 下一步推荐

**Formal Task Decomposition Loop (Codex Task Decomposition)**

### 11.1 任务分解输入文件

| 文件 | 用途 |
|---|---|
| `../docs/mermaid-svg-spec.md` | 项目需求冻结版本 |
| `../docs/acceptance-criteria.md` | 验收门来源 |
| `../docs/mermaid-svg-architecture.md` | 技术架构和 loop 设计 |
| `docs/spec-update-proposal.md` | 基于实际挖掘的 spec 调整建议 |
| `docs/acceptance-update-proposal.md` | 基于实际抽取的验收标准补充 |
| `docs/init/test-candidates.json` | 完整候选清单（127 条） |
| `docs/test-inventory.md` | 已入选测试清单（18 条） |
| `docs/init/reference-inventory.md` | 参考仓库特征和抽取启示 |
| `docs/init/project-inventory.md` | 项目结构和受保护文件 |
| `docs/init/preserve-list.md` | 保留清单 |
| `docs/init/remove-candidates.md` | 移除候选清单 |

### 11.2 建议的任务拓扑

```
[已完成] S0. Repo Baseline Snapshot
[已完成] S1. Spec Lock (canonical docs 不变)
[已完成] S2-S3. Init Loop (inventory + cleanup + extraction + verification)
[已完成] S4. Spec Feedback (提案已撰写)
  |
  v
[待启动] Formal Task Decomposition (Codex)
  |
  v
L0. Environment Setup (安装 bun, 补齐 npm scripts) ← 新增前置
  |
  v
L1. Test Runner Implementation (依赖 HG-3)
  |
  v
L2. Mermaid Browser Render Integration
  |
  v
L3. SVG Output Normalization
  |
  v
L4. Web Demo Integration
  |
  v
L5. Theme / CSS Compatibility (依赖 HG-4)
  |
  v
L6. Size / Gzip Comparison (依赖 HG-4)
  |
  v
L7. I18N Integration (依赖 HG-5)
  |
  v
L8. Cloudflare Pages Deployment (依赖 HG-6)
  |
  v
S5. Final Acceptance Audit
```

### 11.3 关键注意事项

1. **环境准备任务**: 任务图中应包含安装 bun 运行时的前置任务（建议命名为 L0 Environment Setup），否则 test.sh 和 bun test 无法执行
2. **Human Gate 依赖**: 任务图应标注每个 gate 的依赖关系，相关任务执行到 gate 时暂停
3. **npm scripts 补齐**: 需添加 `test` / `build` / `extract` 便捷脚本，使 CI 可通过标准命令调用
4. **source URL 补全**: 作为 Render Loop 的前置任务或在抽取脚本中补全
5. **unsupported_candidate 升级路径**: Render Loop 应优先实测 sankey/block/architecture/packet，以证据驱动决策
6. **保守清理原则**: 后续清理 devDependencies 和暂缓项时仍需人工确认

---

## 12. Init Loop 产出物清单

| # | 产出 | 位置 | Commit |
|---|---|---|---|
| 1 | 项目盘点 | `docs/init/project-inventory.md` | init 早期 |
| 2 | 保留清单 | `docs/init/preserve-list.md` | init 早期 |
| 3 | 移除候选清单 | `docs/init/remove-candidates.md` | init 早期 |
| 4 | 清理计划 | `docs/init/cleanup-plan.md` | init 早期 |
| 5 | 清理风险评估 | `docs/init/cleanup-risk.md` | init 早期 |
| 6 | 清理执行记录 | `docs/init/cleanup-execution.md` | `186fbb7` |
| 7 | 参考仓库挖掘清单 | `docs/init/reference-inventory.md` | `3a3deee` + `89ec259` |
| 8 | 测试候选数据 | `docs/init/test-candidates.json` | `3a3deee` + `89ec259` |
| 9 | 抽取脚本 | `extract/run.js` | `5a96d58` |
| 10 | 抽取报告 | `extract/report.json` | `5a96d58` |
| 11 | 测试 Schema | `test/schema.yml` | `5a96d58` |
| 12 | Mermaid YAML 测试 | `test/*.yml` (18 个) | `5a96d58` |
| 13 | 测试清单 | `docs/test-inventory.md` | `eb57feb` |
| 14 | Spec 更新提案 | `docs/spec-update-proposal.md` | `7de6971` |
| 15 | 验收标准更新提案 | `docs/acceptance-update-proposal.md` | `7de6971` |
| 16 | 验证报告 | `docs/init/verification.md` | `77d4854` |
| 17 | Init Loop 最终报告 | `docs/init-loop-report.md` | 本文件 |

清理相关 commits:
- `b99300a` — remove sh/bench/
- `bce85a5` — remove MathML utility scripts
- `50c5240` — remove TeX extraction scripts
- `32df38d` — remove dist.js
- `db7204e` — remove MathML demo SVGs
- `d0c26f2` — update knip.js

---

## 13. 结论

初始化阶段（Phase 1-8）已完成项目认知、保守清理、参考仓库挖掘、测试抽取、schema 固化、提案撰写和验证的全部工作。

**核心 artifact 全部健全**:
- 抽取脚本可重复执行，幂等
- 18 条 YAML 测试字段完整、可解析
- 抽取报告覆盖 3 来源，跳过原因可追溯
- 75 语言 i18n 基线通过
- 受保护文件未被触碰

**环境缺口需在进入 Render Loop 前解决**:
- 安装 bun 运行时
- 补齐 `test` / `build` / `extract` npm scripts

**7 项 Human Gate 决策需在对应 loop 执行前确认**，但不阻断任务图生成。

**判定**: 可以进入 Formal Task Decomposition Loop。任务图应包含环境准备前置任务和 Human Gate 依赖标注。
