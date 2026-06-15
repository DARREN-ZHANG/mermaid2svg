# Mermaid → SVG 转换器技术架构与 Dev Workflow 最终修订版

## 0. 文档目的

本文档用于整体 review `mermaid → svg` 项目的技术架构与自动化开发 workflow。

文档重点说明：

1. 项目最终要交付什么。
2. 转换器本体如何分层。
3. Codex、OpenCode、Orchestrator 如何分工。
4. 测试抽取、浏览器端渲染接入、网页 demo、主题兼容、size / gzip 对比、国际化和 Cloudflare Pages 部署如何组成完整任务拓扑。
5. 每个 loop 的输入、输出、验收门和失败处理方式。

本文档不包含具体任务代码实现细节。

---

## 1. 项目目标

基于现有 `math.webc.site / webc-site/math` 项目，实现一个“最小、最快、可验证”的 `mermaid → svg` 转换器，并提供可部署的网页 demo。

核心目标：

1. 支持将 Mermaid 文本稳定转换为 SVG。
2. 转换链路尽可能短，避免过度封装。
3. 输出 SVG 可直接用于前端展示或服务端返回。
4. 从指定开源项目中抽取可用测试，并生成本项目可消费的 yml 测试集。
5. 网页 demo 可以输入 Mermaid、查看 SVG，并展示不同类型的 Mermaid 示例图。
6. 网页 demo 尽可能复用 `math.webc.site` 的设计风格。
7. 页面支持使用 `beautiful-mermaid` 的 CSS 进行主题切换。
8. 页面展示本项目与 `beautiful-mermaid` 的 JS 体积 / gzip 体积对比 SVG 柱状图；该对比仅作为性能 proxy，不作为运行时 benchmark。
9. 页面部署到 Cloudflare Pages。
10. 整个开发过程由自动化 workflow 驱动，减少人工反复提示。
11. Codex 负责复杂任务拆解，OpenCode 负责执行、修改和局部验证。
12. Orchestrator 不直接调用 LLM，只依据规约、状态文件、命令结果和验收规则调度流程。

---

## 2. 系统总体架构

系统分为两层：

1. 转换器本体。
2. 自动化开发 workflow。

---

## 2.1 转换器本体

转换器本体负责完成真实的 `mermaid → svg` 转换。

核心模块：

### 2.1.1 Input Layer

职责：

1. 接收 Mermaid 源文本。
2. 做基础输入校验。
3. 限制输入规模，避免异常图导致资源失控。
4. 将错误输入转化为可解释的错误结果。

验收关注点：

1. 空输入、超长输入、明显非法输入有明确错误。
2. 输入校验不破坏正常 Mermaid 文本。
3. 输入层不承担渲染逻辑。

---

### 2.1.2 Render Layer

职责：

1. 调用 Mermaid 渲染能力。
2. 生成原始 SVG。
3. 捕获语法错误、渲染错误和超时错误。
4. 保持转换路径最短。

验收关注点：

1. 支持范围内的 Mermaid 文本可以生成 SVG。
2. 不支持的语法明确失败，而不是生成错误 SVG。
3. 渲染失败不导致进程崩溃。
4. 不引入过重或不必要的抽象层。

---

### 2.1.3 SVG Output Layer

职责：

1. 清理和规范化 SVG。
2. 保证 SVG 根节点、`viewBox`、尺寸和结构稳定。
3. 移除明显不稳定或不安全内容。
4. 返回 SVG 字符串或文件结果。

验收关注点：

1. SVG 输出可直接嵌入前端页面。
2. 同一输入多次运行输出稳定。
3. 输出不依赖运行时 JS。
4. 输出不包含随机、不可测试的结构。

---

### 2.1.4 Test & Size Report Layer

职责：

1. 基于抽取测试集和手写关键测试验证功能。
2. 覆盖常见 Mermaid 图类型。
3. 验证 SVG 输出稳定性。
4. 测量目标 JS 产物的 raw size 和 gzip size，并生成可追溯 size report。

验收关注点：

1. 测试集能重复生成和重复运行。
2. 失败测试能定位到具体输入和原因。
3. size / gzip 对比数据由脚本生成，不手写。
4. 当前版本不设置运行时性能 benchmark gate；size / gzip 对比只作为性能 proxy。

---

## 2.2 自动化开发 Workflow

自动化开发 workflow 负责驱动整个项目从任务拆解到交付。

核心角色：

### 2.2.1 Codex Planner

职责：

1. 只负责复杂任务拆解。
2. 输出任务图、依赖关系和验收标准。
3. 在任务失败多次后重新拆解问题。
4. 帮助控制任务边界，避免 OpenCode 一次处理过多内容。

Codex 不负责：

1. 运行测试。
2. 修复具体 bug。
3. 判断最终是否通过验收。
4. 长时间持续读取所有上下文。

---

### 2.2.2 OpenCode Executor

职责：

1. 根据任务规约执行代码修改。
2. 自行运行局部测试和验证命令。
3. 失败时优先做局部修复。
4. 每个任务产出可验证 artifact。

OpenCode 不负责：

1. 全局任务决策。
2. 修改当前任务之外的范围。
3. 重新定义项目需求。
4. 绕过测试或验收门。

---

### 2.2.3 Deterministic Orchestrator

职责：

1. 不调用 LLM。
2. 读取任务图、状态文件、测试结果、build 结果和 size report。
3. 根据规则决定继续、重试、回滚、阻塞或进入下一阶段。
4. 维护 task 状态。
5. 生成 run report 和 final report。

Orchestrator 的判断依据只能来自：

1. exit code。
2. 测试报告。
3. 构建报告。
4. 文件存在性检查。
5. bundle size 报告。
6. gzip size 报告。
7. deployment preview 状态。
8. acceptance checklist。

---

### 2.2.4 Spec / Gate System

职责：

1. 作为 workflow 的判断依据。
2. 定义功能验收、测试通过率、输出格式、体积对比和部署要求。
3. 将测试集、任务图和最终交付物连接起来。

设计原则：

1. Spec first。
2. Artifacts over memory。
3. LLM for reasoning, scripts for truth。
4. Fail closed。
5. No silent degradation。

---

## 3. Workflow 总体拓扑

整体任务关系：

```text
Fork / Clone Repo
        ↓
Baseline Audit
        ↓
Spec / Acceptance Criteria Lock
        ↓
Codex Task Decomposition
        ↓
Task Graph Generation
        ↓
Orchestrator Scheduling
        ↓
OpenCode Execution Loop
        ↓
Automated Verification Gates
        ↓
Integration / Demo / Deployment Loops
        ↓
Final Acceptance Gate
        ↓
Documentation & Submission
```

更细的任务拓扑：

```text
S0. Repo Baseline Snapshot
        ↓
S1. Spec Lock
        ↓
S2. Codex Decomposition
        ↓
S3. Task Graph Materialization
        ↓
L1. Test Extraction Loop
        ↓
L2. Mermaid Browser Render Integration Loop
        ↓
L3. SVG Output Compatibility Loop
        ↓
L4. Web Demo Loop
        ↓
L5. Theme / CSS Compatibility Loop
        ↓
L6. Size / Gzip Comparison Loop
        ↓
L7. I18N Integration Loop
        ↓
L8. Cloudflare Pages Deployment Loop
        ↓
S4. Final Acceptance Audit
```

该拓扑的核心约束：

1. 测试抽取必须早于主要能力扩展。
2. 转换器实现必须早于网页 demo 深度集成。
3. SVG 输出稳定性必须早于主题切换和体积对比展示。
4. i18n 接入必须早于 Cloudflare Pages 最终部署验收。
5. 本地 demo 验证必须早于 Cloudflare Pages 部署。
6. Final Acceptance Audit 只能基于机器可读结果和人工 review checklist。

---

## 4. 核心目录约定

建议 workflow 相关文件集中放置，避免散落在项目中。

```text
/workflow
  /spec.md
  /acceptance-criteria.md
  /tasks.yml
  /state.json
  /test-schema.yml
  /runs
    /<run-id>
      input.md
      opencode-output.md
      test-result.txt
      build-result.txt
      size-report.json
      summary.md
  /reports
    final-report.md
    size-report.json
    i18n-report.json

/extract
  run.js
  report.json

/test
  *.yml
  schema.yml
```

文件职责：

1. `spec.md`：项目需求冻结版本。
2. `acceptance-criteria.md`：所有验收门来源。
3. `tasks.yml`：Codex 输出的任务图。
4. `state.json`：Orchestrator 当前状态。
5. `runs/`：每一轮自动化开发记录。
6. `reports/final-report.md`：最终 review 报告。
7. `extract/run.js`：测试抽取入口。
8. `extract/report.json`：测试抽取统计与 skip reasons。
9. `test/*.yml`：抽取后的测试用例。
10. `test/schema.yml` 或 `workflow/test-schema.yml`：YAML 测试 schema。
11. `workflow/reports/size-report.json`：size / gzip 对比数据来源。
12. `workflow/reports/i18n-report.json`：国际化语言列表与新增 key 覆盖报告。

---

## 5. Task Graph 规范

每个 task 必须具备以下字段：

```yaml
id:
title:
phase:
depends_on:
input_files:
output_files:
allowed_files:
blocked_files:
acceptance:
verify_commands:
retry_policy:
status:
```

字段含义：

1. `id`：稳定任务编号。
2. `title`：任务名称。
3. `phase`：所属阶段，例如 extraction、renderer、demo、deployment。
4. `depends_on`：前置任务。
5. `input_files`：任务需要读取的关键文件。
6. `output_files`：任务必须产出的文件。
7. `allowed_files`：OpenCode 允许修改的范围。
8. `blocked_files`：禁止修改的文件。
9. `acceptance`：局部验收标准。
10. `verify_commands`：该 task 完成后的验证命令。
11. `retry_policy`：失败后的重试规则。
12. `status`：当前状态。

约束：

1. Task graph 必须由 Codex 生成或更新。
2. Task 状态只能由 Orchestrator 修改。
3. OpenCode 只能执行当前 task，不修改 task graph。
4. 每个 task 必须有机器可判断的 done condition。

---

## 6. 核心 Loop 设计

## 6.1 Planning Loop

目标：把项目需求拆成可执行、可验收的小任务。

输入：

1. 项目 spec。
2. acceptance criteria。
3. 当前 repo 状态摘要。
4. 已知失败项摘要。
5. 上一轮 orchestrator 执行报告。

执行者：

- Codex。

输出：

1. 任务 DAG。
2. 每个任务的输入、输出和依赖。
3. 每个任务的验收标准。
4. OpenCode 的允许修改范围和禁止修改范围。
5. 推荐执行顺序。

验收标准：

1. 每个任务边界清晰。
2. 每个任务可被 Orchestrator 验收。
3. 不存在依赖环。
4. 不把全局目标塞入单个任务。
5. 不要求 OpenCode 自行重新定义需求。

---

## 6.2 Execution Loop

目标：让 OpenCode 按单个任务规约完成代码修改。

输入：

1. 当前 task 描述。
2. 相关文件范围。
3. 该 task 的局部 acceptance criteria。
4. 失败日志或测试输出。
5. 禁止修改的文件或模块边界。

执行者：

- OpenCode。

输出：

1. 代码修改。
2. 新增或更新的测试。
3. 本地验证结果。
4. 若失败，输出失败原因与下一步建议。

验收标准：

1. 修改范围没有越界。
2. verify commands 全部通过。
3. output files 存在且符合预期。
4. 没有破坏已有通过测试。
5. 每轮执行都有 run report。

---

## 6.3 Validation Loop

目标：让 Orchestrator 自动判断当前任务是否真正完成。

输入：

1. OpenCode 的任务输出。
2. 测试结果。
3. SVG 输出样例。
4. build 结果。
5. size / gzip 报告。
6. task acceptance criteria。

执行者：

- Orchestrator。

判断结果：

1. `pass`：进入下一任务。
2. `retry`：返回 OpenCode 修复。
3. `rollback`：撤销当前任务修改。
4. `blocked`：进入人工 review 或下一轮 Codex planning。

设计原则：

1. 决策完全依赖规约和机器可读结果。
2. 不依赖 Orchestrator 的主观判断。
3. 所有 gate 尽可能自动化。
4. 不确定是否通过时，默认不通过。

---

## 6.4 Test Extraction Loop

目标：从指定开源项目中抽取可用测试，并生成本项目可消费的 yml 测试文件。

测试来源：

1. `probelabs/maid`
2. `lukilabs/beautiful-mermaid`
3. `mermaid-js/mermaid`

输入：

1. 三个上游 repo 的测试文件。
2. 当前项目支持的 Mermaid 类型范围。
3. yml 测试 schema。

输出：

1. `./extract/run.js`
2. `./test/*.yml`
3. `extract/report.json`
4. `test/schema.yml` 或 `workflow/test-schema.yml`
5. skip list 与跳过原因。

验收标准：

1. 抽取脚本可以重复运行。
2. 输出的 yml 文件结构稳定。
3. 无效、过大、依赖浏览器私有行为的测试被跳过并记录原因。
4. `extract/report.json` 必须记录三个来源仓库的 scanned / candidate / accepted / skipped 统计。
5. `test/*.yml` 必须先通过 schema 校验。
6. 所有抽取出来的测试都能被本项目 test runner 读取。
7. 当前支持范围内的测试必须通过。

设计原则：

1. 抽取机制优先于覆盖数量。
2. 不追求一次性吃下 Mermaid.js 全量测试。
3. 跳过必须显式记录，不能静默丢弃。
4. 测试集既是验证工具，也是能力边界定义。

---

## 6.5 Mermaid Browser Render Integration Loop

目标：基于 Mermaid 官方浏览器端 API 建立 Mermaid source → SVG 的最小渲染闭环。

明确边界：

1. 不自研 Mermaid Parser。
2. 不自研 Mermaid layout engine。
3. 不使用服务端 Mermaid 转换。
4. 不接入第三方在线 Mermaid 转换服务。
5. 不用截图、canvas 或静态图片冒充渲染结果。

推荐优先展示和验证的图表类型：

1. Flowchart / graph。
2. Sequence diagram。
3. Class diagram。
4. State diagram。
5. ER diagram。
6. Pie chart。

最终支持范围由 Mermaid 官方浏览器端渲染能力与抽取测试集中实际可跑通的样例共同决定，不通过手写完整 allowlist 来人为限制。

输入：

1. yml 测试用例。
2. 当前浏览器端 render integration 代码。
3. 失败测试输出。
4. Mermaid 官方浏览器端 API 使用约束。

输出：

1. 可工作的 browser render integration。
2. SVG snapshot 或结构化断言结果。
3. supported capability matrix。
4. unsupported / skipped reason matrix。

验收标准：

1. 每次新增可展示能力都有对应测试或示例来源。
2. SVG 输出稳定。
3. 不允许为了通过单个 case 写不可泛化的硬编码逻辑。
4. 不支持的语法明确失败。
5. 转换路径保持最短。
6. 实现中不出现自研 parser 或 layout engine。

---

## 6.6 SVG Output Compatibility Loop

目标：确保生成的 SVG 在尺寸、`viewBox`、文本、连线、节点位置等方面具有稳定结构。

输入：

1. renderer 输出。
2. SVG validation rules。
3. snapshot 或结构断言。

输出：

1. normalized SVG。
2. SVG compatibility tests。
3. 错误输入输出规则。

验收标准：

1. SVG 包含合法根节点。
2. SVG 有合理 `viewBox`。
3. SVG 不依赖运行时 JS。
4. SVG 不包含不稳定随机 ID。
5. 同一输入多次运行输出一致。
6. 错误输入返回明确错误信息。

---

## 6.7 Web Demo Loop

目标：实现一个可部署的网页 demo，尽可能复用 `math.webc.site` 的设计风格。

页面功能：

1. 输入 Mermaid 文本。
2. 查看生成的 SVG。
3. 展示不同类型的 Mermaid 示例图。
4. 支持主题切换。
5. 展示 `beautiful-mermaid` 与本项目的体积 / gzip 对比柱状图。

输入：

1. demo 目录现有网页代码。
2. converter API。
3. 示例 Mermaid 文本。
4. 体积报告数据。

输出：

1. 可运行 demo 页面。
2. 示例图库。
3. 主题切换按钮。
4. SVG 对比柱状图。

验收标准：

1. 页面可以本地运行。
2. 输入变更后可以重新渲染。
3. 错误输入有清晰提示。
4. 页面风格与 `math.webc.site` 保持一致方向。
5. 不引入明显过重的前端依赖。

---

## 6.8 Theme / CSS Compatibility Loop

目标：支持使用 `beautiful-mermaid` 的 CSS 切换样式。

输入：

1. `beautiful-mermaid` CSS。
2. 当前 SVG class / style 输出。
3. demo 页面主题切换状态。

输出：

1. 主题 CSS 接入方式。
2. 主题切换 UI。
3. 至少两个可见主题示例。

验收标准：

1. 用户可以在页面上切换主题。
2. 切换后 SVG 样式明显变化。
3. 样式切换不破坏 SVG 布局。
4. 默认主题无需依赖外部 CDN。
5. 主题兼容不要求完全复制 `beautiful-mermaid` 内部实现。

---

## 6.9 Size / Gzip Comparison Loop

目标：在页面中展示本项目与 `beautiful-mermaid` 的 JS 体积 / gzip 体积对比，并明确该对比仅作为性能 proxy。

对比范围：

1. `beautiful-mermaid` CDN JS 文件大小。
2. `beautiful-mermaid` CDN JS gzip 大小。
3. 本项目打包后 JS 文件大小。
4. 本项目打包后 gzip 大小。

不比较：

1. 完整页面大小。
2. 图片资源。
3. CSS 资源，除非后续 spec 明确加入。
4. 运行时渲染速度。当前版本不设置 runtime benchmark gate；若后续加入，必须另起独立 spec。

输出：

1. `workflow/reports/size-report.json`。
2. gzip 统计结果。
3. demo 页面中的 SVG 柱状图。

验收标准：

1. 体积数据由脚本生成，不手写。
2. 页面柱状图使用 SVG，不引入重型图表库。
3. 对比口径必须在页面上说明。
4. 每次 build 后可以更新数据。
5. size report 与页面展示数据一致。
6. `beautiful-mermaid` CDN JS URL、版本或 commit 可追溯。
7. 本项目对比对象必须指向实际 build 输出中的目标 JS 产物。

---


## 6.10 I18N Integration Loop

目标：支持与 `math.webc.site` 一致或尽可能一致的七十多种语言国际化能力。

输入：

1. 原项目 i18n 配置。
2. 原项目语言列表。
3. Mermaid 页面新增文案。
4. demo 页面路由或 locale 机制。

输出：

1. Mermaid 页面 translation keys。
2. `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json`。
3. 多语言页面验证结果。

验收标准：

1. 语言列表与原项目一致或尽可能一致。
2. 新增 Mermaid 页面文案进入 i18n 系统。
3. 所有 locale 中都存在新增 key。
4. 翻译文本可以使用 fallback，但不能缺 key。
5. 多语言切换不破坏 Mermaid 输入、SVG 预览、主题切换和 size 图表。

---

## 6.11 Cloudflare Pages Deployment Loop

目标：将 demo 页面部署到 Cloudflare Pages。

输入：

1. demo build 输出。
2. Cloudflare Pages 配置。
3. deployment acceptance criteria。

输出：

1. 可访问的 preview 或 production 页面。
2. deployment log。
3. 最终部署说明。

验收标准：

1. build 命令通过。
2. Pages 部署成功。
3. 页面可以访问。
4. converter 功能在部署环境可用。
5. 静态资源路径正确。
6. 无明显 hydration 或 asset 404 问题。

---

## 6.12 Final Acceptance Loop

目标：确认整个项目可以提交。

输入：

1. 完整测试结果。
2. build 结果。
3. size / gzip 结果。
4. 最终 SVG 样例。
5. demo 页面访问结果。
6. README / 使用说明。
7. 项目 diff。

最终 gate：

1. 项目能正常安装和运行。
2. Mermaid 文本能成功转换为 SVG。
3. 抽取测试集中当前支持范围内的样例全部通过。
4. 错误输入有明确失败结果。
5. SVG 输出稳定。
6. 网页 demo 功能完整。
7. 主题切换可用。
8. 体积 / gzip 对比图可见且数据可追溯。
9. i18n 语言列表和新增 key 覆盖报告存在。
10. Cloudflare Pages 部署成功。
11. 代码变更范围合理。
12. 文档说明完整但不过度展开。

结果：

- 通过后进入最终提交。
- 不通过则回到对应 loop 修复。

---

## 7. 全项目任务步骤

## Step 1：Fork 与环境准备

目标：

1. fork 原项目。
2. 拉取本地开发环境。
3. 记录基础运行方式。
4. 确认现有测试和构建状态。

输出：

- baseline 状态报告。

---

## Step 2：Baseline Audit

目标：

1. 分析项目现有技术栈。
2. 找到最适合接入转换器的位置。
3. 确认是否已有 Mermaid、SVG、渲染相关依赖。
4. 确定最小改动路径。
5. 确认 demo 目录与 `math.webc.site` 风格复用方式。

输出：

1. repo audit 报告。
2. 建议接入点。
3. demo 接入建议。

---

## Step 3：Dev Workflow 固化

目标：

1. 固化 spec、acceptance criteria、task graph schema 和 orchestrator 状态模型。
2. 明确 Codex、OpenCode、Orchestrator 的边界。
3. 建立 run report 和 final report 规范。
4. 将测试抽取、浏览器端渲染接入、demo、主题、size / gzip 对比、i18n 和部署纳入统一任务拓扑。

输出：

1. `workflow/spec.md`
2. `workflow/acceptance-criteria.md`
3. `workflow/tasks.yml`
4. `workflow/state.json`
5. `workflow/test-schema.yml` 或 `test/schema.yml` 模板。
6. `workflow/reports/size-report.json` 模板。
7. `workflow/reports/i18n-report.json` 模板。
8. `workflow/reports/final-report.md` 模板。

验收标准：

1. task graph schema 明确。
2. 状态机明确。
3. retry / blocked / manual review 规则明确。
4. 每个 loop 有输入、输出和 gate。
5. workflow 能被人工 review 后直接交给 Codex / OpenCode 执行。

---

## Step 4：Test Extraction

目标：

1. 从指定三个 repo 抽取可用测试。
2. 生成 `./extract/run.js`。
3. 生成 `./test/*.yml`。
4. 固化测试 schema。
5. 明确 skip 规则和 skip 报告。

输出：

1. 抽取脚本。
2. yml 测试集。
3. extraction report。

---

## Step 5：Requirement Spec Finalization

目标：

1. 明确支持的 Mermaid 输入范围。
2. 明确 SVG 输出要求。
3. 明确错误处理要求。
4. 明确页面 demo 要求。
5. 明确体积对比要求。
6. 明确部署要求。

输出：

- final acceptance spec。

---

## Step 6：Codex 任务拆解

目标：

1. 将项目拆成任务 DAG。
2. 标注任务依赖。
3. 为每个任务写清验收条件。
4. 控制任务粒度，避免 OpenCode 一次处理过多内容。

输出：

1. task plan。
2. task queue。
3. allowed / blocked file boundaries。

---

## Step 7：核心转换器实现

目标：

1. 基于 Mermaid 官方浏览器端 API 建立 Mermaid 输入到 SVG 输出的最小闭环。
2. 保证成功路径可运行。
3. 保证错误路径可返回。
4. 优先满足抽取测试集中的高频基础样例。

输出：

1. browser render integration。
2. basic conversion tests。
3. supported capability matrix。

---

## Step 8：SVG 输出规范化

目标：

1. 保证 SVG 输出结构稳定。
2. 清理不必要或不安全内容。
3. 保证输出可被前端直接使用。

输出：

1. normalized SVG output。
2. SVG validation tests。

---

## Step 9：Web Demo 集成

目标：

1. 将转换器接入 demo 页面。
2. 支持 Mermaid 输入和 SVG 预览。
3. 展示不同类型的 Mermaid 示例图。
4. 复用 `math.webc.site` 的视觉风格。

输出：

1. demo page。
2. example gallery。
3. error display UI。

---

## Step 10：Theme / CSS 集成

目标：

1. 支持 `beautiful-mermaid` CSS 样式切换。
2. 在网页上提供主题切换按钮。
3. 保证切换样式不破坏 SVG 布局。

输出：

1. theme switcher。
2. theme CSS integration。
3. theme compatibility tests 或 manual checklist。

---

## Step 11：Size / Gzip 对比

目标：

1. 获取 `beautiful-mermaid` CDN JS size 和 gzip size。
2. 获取本项目 build 后 JS size 和 gzip size。
3. 生成 size report。
4. 在网页中用 SVG 柱状图展示对比。

输出：

1. `workflow/reports/size-report.json`。
2. gzip 统计结果。
3. SVG bar chart。

---


## Step 12：I18N 国际化接入

目标：

1. 复用或对齐 `math.webc.site` 的七十多种语言机制。
2. 将 Mermaid 页面新增文案接入 i18n 系统。
3. 生成语言列表与新增 key 覆盖报告。
4. 验证多语言页面下核心功能可用。

输出：

1. Mermaid 页面 translation keys。
2. `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json`。
3. i18n verification report。

---

## Step 13：Cloudflare Pages 部署

目标：

1. 配置 Cloudflare Pages build。
2. 部署网页 demo。
3. 验证部署环境下转换器、示例图、主题切换、体积对比图和国际化能力可用。

输出：

1. deployment log。
2. preview / production URL。
3. deployment verification report。

---

## Step 14：最终验收与提交

目标：

1. 跑完整测试。
2. 跑完整 build。
3. 生成最终 size / gzip 报告。
4. 生成或更新 i18n report。
5. 检查最终 diff。
6. 完成最小必要文档。
7. 准备提交说明。

输出：

1. final acceptance report。
2. final submission。

---

## 8. Orchestrator 状态机

每个 task 的基础状态转换：

```text
pending
  ↓
running
  ↓
passed
```

失败路径：

```text
running
  ↓
failed
  ↓
retrying
  ↓
running
```

阻塞路径：

```text
failed
  ↓
blocked
  ↓
manual_review
```

进入 `passed` 的条件：

1. OpenCode 执行完成。
2. output files 存在。
3. verify commands 全部通过。
4. acceptance checklist 对应项通过。
5. 没有修改 blocked files。
6. 没有引入新的全局失败。

进入 `blocked` 的条件：

1. 达到最大 retry 次数。
2. 失败原因超出当前 task 范围。
3. OpenCode 修改了禁止修改的文件。
4. 测试失败无法通过局部修复解决。
5. acceptance criteria 与当前实现目标冲突。

---

## 9. 验收门设计

## Gate 1：Workflow Gate

检查：

1. `workflow/spec.md` 存在。
2. `workflow/acceptance-criteria.md` 存在。
3. `workflow/tasks.yml` schema 明确。
4. `workflow/state.json` 状态模型明确。
5. run report / final report 模板存在。

---

## Gate 2：Extraction Gate

检查：

1. `./extract/run.js` 存在。
2. `./test/*.yml` 存在。
3. 测试 yml schema 合法。
4. 抽取脚本可重复运行。
5. 跳过测试有记录。

---

## Gate 3：Browser Render Gate

检查：

1. 所有当前支持范围内测试通过。
2. 不支持语法有明确错误。
3. SVG 输出稳定。
4. 无明显 runtime crash。

---

## Gate 4：Demo Gate

检查：

1. 页面可本地运行。
2. 输入、渲染、错误提示可用。
3. 示例图可展示。
4. 主题切换可用。
5. 体积对比图可见。

---

## Gate 5：Size / Gzip Gate

检查：

1. 本项目 bundle size 可生成。
2. gzip size 可生成。
3. `beautiful-mermaid` CDN size 可生成。
4. 页面展示的数据与报告一致。

---


## Gate 6：I18N Gate

检查：

1. `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json` 存在。
2. 语言列表与原项目一致或尽可能一致。
3. Mermaid 页面新增文案都有 translation key。
4. 所有 locale 中都存在新增 key。
5. 多语言页面下输入、预览、主题切换和 size 图表可用。

---

## Gate 7：Deployment Gate

检查：

1. Cloudflare Pages build 通过。
2. 部署页面可访问。
3. 静态资源路径正确。
4. demo 功能在部署环境可用。

---

## Gate 8：Final Acceptance Gate

检查：

1. spec 中所有必须项完成。
2. acceptance criteria 全部勾选。
3. 所有测试通过。
4. 最终报告生成。
5. 无遗留 blocked task，或 blocked task 已明确标注为非必须项。

---

## 10. Retry 策略

每个 task 最多允许 3 次自动 retry。

第 1 次 retry：

- 使用原 task + 完整失败日志。

第 2 次 retry：

- 只给 OpenCode 当前失败测试、相关文件和最小上下文。

第 3 次 retry：

- 要求 OpenCode 只做最小修复，不做重构。

超过 3 次后进入 `blocked`，由 Codex 在下一轮 planning 中重新拆解，或进入人工 review。

---

## 11. Run Report 规范

每次 OpenCode 执行后，Orchestrator 应生成一份 run report。

内容包括：

```text
run id
task id
task title
start time
end time
changed files
verify commands
test result
build result
size result
status
failure reason
next action
```

作用：

1. 作为 Orchestrator 决策依据。
2. 作为 Codex 下一轮拆解输入。
3. 作为人工 review 的审计材料。
4. 防止开发过程变成不可追踪的黑箱。

---

## 12. Final Report 规范

最终报告应面向项目 review，而不是面向开发过程。

内容包括：

1. 已完成需求列表。
2. 未完成或降级处理的需求。
3. 测试覆盖来源。
4. 支持的 Mermaid 类型。
5. 不支持的 Mermaid 类型。
6. 体积与 gzip 对比结果。
7. demo 页面访问方式。
8. Cloudflare Pages 部署状态。
9. 主要技术取舍。
10. 后续可优化方向。

---

## 13. 人工 Review 节点

人工只介入关键判断，不参与重复执行。

需要人工 review 的节点：

1. Spec / acceptance criteria 确认。
2. 测试抽取范围确认。
3. Codex 任务 DAG 确认。
4. 核心转换器接入点确认。
5. 页面 demo 风格方向确认。
6. 主题兼容口径确认。
7. size / gzip 对比口径确认。
8. i18n 语言列表与 fallback 策略确认。
9. Cloudflare Pages 部署方式确认。
10. final diff 确认。

不需要人工介入的节点：

1. 单任务执行。
2. 普通测试失败修复。
3. 局部 retry。
4. build 重跑。
5. size report 重跑。
6. 常规文档更新。

---

## 14. 最终架构原则

1. 先锁定 spec 和 acceptance criteria。
2. 转换能力必须基于 Mermaid 官方浏览器端 API，不自研 parser 或 layout engine。
2. 再建立可重复的测试抽取机制。
3. 再实现最小可运行转换闭环。
4. 然后稳定 SVG 输出。
5. 然后集成网页 demo。
6. 然后实现主题兼容和体积对比。
7. 最后做 Cloudflare Pages 部署和最终验收。
9. Codex 只负责复杂拆解。
10. OpenCode 负责执行和局部自验证。
11. Orchestrator 只基于规约和机器结果决策。
12. 所有 loop 都必须有明确输入、输出和 gate。
13. 不做与 `mermaid → svg` 无关的扩展。
14. 不为了自动化而增加不必要复杂度。
15. 不以 Mermaid.js 全量兼容为目标，而以抽取测试集和 acceptance criteria 通过为目标。
16. 最终交付以稳定、快速、可验证、可部署为第一优先级。

---

## 15. Review 重点

建议本轮重点 review 以下问题：

1. Step3 是否应该作为独立的 workflow 固化步骤，而不是继续叫 Minimal Test Dataset Definition。
2. 测试抽取是否应放在核心转换器实现之前。
3. Codex 是否只做任务拆解，不参与验证。
4. Orchestrator 是否保持完全 deterministic，不调用 LLM。
5. `beautiful-mermaid` 对比口径是否只比较 JS raw size 和 gzip size，并作为性能 proxy。
6. i18n 语言列表和新增 key 覆盖是否足以对齐 `math.webc.site`。
7. Cloudflare Pages 部署是否作为必须验收项。
8. Mermaid 支持范围是否接受以抽取测试集和能力矩阵逐步定义，而不是一开始承诺全量兼容。
