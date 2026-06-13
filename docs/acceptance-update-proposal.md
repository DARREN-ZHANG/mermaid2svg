# Acceptance Criteria Update Proposal

> Phase 6 产物。基于实际参考仓库挖掘和最小测试抽取结果，对 `../docs/acceptance-criteria.md` 提出的更新建议。
> 本文件仅为提案，不直接修改 canonical acceptance criteria。需经 Human Gate 确认后由人工更新。

---

## 1. 提议的验收标准补充

### AC-EXTRACT-008：抽取报告字段完整性

**现状**：当前 `extract/report.json` 的 `skippedSamples` 数组仅包含候选元数据（id/sourceRepo/sourcePath/type/priority/classification/reason），不包含完整 input 和 reason（候选说明文本）。

**提议**：

- `extract/report.json` 的 `skippedSamples` 每条至少包含：`id`、`sourceRepo`、`sourcePath`、`type`、`reason`（跳过原因分类）
- `extract/report.json` 的 `byDiagramType` 需按 diagram type 聚合 accepted/skipped 数量
- 若某个来源仓库 accepted 数量为 0，必须在报告中说明原因（当前三仓库均有 accepted，此项暂不触发）

**验收方式**：

- 执行 `./extract/run.js`
- 检查 `extract/report.json` 可解析
- 检查三个来源仓库均出现在 `sources` 中
- 检查 `byDiagramType` 覆盖全部出现的 diagram type
- 检查 `skipReasons` 总数与 `totalSkipped` 一致

---

### AC-EXTRACT-009：source URL 可追溯性

**现状**：当前全部 18 条测试的 `source.url` 字段为 `null`。

**提议**：

- 每条 `test/*.yml` 的 `source.url` 应指向可追溯的源文件 URL
- maid 来源：`https://github.com/probelabs/maid/blob/<commit>/<path>`
- beautiful-mermaid 来源：`https://github.com/lukilabs/beautiful-mermaid/blob/<commit>/<path>`
- mermaid 来源：`https://github.com/mermaid-js/mermaid/blob/<commit>/<path>`
- commit hash 需在抽取脚本中记录或从 `references/` 的 git log 读取

**验收方式**：

- 检查 `test/*.yml` 中 `source.url` 不为 null
- 检查 URL 格式正确且指向真实文件

**优先级**：非 MVP 阻断项，可在 Render Loop 前补全。

---

### AC-EXTRACT-010：抽取脚本幂等性

**现状**：`extract/run.js` 已验证幂等（每次运行先清理旧测试再重新生成）。

**提议**：

- 抽取脚本必须可重复运行且产生一致的输出
- 不得在重复运行中产生不同的测试集（除非候选清单 `docs/init/test-candidates.json` 有更新）
- 脚本清理范围仅限 `test/*.yml`（排除 `schema.yml` 和 `case/`），不得删除上游 MathML 测试

**验收方式**：

- 连续执行 `./extract/run.js` 两次
- 对比两次输出的 `test/*.yml` 文件列表和内容一致

---

### AC-RENDER-001：MVP 支持范围内的测试全部通过

**现状**：18 条 YAML 测试已生成，但尚无测试运行器执行。

**提议**：

- 所有 `skip.enabled === false` 的 `test/*.yml` 必须通过渲染测试
- 渲染测试需验证：
  1. Mermaid 输入可被 Mermaid 浏览器端 API 处理
  2. 输出为合法 SVG（有 `<svg>` 根节点）
  3. SVG 包含 `viewBox` 属性
  4. 若 `expect.svg.containsText` 非空，SVG 中应包含指定文本片段
- 不允许通过删除失败测试来制造通过结果
- 测试失败时必须暴露真实错误信息

**验收方式**：

- 执行测试命令
- 确认全部 18 条非 skip 测试通过
- 检查测试报告中无隐藏的失败

---

### AC-RENDER-002：错误输入处理

**现状**：spec 第 4.3 节定义了错误处理要求，但当前无对应的验收项。

**提议补充验收项**：

- 空输入时：不执行渲染，不输出 SVG，页面不崩溃，显示空状态提示
- 非法 Mermaid 语法时：页面不崩溃，不输出错误 SVG，显示可见错误提示
- 从错误输入切换回合法输入后：恢复正常渲染

**验收方式**：

- 构造空输入测试用例
- 构造非法语法测试用例（如 `invalid syntax {{{`)
- 验证错误提示可见
- 切换回合法输入，验证恢复正常

---

### AC-TEST-001：测试运行器可被 CI 调用

**现状**：`test.sh` 存在但尚未包含 Mermaid 测试执行。

**提议**：

- `test.sh` 或独立命令应能执行 `test/*.yml` 中定义的 Mermaid 渲染测试
- 测试命令应能被 CI 环境调用
- 测试命令退出码应反映测试结果（0=全部通过，非0=有失败）
- 测试命令应在 schema 校验失败时以非 0 退出

**验收方式**：

- 执行测试命令
- 检查退出码
- 故意破坏一条 YAML 的 schema，验证测试在 schema 校验阶段失败

---

## 2. 已生成测试数量和必需覆盖

### 2.1 当前测试数量

| 指标                             | 数量 |
| -------------------------------- | ---- |
| 已生成 YAML 测试                 | 18   |
| skip.enabled = false（预期执行） | 18   |
| skip.enabled = true（预期跳过）  | 0    |
| 覆盖 diagram type                | 8    |
| 覆盖来源仓库                     | 3/3  |

### 2.2 必需覆盖矩阵

以下为 MVP 阶段必须覆盖的 diagram type 及其最小测试数要求：

| diagram type         | 最小测试数 | 实际测试数 | 状态     |
| -------------------- | ---------- | ---------- | -------- |
| flowchart / graph    | ≥ 3        | 5          | PASS     |
| sequenceDiagram      | ≥ 1        | 3          | PASS     |
| classDiagram         | ≥ 1        | 2          | PASS     |
| stateDiagram (-v2)   | ≥ 1        | 2          | PASS     |
| erDiagram            | ≥ 1        | 2          | PASS     |
| pie                  | ≥ 1        | 2          | PASS     |
| gantt                | ≥ 1        | 1          | PASS     |
| other (xychart-beta) | ≥ 1        | 1          | PASS     |
| **总计**             | **≥ 10**   | **18**     | **PASS** |

### 2.3 来源多样性要求

| 来源仓库                   | 最小入选数 | 实际入选数 | 状态 |
| -------------------------- | ---------- | ---------- | ---- |
| probelabs/maid             | ≥ 1        | 7          | PASS |
| lukilabs/beautiful-mermaid | ≥ 1        | 7          | PASS |
| mermaid-js/mermaid         | ≥ 1        | 4          | PASS |

### 2.4 测试集扩展路径

当前 18 条为初始化阶段的最小信号测试集。后续阶段建议扩展路径：

1. **Render Loop 完成后**：将 `useful_later` 中 P0/P1 候选逐步纳入，目标扩至 30-40 条
2. **SVG Output Loop 完成后**：补充 SVG 结构稳定性断言（viewBox、containsText）
3. **Web Demo Loop 完成后**：确保 demo 展示的示例图与测试集一致

扩展时必须遵守：新纳入的测试必须能跑通，不得通过 skip 掩盖失败。

---

## 3. 测试 Schema 期望

### 3.1 当前 Schema

`test/schema.yml` 已定义以下结构：

```yaml
type: object
required: [id, source, diagram, input, expect, skip]
properties:
  id: string
  source:
    type: object
    required: [repo, path, url]
    properties:
      repo: string
      path: string
      url: [string, "null"]
  diagram:
    type: object
    required: [type, title]
    properties:
      type: string
      title: [string, "null"]
  input:
    type: object
    required: [mermaid]
    properties:
      mermaid: string
  expect:
    type: object
    required: [render, svg]
    properties:
      render: boolean
      svg:
        type: object
        required: [root, viewBox, containsText]
        properties:
          root: boolean
          viewBox: boolean
          containsText: string[]
  skip:
    type: object
    required: [enabled, reason]
    properties:
      enabled: boolean
      reason: [string, "null"]
```

### 3.2 Schema 校验规则

- 每个 `test/*.yml` 必须先通过 schema 校验，再进入渲染测试
- schema 校验失败时，测试 runner 应在该阶段失败并报告缺失字段
- 故意构造缺字段 YAML 时，测试 runner 必须在 schema 校验阶段失败

### 3.3 Schema 扩展建议（后续阶段）

当前 schema 已满足 spec 第 3.6 节要求。后续可考虑扩展：

- `expect.svg.dimensions`：SVG 宽高属性断言
- `expect.svg.stableId`：SVG 中是否包含不稳定随机 ID 断言
- `expect.timeout`：渲染超时阈值
- `tags`：测试标签（如 smoke/regression/edge-case），便于选择性运行

这些扩展不阻断 MVP，可在 SVG Output Loop 阶段补充。

---

## 4. unsupported_candidate 处理规则

### 4.1 定义

`unsupported_candidate` 是指语法正确但因以下原因暂不纳入测试集的候选：

- 实验性图表类型（beta 标记）
- 布局引擎确定性风险（浮点坐标、力导向种子依赖）
- 支持矩阵未知或上游不稳定

### 4.2 当前 unsupported_candidate（4 个）

| ID           | type              | 风险说明                                     |
| ------------ | ----------------- | -------------------------------------------- |
| mm-other-020 | sankey-beta       | d3-sankey 迭代布局，浮点坐标像素舍入不确定性 |
| mm-other-021 | block-beta        | 较新实验性外部图表，带自有布局求解器         |
| mm-other-022 | architecture-beta | 实验性，fcose 力导向布局种子依赖             |
| mm-other-023 | packet            | 较新实验性外部图表，支持矩阵未知             |

### 4.3 处理规则

1. **不得静默丢弃**：unsupported_candidate 必须在 `extract/report.json` 的 `skippedSamples` 中显式记录，reason 为 `classification_unsupported_candidate`
2. **不得标记为 skip**：unsupported_candidate 不生成 `test/*.yml` 文件，因此不进入测试集（区别于 `skip.enabled = true` 的测试，后者生成文件但不执行）
3. **保留在候选清单中**：unsupported_candidate 保留在 `docs/init/test-candidates.json` 中，不删除
4. **可升级路径**：后续 Render Loop 若实测可稳定渲染，可由该 loop 决定将 classification 从 `unsupported_candidate` 提升为 `minimal_core`，并重新运行 `extract/run.js` 纳入测试集
5. **降级保护**：若 Render Loop 实测发现某个 `minimal_core` 候选实际无法稳定渲染，应将其降级为 `unsupported_candidate` 或 `useful_later`，并记录原因，不得直接删除

### 4.4 审计修正记录

参考仓库审计指出这 4 类在 mermaid 上游均有像素快照基线，保守分类的依据偏弱：

- **sankey**：d3-sankey 对相同输入收敛到一致布局，浮点仅影响像素差异，不影响 SVG 结构有效性
- **block / packet**：上游已快照化，确定性"已验证"
- **architecture**：内置图标为本地注册（非网络 fetch），真正风险是 fcose 种子

**处置**：保持保守分类不变，但在后续 Render Loop 中优先实测这 4 类，以证据驱动决策。

---

## 5. 上游派生测试删除保护规则

### 5.1 受保护的上游测试

以下测试属于上游 MathML 项目，**严禁删除或修改**：

| 位置              | 说明                                            |
| ----------------- | ----------------------------------------------- |
| `test/case/*.yml` | 上游 MathML 测试用例                            |
| `test/schema.yml` | 当前 schema（由 `extract/run.js` 生成，非上游） |

### 5.2 删除保护规则

1. **不得删除 `test/case/*.yml`**：这些是上游 MathML 测试，与 Mermaid 无关但属于上游项目资产
2. **不得在抽取脚本中清理 `test/case/`**：`extract/run.js` 的清理范围必须排除 `case/` 目录（当前已实现）
3. **不得删除 `test/schema.yml`**：schema 文件由抽取脚本管理，但不属于"上游派生"——它是项目自身的 schema 定义
4. **若需移除上游测试**：必须经过 Human Gate 确认，并在 `docs/init/remove-candidates.md` 中记录原因

### 5.3 抽取脚本清理范围验证

`extract/run.js` 的清理逻辑应满足：

- 清理 `test/*.yml`（不含子目录）
- 保留 `test/schema.yml`
- 保留 `test/case/` 目录及其下所有文件

**验收方式**：

- 在 `test/case/` 中放置标记文件
- 运行 `./extract/run.js`
- 确认标记文件仍然存在

---

## 6. 正式任务分解的就绪定义

### 6.1 当前阶段产出清单

以下产出已就绪，可作为正式任务分解（Codex Task Decomposition）的输入：

| 产出             | 位置                                 | 状态                |
| ---------------- | ------------------------------------ | ------------------- |
| 项目盘点         | `docs/init/project-inventory.md`     | 已完成              |
| 保留清单         | `docs/init/preserve-list.md`         | 已完成              |
| 移除候选清单     | `docs/init/remove-candidates.md`     | 已完成              |
| 清理风险评估     | `docs/init/cleanup-risk.md`          | 已完成              |
| 清理执行计划     | `docs/init/cleanup-plan.md`          | 已完成              |
| 清理执行记录     | `docs/init/cleanup-execution.md`     | 已完成              |
| 参考仓库挖掘清单 | `docs/init/reference-inventory.md`   | 已完成              |
| 测试候选数据     | `docs/init/test-candidates.json`     | 已完成（127 候选）  |
| 测试清单         | `docs/test-inventory.md`             | 已完成（18 条）     |
| 抽取脚本         | `extract/run.js`                     | 已完成              |
| 抽取报告         | `extract/report.json`                | 已完成              |
| 测试 Schema      | `test/schema.yml`                    | 已完成              |
| 测试文件         | `test/*.yml`                         | 已完成（18 个文件） |
| Spec 更新提案    | `docs/spec-update-proposal.md`       | 当前文件            |
| 验收标准更新提案 | `docs/acceptance-update-proposal.md` | 当前文件            |

### 6.2 就绪条件

正式任务分解可在以下条件满足后启动：

#### 必须满足（全部为是）

- [x] 参考仓库挖掘完成（3 个仓库，127 候选）
- [x] 抽取脚本可执行且幂等
- [x] `test/*.yml` 成功生成（18 条）
- [x] `test/schema.yml` 存在且覆盖必需字段
- [x] `extract/report.json` 存在且可解析
- [x] 三个来源仓库均有 accepted 测试
- [x] 候选清单已分类（minimal_core / useful_later / unsupported_candidate）
- [x] Spec 更新提案已撰写
- [x] 验收标准更新提案已撰写

#### Human Gate 决策状态

- [x] HG-1：MVP 支持边界确认（8 种类型）
- [x] HG-2：测试配额策略确认（18 条）
- [x] HG-3：测试环境 DOM 方案确认（Playwright 仅作为真实浏览器 test harness；SVG string/DOM 为主断言）
- [x] HG-4：beautiful-mermaid 对比口径确认
- [x] HG-5：i18n 语言列表对齐确认
- [x] HG-6：Cloudflare Pages 部署方式确认
- [x] HG-7：extract/run.js 后续扩展方案确认

**说明**：以上 Human Gate 已确认，最新权威记录见 `workflow/human-gate-decisions.md`。剩余 loop 可按 `workflow/loop-execution-order.md` 顺序连续执行。

### 6.3 建议的任务分解顺序

基于 architecture 文档的任务拓扑和当前产出，建议的后续任务分解顺序：

```
[已完成] S0. Repo Baseline Snapshot
[已完成] S1. Spec Lock (canonical docs 不变)
[已完成] S2-S3. Init Loop (inventory + cleanup + extraction)
[当前]   S4. Spec Feedback (本提案)
  ↓
[待启动] Codex Task Decomposition
  ↓
L1. Test Runner Implementation (依赖 HG-3)
  ↓
L2. Mermaid Browser Render Integration
  ↓
L3. SVG Output Normalization
  ↓
L4. Web Demo Integration
  ↓
L5. Theme / CSS Compatibility (依赖 HG-4)
  ↓
L6. Size / Gzip Comparison (依赖 HG-4)
  ↓
L7. I18N Integration (依赖 HG-5)
  ↓
L8. Cloudflare Pages Deployment (依赖 HG-6)
  ↓
S5. Final Acceptance Audit
```

### 6.4 任务分解输入文件

Codex 进行任务分解时应读取以下文件作为输入：

| 文件                                  | 用途                         |
| ------------------------------------- | ---------------------------- |
| `../docs/mermaid-svg-spec.md`         | 项目需求冻结版本             |
| `../docs/acceptance-criteria.md`      | 验收门来源                   |
| `../docs/mermaid-svg-architecture.md` | 技术架构和 loop 设计         |
| `docs/spec-update-proposal.md`        | 基于实际挖掘的 spec 调整建议 |
| `docs/acceptance-update-proposal.md`  | 基于实际抽取的验收标准补充   |
| `docs/init/test-candidates.json`      | 完整候选清单（127 条）       |
| `docs/test-inventory.md`              | 已入选测试清单（18 条）      |
| `docs/init/reference-inventory.md`    | 参考仓库特征和抽取启示       |
| `docs/init/project-inventory.md`      | 项目结构和受保护文件         |
| `docs/init/preserve-list.md`          | 保留清单                     |
| `docs/init/remove-candidates.md`      | 移除候选清单                 |

---

## 7. 与 canonical acceptance-criteria 的差异说明

本提案**不修改** `../docs/acceptance-criteria.md`。以下为提案与当前 acceptance criteria 的主要差异点：

1. **AC-EXTRACT 系列**：当前 acceptance criteria 已定义 AC-EXTRACT-001 至 AC-EXTRACT-007，全部由当前产出满足。本提案补充 AC-EXTRACT-008（报告字段完整性）、AC-EXTRACT-009（source URL 可追溯性）、AC-EXTRACT-010（脚本幂等性）。
2. **AC-RENDER 系列**：当前 acceptance criteria 未定义渲染层验收项（AC-UI 系列覆盖 UI 层但未覆盖渲染测试执行）。本提案补充 AC-RENDER-001（MVP 测试全通过）和 AC-RENDER-002（错误输入处理）。
3. **AC-TEST 系列**：当前 acceptance criteria 的 AC-BUILD-002 覆盖测试命令可运行，但未明确 schema 校验前置要求。本提案补充 AC-TEST-001 细化测试运行器的 CI 调用要求。
4. **unsupported_candidate 处理**：当前 acceptance criteria 的 AC-EXTRACT-004 提到"过滤明显不可用样例"，但未定义 `unsupported_candidate` 分类规则。本提案第 4 节补充此规则。
5. **上游测试保护**：当前 acceptance criteria 未明确禁止删除 `test/case/*.yml`。本提案第 5 节补充此保护规则。
