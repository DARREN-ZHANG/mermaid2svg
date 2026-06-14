# Dev Workflow: AI-Assisted Development Process

本文档记录 Mermaid → SVG 项目的 AI 辅助开发流程，包括 Codex、OpenCode、Orchestrator 的分工，自动化循环设计，人工 review 节点，以及最终验收 gate。

---

## 1. 角色分工

### 1.1 Codex Planner

**职责**：复杂任务拆解。

- 将项目 spec 和 acceptance criteria 拆解为可执行、可验收的任务 DAG。
- 为每个任务定义输入、输出、依赖关系、验收标准和允许/禁止修改的文件范围。
- 任务失败超过自动 retry 上限时，重新拆解问题。
- 控制任务边界，避免单次执行范围过大。

**不做的事**：

- 不运行测试。
- 不修复具体 bug。
- 不判断最终是否通过验收。
- 不长时间持续读取所有上下文。

### 1.2 OpenCode Executor

**职责**：按任务规约执行代码修改。

- 根据 phase prompt 中的任务描述和 allowed/blocked files 执行修改。
- 自行运行局部测试和验证命令（`bun test`、`bun run build` 等）。
- 失败时优先做局部修复，不扩大范围。
- 每个任务产出可验证 artifact（JSON 报告、测试结果、源码文件）。
- 每完成一组修改即按 conventional commits 提交。

**不做的事**：

- 不做全局任务决策。
- 不修改当前任务 phase prompt allowed files 之外的范围。
- 不重新定义项目需求。
- 不绕过测试或验收门。
- 不使用 screenshots、canvas、puppeteer-as-renderer 或服务端渲染冒充 SVG 输出。

### 1.3 Deterministic Orchestrator

**职责**：基于机器可读结果做调度决策。

Orchestrator 是 TypeScript 编写的确定性状态机，位于 `workflow/loops/` 目录下。它**不调用任何 LLM**，决策完全基于：

1. exit code（构建、测试、抽取脚本的退出码）
2. 测试报告（`bun test` 的 pass/fail 计数）
3. 构建报告（`bun run build` 的 exit code 和产物存在性）
4. 文件存在性检查（`test -f` 各交付物）
5. bundle size 报告（`workflow/reports/size-report.json` 的字节计数）
6. gzip size 报告（同上）
7. deployment 预检状态（`workflow/reports/deployment-report.json` 的 verdict 字段）
8. acceptance checklist（`workflow/reports/final-acceptance-checklist.json`）

Orchestrator 维护每个 loop 的状态文件（`workflow/state/<loop-name>.state.json`），记录：

- 当前 phase（plan / execution / verification / done / blocked）
- retry 次数
- 验证结果
- 产出文件路径

---

## 2. 任务拓扑

项目按以下顺序执行 9 个 loop，每个 loop 对应 architecture 文档 §3 中的 L1-L8 + Gate 8：

```
S0. Init Loop (baseline audit, cleanup, test extraction scaffolding)
     ↓
L1. Test Extraction Loop (extract/run.js, test/*.yml, test/schema.yml, extract/report.json)
     ↓
L2. Render Loop (src/render/mermaid-to-svg.js, render-capabilities.json)
     ↓
L3. SVG Output Loop (src/render/normalize-svg.js, svg-output-compatibility.json)
     ↓
L4. Web Demo Loop (demo/index.pug, demo/index.js, demo/style.styl, demo/const/mermaidExamples.js)
     ↓
L5. Theme Loop (demo/const/themes.js, demo/theme.css, theme-css-report.json)
     ↓
L6. Size Loop (sh/size-report.js, workflow/reports/size-report.json, demo/const/sizeData.js)
     ↓
L7. I18N Loop (demo/i18n/*.js × 75, i18n-report.json, i18n-language-map.md)
     ↓
L8. Deploy Loop (wrangler.toml, demo/public/_headers, deployment-report.json)
     ↓
Gate 8. Final Acceptance Audit (final-acceptance-checklist.json, docs/dev-workflow.md, final-report.md)
```

拓扑约束：

- 测试抽取必须早于渲染实现（渲染测试依赖抽取的 YAML）。
- 渲染实现必须早于 SVG 规范化（normalize 依赖 render 输出）。
- SVG 输出稳定性必须早于 demo 集成（demo 消费规范化 SVG）。
- demo 必须早于主题切换（主题作用于 demo 中的 SVG）。
- 主题必须早于 size 对比（size 测量的是含主题的 build 产物）。
- size 必须早于 i18n（i18n 新增 key 后需要重新 build）。
- i18n 必须早于部署（部署版本需要完整 i18n）。
- 本地验证必须早于 Cloudflare Pages 部署。

---

## 3. 自动化执行循环

每个 loop 内部遵循 plan → execution → verification 三阶段循环：

### 3.1 Plan 阶段

- Agent 读取 canonical spec 和前序 loop 的产出。
- Agent 生成 `docs/<loop-name>/<loop-name>-plan.md`，定义：
  - 审计/实现目标
  - 检查矩阵（AC 编号 → 验证方法 → 判据）
  - 允许修改的文件范围
  - 禁止修改的文件范围
- 提交：`docs(<loop>): add <loop> plan`

### 3.2 Execution 阶段

- Agent 按 plan 执行代码修改。
- 每完成一组逻辑相关的修改即提交。
- 提交消息遵循 conventional commits：`feat(<loop>): ...`, `fix(<loop>): ...`, `test(<loop>): ...`, `chore(<loop>): ...`

### 3.3 Verification 阶段

- Agent 运行 `verify_commands`（测试、构建、脚本）。
- Agent 生成或更新 `workflow/reports/<loop>-report.json`，记录：
  - 验证命令和 exit code
  - pass/fail 计数
  - 产物清单
  - 已知 gap 和 finding
- Agent 生成 `docs/<loop-name>-loop-report.md`，记录人类可读的验证结论。
- 提交：`docs(<loop>): write <loop> final report`

---

## 4. Retry / Blocked / Manual Review 规则

### 4.1 Retry 策略

每个任务最多 3 次自动 retry：

| 次数    | 策略                                     |
| ------- | ---------------------------------------- |
| 第 1 次 | 使用原 task + 完整失败日志               |
| 第 2 次 | 只给当前失败测试 + 相关文件 + 最小上下文 |
| 第 3 次 | 要求最小修复，禁止重构                   |

超过 3 次后进入 `blocked` 状态。

### 4.2 Blocked 状态

进入 `blocked` 的条件：

- 达到最大 retry 次数（3 次）。
- 失败原因超出当前 task 范围。
- Agent 修改了禁止修改的文件。
- 测试失败无法通过局部修复解决。
- Acceptance criteria 与当前实现目标冲突。
- 遇到 Human Gate 问题（见 §5）。

Blocked 后的处理：

- 记录 blocked 原因到 state.json。
- 交由 Codex 重新拆解或人工 review。
- 不自动推进。

### 4.3 非 blocking 的 noted/deferred

某些 finding 不阻塞当前 loop，但需要在最终审计中如实记录：

- 方法论偏差（如 gzip level 6 vs 推荐 level 9，但两侧同方法）。
- 聚合口径 gap（如 size 仅测 entry chunk 未聚合全部 chunk）。
- 这些标注为 `status: acceptable` 或 `status: noted`，在 final-audit 中复核。

---

## 5. 人工 Review 节点

以下决策节点需要人工介入（来自 architecture §13 和 human-gate-decisions.md）：

| #   | 节点                              | 触发时机            | 状态                                             |
| --- | --------------------------------- | ------------------- | ------------------------------------------------ |
| 1   | Spec / Acceptance Criteria 确认   | Init Loop 开始前    | ✅ 已确认                                        |
| 2   | 测试抽取范围确认                  | Extract Loop 开始前 | ✅ 已确认 (HG-2: 18 tests accepted)              |
| 3   | Mermaid diagram 类型范围确认      | Extract/Render Loop | ✅ 已确认 (HG-1: 8 MVP types)                    |
| 4   | 浏览器测试框架确认                | Render Loop         | ✅ 已确认 (HG-3: Playwright as harness only)     |
| 5   | 核心转换器接入点确认              | Render Loop         | ✅ 已确认 (src/render/)                          |
| 6   | 页面 demo 风格方向确认            | Web Demo Loop       | ✅ 已确认 (复用 math.webc.site)                  |
| 7   | beautiful-mermaid 对比口径确认    | Size Loop           | ✅ 已确认 (HG-4: local reference pinned)         |
| 8   | i18n 语言列表与 fallback 策略确认 | I18N Loop           | ✅ 已确认 (HG-5: 75 locales, English fallback)   |
| 9   | Cloudflare Pages 部署方式确认     | Deploy Loop         | ✅ 已确认 (HG-6: static site, no server runtime) |
| 10  | Final diff 确认                   | Final Audit         | ⏳ 待人工 review                                 |

**不需要人工介入的节点**：

- 单任务执行和局部代码修改。
- 普通测试失败后的自动重试修复。
- build 重跑。
- size report 重跑。
- 常规文档更新。

---

## 6. AI 辅助方式说明

### 6.1 使用的工具

| 工具                             | 角色           | 说明                                                    |
| -------------------------------- | -------------- | ------------------------------------------------------- |
| Codex (GLM-5.1 Planner)          | 任务拆解       | 将 spec 拆解为任务 DAG，定义每个 loop 的验收标准        |
| OpenCode (Executor Agent)        | 执行与局部验证 | 按 phase prompt 执行代码修改，运行测试，产出 artifact   |
| Orchestrator (TypeScript 状态机) | 确定性调度     | 读取 state.json 和 report JSON，决定 pass/retry/blocked |

### 6.2 Agent 类型

项目为每个 loop 定义了专门的 agent（位于 `.opencode/agents/`）：

- `init-agent.md` — 初始化、审计、抽取脚手架
- `render-agent.md` — 浏览器端 Mermaid 渲染集成
- `svg-output-agent.md` — SVG 输出规范化
- `web-demo-agent.md` — 页面 demo 集成
- `theme-agent.md` — Beautiful Mermaid CSS 主题切换
- `size-agent.md` — 体积/gzip 对比报告
- `i18n-agent.md` — 国际化接入
- `deploy-agent.md` — Cloudflare Pages 部署
- `final-audit-agent.md` — 最终验收审计

每个 agent 有明确的：

- **Allowed files**：该 loop 允许修改的文件范围。
- **Blocked files**：禁止修改的文件（canonical docs、references、上游代码等）。
- **Mission**：该 loop 的具体目标。
- **Verification**：验证方式。

### 6.3 Phase Prompt 机制

Orchestrator 为每个 loop 的每个阶段（plan/execution/verification）生成 phase prompt，其中包含：

- Allowed files（白名单）
- Blocked files（黑名单）
- Mission（任务目标）
- Verification（验证要求）

Agent 只执行 phase prompt 定义的范围，不越界。

---

## 7. 验收 Gate

### 7.1 各 Loop 的 Gate

| Gate   | Loop        | 判据                                                     |
| ------ | ----------- | -------------------------------------------------------- |
| Gate 1 | Init        | workflow scaffolding 存在，extract 脚手架就绪            |
| Gate 2 | Extraction  | extract/run.js 可重复执行，18 yml 生成，report 完整      |
| Gate 3 | Render      | 18/18 测试 pass，render-capabilities.json 无 unsupported |
| Gate 4 | Demo        | 页面可运行，输入/渲染/错误提示/示例可用                  |
| Gate 5 | Size        | size-report.json 生成，数据可追溯，页面数据一致          |
| Gate 6 | I18N        | 75 locale × 19 key 无缺失，i18n-report 生成              |
| Gate 7 | Deploy      | 本地 build 通过，CF Pages 配置就绪                       |
| Gate 8 | Final Audit | 所有 M 项 pass，H 项有结论，final-report 生成            |

### 7.2 最终验收 Gate (Gate 8)

`overallVerdict: pass` 需同时满足：

1. 所有 machine-verifiable AC 项全部 pass。
2. Human review 节点全部有结论（pass 或 accepted-deferred）。
3. Cloudflare Pages 公网部署验证完成（7 项 postDeploy checklist 全 pass）。
4. 受保护文件确认未被修改。
5. `final-acceptance-checklist.json` 和 `final-report.md` 写入。

当前状态：

- ✅ 所有 M 项 pass（44/44）。
- ⏳ 6 项 H 项待人工 review。
- ⏳ CF Pages 公网部署待执行。
- ✅ `docs/dev-workflow.md` 已创建（本文件）。
- ✅ `final-acceptance-checklist.json` 已生成。

---

## 8. 关键决策记录 (Human Gate Decisions)

以下决策在 Init Loop 阶段经人工确认，后续 loop 直接执行（详见 `workflow/human-gate-decisions.md`）：

| Gate | 决策                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| HG-1 | MVP diagram: flowchart, sequenceDiagram, classDiagram, stateDiagram-v2, erDiagram, pie, gantt, xychart-beta |
| HG-2 | 初始 18 个 YAML 测试被接受为初始 gate                                                                       |
| HG-3 | Playwright 仅作为测试 harness；禁止作为 renderer；不用 screenshot/canvas 作为 pass/fail oracle              |
| HG-4 | beautiful-mermaid 对比使用本地 references/ 仓库，pin commit 2ac8bbbb                                        |
| HG-5 | 保持 75 locale 结构，所有 key 必须存在于每个 locale，英语 fallback 可接受                                   |
| HG-6 | CF Pages 部署为静态站点，不引入 server runtime/database/queue                                               |
| HG-7 | 不在 Render Loop 前重写抽取系统                                                                             |

---

## 9. 产物清单

### 9.1 核心代码

| 文件                            | Loop       | 说明                                          |
| ------------------------------- | ---------- | --------------------------------------------- |
| `extract/run.js`                | Extraction | 测试抽取脚本                                  |
| `src/render/mermaid-to-svg.js`  | Render     | 浏览器端 Mermaid → SVG 渲染                   |
| `src/render/normalize-svg.js`   | SVG Output | SVG 规范化（viewBox, script 移除, 确定性 ID） |
| `demo/index.pug`                | Web Demo   | 页面模板                                      |
| `demo/index.js`                 | Web Demo   | 页面逻辑（输入 → 渲染 → 预览）                |
| `demo/const/mermaidExamples.js` | Web Demo   | 8 种 diagram 示例数据                         |
| `demo/const/themes.js`          | Theme      | 8 套 Beautiful Mermaid 主题色板               |
| `demo/theme.css`                | Theme      | 主题 CSS overlay                              |
| `sh/size-report.js`             | Size       | 体积测量脚本                                  |
| `demo/const/sizeData.js`        | Size       | 对比图数据（来自 size-report.json）           |

### 9.2 机器可读报告

| 文件                                               | Loop        | 说明                                                    |
| -------------------------------------------------- | ----------- | ------------------------------------------------------- |
| `extract/report.json`                              | Extraction  | 三来源 scanned/candidate/accepted/skipped + skipReasons |
| `test/schema.yml`                                  | Extraction  | YAML 测试 schema                                        |
| `workflow/reports/render-capabilities.json`        | Render      | 18 测试 support matrix                                  |
| `workflow/reports/svg-output-compatibility.json`   | SVG Output  | 5 条规则 × 18 corpus + 10 synthetic rules               |
| `workflow/reports/web-demo-report.json`            | Web Demo    | UI 功能验证                                             |
| `workflow/reports/theme-css-report.json`           | Theme       | 主题验证 + CSS 来源追溯                                 |
| `workflow/reports/size-report.json`                | Size        | bm/ours raw+gzip + verification                         |
| `workflow/reports/i18n-report.json`                | I18N        | 75 locale × 19 key 覆盖                                 |
| `workflow/reports/deployment-report.json`          | Deploy      | 本地 build + CF Pages 配置                              |
| `workflow/reports/final-acceptance-checklist.json` | Final Audit | 全 AC 验收矩阵                                          |

### 9.3 文档

| 文件                               | 说明                       |
| ---------------------------------- | -------------------------- |
| `docs/dev-workflow.md`             | 本文件                     |
| `docs/final-audit/final-report.md` | 最终验收报告               |
| `docs/i18n-language-map.md`        | 国际化语言列表与 key 覆盖  |
| `docs/<loop>-loop-report.md` × 8   | 各 loop 的人类可读验证报告 |
| `docs/<loop>/<loop>-plan.md` × 9   | 各 loop 的执行计划         |
