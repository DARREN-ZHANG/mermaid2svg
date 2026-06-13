# Spec Update Proposal

> Phase 6 产物。基于实际参考仓库挖掘和最小测试抽取结果，对 `../docs/mermaid-svg-spec.md` 提出的更新建议。
> 本文件仅为提案，不直接修改 canonical spec。需经 Human Gate 确认后由人工更新。

---

## 1. 参考仓库分析结果

### 1.1 已分析的仓库

| 仓库                         | 本地路径                       | scanned files | candidates | accepted | skipped |
| ---------------------------- | ------------------------------ | ------------- | ---------- | -------- | ------- |
| `probelabs/maid`             | `references/maid`              | 211           | 25         | 7        | 18      |
| `lukilabs/beautiful-mermaid` | `references/beautiful-mermaid` | 24            | 25         | 7        | 18      |
| `mermaid-js/mermaid`         | `references/mermaid`           | 271           | 77         | 4        | 73      |
| **合计**                     |                                | **506**       | **127**    | **18**   | **109** |

三个仓库均已完成本地 clone 并由抽取脚本读取本地源码，符合 spec 第 3 节要求。

### 1.2 仓库特征摘要

- **probelabs/maid**：最规整的单一来源，`test-fixtures/` 下按类型组织的 `.mmd` 文件路径清晰。覆盖 6 种 diagram type（flowchart/sequence/class/state/pie/gantt），无 erDiagram。maid 源仓库标记 gantt/journey 为 "unsupported" 仅针对其 linter，对 Mermaid 浏览器渲染仍是合法输入。
- **lukilabs/beautiful-mermaid**：全部候选来自单一文件 `samples-data.ts`（85 条结构化 `Sample[]`）。覆盖 6 种类型（flowchart/state/sequence/class/er/xychart），无 pie/gantt/journey。仅实现 stateDiagram-v2 变体（无 v1）。
- **mermaid-js/mermaid**：候选最大的来源（77 个）。需混合策略提取——解析 `.spec.*` 中嵌入字符串、`demos/*.html` 中 `<pre class="mermaid">` 块、`cypress/platform/dev-diagrams/layout-tests/*.mmd` 独立文件。覆盖全部 diagram type。

### 1.3 抽取脚本可重复性

`extract/run.js` 已验证幂等：每次运行先清理旧 `test/*.yml`（保留 `schema.yml` 和 `case/`），再重新生成全部产物。脚本仅从本地 `references/` 读取，无网络依赖。

---

## 2. 实际发现的测试分类

### 2.1 候选按 diagram type 分布

| type            | 候选数  | accepted | 来源覆盖                           |
| --------------- | ------- | -------- | ---------------------------------- |
| flowchart       | 41      | 5        | maid + beautiful-mermaid + mermaid |
| sequenceDiagram | 22      | 3        | maid + beautiful-mermaid + mermaid |
| stateDiagram    | 16      | 2        | maid + beautiful-mermaid + mermaid |
| classDiagram    | 14      | 2        | maid + beautiful-mermaid + mermaid |
| erDiagram       | 8       | 2        | beautiful-mermaid + mermaid        |
| gantt           | 4       | 1        | maid + mermaid                     |
| pie             | 4       | 2        | maid + mermaid                     |
| other           | 18      | 1        | beautiful-mermaid + mermaid        |
| **合计**        | **127** | **18**   | **3/3**                            |

### 2.2 候选按 classification 分布

| classification               | 数量 | 说明                                              |
| ---------------------------- | ---- | ------------------------------------------------- |
| minimal_core                 | 101  | 当前项目预期能稳定渲染的核心样例                  |
| useful_later                 | 22   | 语法正确但偏大/边缘/专业化，留待 Render Loop 验证 |
| unsupported_candidate        | 4    | 实验性图表类型，确定性或依赖风险                  |
| invalid_or_non_deterministic | 0    | 无故意损坏输入（已排除 maid 的 invalid/ 固件）    |

### 2.3 "other" 类型的详细构成

18 个 other 候选覆盖以下子类型：

| 子类型                 | 候选数 | accepted   | 说明                              |
| ---------------------- | ------ | ---------- | --------------------------------- |
| journey                | 1      | 0          | 用户旅程图                        |
| gitGraph               | 2      | 0          | Git 分支图                        |
| mindmap                | 2      | 0          | 思维导图                          |
| timeline               | 2      | 0          | 时间轴                            |
| quadrantChart          | 1      | 0          | 象限图                            |
| xychart / xychart-beta | 2      | 1 (bm-020) | XY 坐标图                         |
| requirementDiagram     | 1      | 0          | 需求图                            |
| C4 (Context/Container) | 2      | 0          | C4 架构图                         |
| sankey-beta            | 1      | 0          | 桑基图（unsupported_candidate）   |
| block-beta             | 1      | 0          | 块图（unsupported_candidate）     |
| architecture-beta      | 1      | 0          | 架构图（unsupported_candidate）   |
| packet                 | 1      | 0          | 数据包图（unsupported_candidate） |

---

## 3. 提议的 MVP 支持边界

### 3.1 核心 MVP 支持（必须有对应通过的测试）

基于 18 条已入选测试的实际覆盖，建议 MVP 支持范围：

| diagram type      | 推荐支持 | 已入选测试数 | 来源数 | 覆盖语法维度                      |
| ----------------- | -------- | ------------ | ------ | --------------------------------- |
| flowchart / graph | 核心     | 5            | 3      | 基本节点/边、标签边、分支、子图   |
| sequenceDiagram   | 核心     | 3            | 3      | participant、消息、返回、基本箭头 |
| classDiagram      | 核心     | 2            | 2      | 类成员、可见性、关系箭头          |
| stateDiagram-v2   | 核心     | 2            | 2      | 状态转换、起止标记 `[*]`          |
| erDiagram         | 核心     | 2            | 2      | 关系基数、实体属性、键标记        |
| pie               | 核心     | 2            | 2      | 标题、切片值                      |

### 3.2 扩展 MVP 支持（至少各 1 条测试通过）

| diagram type | 推荐支持 | 已入选测试数 | 说明                        |
| ------------ | -------- | ------------ | --------------------------- |
| gantt        | 扩展     | 1            | dateFormat/section/任务状态 |
| xychart-beta | 扩展     | 1            | bar 系列基础渲染            |

### 3.3 选取规则

当前 18 条测试使用**按类型配额 + 来源轮询**策略选取：

1. 仅接受 `minimal_core` 分类候选
2. 每种 diagram type 按配额上限选取（flowchart=5, sequenceDiagram=3 等）
3. 同优先级内交替从不同来源仓库取候选，确保来源多样性
4. 优先级 P0 > P1 > P2
5. 总计 18 条，平衡覆盖广度与人工 review 成本

---

## 4. MVP 明确不支持的语法

### 4.1 unsupported_candidate（4 种实验性图表类型）

以下类型因确定性风险或实验性状态，在 MVP 中明确不支持：

| 类型              | 候选 ID      | 排除原因                                                                 |
| ----------------- | ------------ | ------------------------------------------------------------------------ |
| sankey-beta       | mm-other-020 | d3-sankey 迭代布局，浮点坐标可能引入像素舍入不确定性                     |
| block-beta        | mm-other-021 | 较新实验性外部图表，带自有布局求解器，确定性待验证                       |
| architecture-beta | mm-other-022 | 实验性，fcose 力导向布局种子依赖（审计修正：图标为本地注册非网络 fetch） |
| packet            | mm-other-023 | 较新实验性外部图表，支持矩阵未知                                         |

**重要说明**：审计子代理指出这 4 类在 mermaid 上游均有 `imgSnapshotTest` 像素快照基线，说明上游认为输出足够稳定。当前保守分类的依据偏弱：

- **sankey**：d3-sankey 对相同输入收敛到一致布局，浮点仅影响像素精确差异，不影响 SVG 结构有效性
- **block / packet**：上游已快照化，确定性"已验证"而非"未知"
- **architecture**：内置图标（cloud/database/server/internet）为打包 SVG 路径本地注册，无 unpkg fetch；真正风险是 fcose 布局种子

**处置**：MVP 保持 `unsupported_candidate` 分类不变。后续 Render Loop 若实测可稳定渲染，可由该 loop 决定提升为 minimal_core 并纳入测试集。

### 4.2 不纳入测试集的语法维度

以下语法虽在候选中标记为 `minimal_core` 或 `useful_later`，但因配额限制未入选 18 条初始测试，不影响 MVP 支持声明（它们仍由 Mermaid 官方浏览器端 API 支持，只是暂无自动化测试覆盖）：

- 序列图异步/开放箭头 `-)`/`--)`/`<<->>`
- 序列图 `box` 分组 / `opt` 片段 / `critical` 框架
- 状态图 `[[choice]]` / 历史态 `[H]` / `direction`
- 类图泛型 `~T~` / `note for` / `namespace`
- 流程图自环 / 组合边 / `%%` 注释 / `:::` 简写 / Markdown 字符串
- ER 虚线 `..` / 属性注释 / 英文单词基数

这些语法保留在 127 个候选清单中，可在后续 Render Loop 或测试扩展阶段按需纳入。

---

## 5. 延后到后续阶段的语法

### 5.1 useful_later 候选（22 个）

以下候选语法正确但因复杂度/边缘性/专业化，建议延后到 Render Loop 验证后再决定是否纳入：

| 类别                            | 代表候选         | 延后原因                 |
| ------------------------------- | ---------------- | ------------------------ |
| 流程图 Markdown 字符串          | mm-fc-014        | 反引号引用 Markdown 语法 |
| 流程图 `@{ shape: ... }` 元数据 | mm-fc-019        | 较新语法变体             |
| 流程图重复/反向边               | mm-fc-023        | 布局去重边缘情况         |
| 序列图 `par/and` 并行框架       | mm-seq-007       | 偏大                     |
| 序列图多分支 alt/else           | bm-012           | 稍大                     |
| 状态图并发区域 `--`             | mm-st-006        | 专业化                   |
| 类图基数标签                    | mm-cls-004       | 专业化                   |
| 类图 `()` 聚合                  | mm-cls-005       | 专业化                   |
| 类图 namespace                  | mm-cls-007       | 专业化                   |
| ER 大型多实体                   | mm-other-002     | 偏大                     |
| ER 英文单词基数                 | mm-other-024     | 冷门解析分支             |
| gantt done/active/crit          | mm-other-004     | 稍大                     |
| gitGraph 分支+合并              | mm-other-009     | 覆盖广                   |
| mindmap 多级树                  | mm-other-011     | 形状语法                 |
| timeline 分段                   | mm-other-013     | 专业化                   |
| xychart bar+line                | mm-other-016     | 偏大                     |
| C4 Context/Container            | mm-other-018/019 | 冗长特殊 DSL             |
| linkStyle 主题                  | bm-006           | 偏主题                   |

### 5.2 "other" 类型中未入选 MVP 测试的子类型

以下类型有 `minimal_core` 候选但因配额限制（other=1）未入选，建议后续阶段逐步纳入：

| 类型                | 候选 ID      | 分类         | 建议             |
| ------------------- | ------------ | ------------ | ---------------- |
| journey             | mm-other-007 | minimal_core | Phase 2 扩展测试 |
| gitGraph            | mm-other-008 | minimal_core | Phase 2 扩展测试 |
| mindmap             | mm-other-010 | minimal_core | Phase 2 扩展测试 |
| timeline            | mm-other-012 | minimal_core | Phase 2 扩展测试 |
| quadrantChart       | mm-other-014 | minimal_core | Phase 2 扩展测试 |
| xychart (line only) | mm-other-015 | minimal_core | Phase 2 扩展测试 |
| requirementDiagram  | mm-other-017 | minimal_core | Phase 2 扩展测试 |

---

## 6. 依赖风险说明

### 6.1 Mermaid 包版本

- spec 要求通过浏览器端或 devDependencies 引入 `mermaid` 包
- 当前阶段尚未实际安装 mermaid 包，版本未锁定
- **风险**：不同 mermaid 版本对实验性图表类型（sankey/block/architecture/packet）的支持程度不同；同一输入在不同版本间可能输出不同 SVG 结构
- **建议**：Render Loop 阶段锁定 mermaid 版本并在 `package.json` devDependencies 中记录确切版本号

### 6.2 beautiful-mermaid CSS 主题

- beautiful-mermaid 仓库已 clone 到 `references/beautiful-mermaid`
- CSS 主题来源可追溯，但具体 CSS 文件路径和版本需在 Theme Loop 阶段确认
- **风险**：beautiful-mermaid 仅实现 6 种图表类型（flowchart/state/sequence/class/er/xychart），对 pie/gantt/journey 等类型的 CSS 覆盖未知
- **建议**：Theme Loop 阶段确认 CSS 来源、版本和 fallback 策略，记录到 `workflow/reports/`

### 6.3 浏览器端 API 依赖

- Mermaid 浏览器端渲染 API 依赖 DOM 环境
- 测试运行器可使用 Playwright 作为真实浏览器 harness，但必须通过项目 wrapper 获取 SVG string/DOM 并做结构断言；禁止把 Playwright/Puppeteer 作为渲染实现，禁止截图/canvas 作为主判定或输出来源
- **风险**：在 Node.js 测试环境中调用 Mermaid 浏览器端 API 需要解决 DOM 依赖
- **已确认**：Playwright 可作为真实浏览器测试 harness；`happy-dom`/`linkedom` 仅作为轻量单元测试补充，不作为最终 render gate

### 6.4 d3-sankey / fcose 等布局引擎

- sankey 使用 d3-sankey，architecture 使用 fcose
- 这些布局引擎的确定性依赖输入收敛性和随机种子
- 当前版本不做运行时性能 benchmark，但 SVG 结构稳定性受影响
- **处置**：已将 4 类标记为 unsupported_candidate，保守排除

---

## 7. 清理影响

### 7.1 上游 MathML 资产

- `src/` 目录（上游 TeX → MathML 库）：**受保护，不修改**
- `lib/` 目录（编译产物）：**受保护，不修改**
- `test/case/*.yml`（上游 MathML 测试）：**保持不动**
- `demo/webc/Math.js`（上游组件）：**保持不动**
- `plugin/`、`blog/`、`readme/`：**保持不动**

### 7.2 可清理候选

详见 `docs/init/remove-candidates.md`。核心原则：**不主动删除文件，将疑似可移除的文件记录在清单中，保守清理优先，不确定的保留，清理决策需经过人工确认。**

当前已识别的可移除候选项（需 Human Gate 确认）：

- `demo/const/` 中与 Math 相关但与 Mermaid 无关的静态数据
- `demo/svg/` 中与 Math 对比相关的 SVG 资源（需替换为 Mermaid 对比图）
- `demo/i18n/` 中 Math 专有翻译 key（需保留框架，替换内容为 Mermaid key）

### 7.3 新增文件

本阶段不产生新增文件要求。后续 Render Loop 将新增：

- `src/render/mermaid-to-svg.js` — 渲染集成
- `test/runner` — 测试运行器
- `demo/webc/Mermaid.js` — Mermaid 组件（Web Demo Loop）

---

## 8. Human Gate 决策

以下决策节点已由人工确认，最新权威记录见 `workflow/human-gate-decisions.md`：

### HG-1：MVP 支持边界确认

当前提议 MVP 核心支持 6 种类型（flowchart/sequence/class/state/er/pie）+ 扩展 2 种（gantt/xychart-beta）。

**需确认**：

- 是否接受 8 种类型的 MVP 范围？
- 是否需要在 MVP 中额外纳入 journey/gitGraph/mindmap/timeline 等高确定性类型？
- unsupported_candidate 的 4 种类型是否同意在 MVP 中排除？

### HG-2：测试配额策略确认

当前使用按类型配额（flowchart=5, sequence=3, class/state/er=2, pie/gantt=2/1, other=1），总计 18 条。

**需确认**：

- 18 条测试是否足够作为初始 gate？
- 配额比例是否合理？
- 是否应在 Render Loop 完成后扩大测试集？

### HG-3：测试环境 DOM 方案确认

Mermaid 浏览器端 API 需要真实浏览器环境验证。已确认 Playwright 可作为测试 harness，但不能作为渲染实现或截图 oracle。

**决策**：

- 使用 Playwright 作为真实浏览器 test harness。
- 测试必须调用项目 Mermaid-to-SVG wrapper。
- 主要断言必须基于 SVG string / SVG DOM 结构。
- 截图仅可作为失败诊断或人工 UI review 辅助。
- 禁止 `@mermaid-js/mermaid-cli`、服务端渲染、在线转换服务、截图/canvas 作为转换输出。

### HG-4：beautiful-mermaid 对比口径确认

spec 要求对比 `beautiful-mermaid` CDN JS 文件大小 vs 本项目 build 后 JS gzip 大小。

**需确认**：

- `beautiful-mermaid` CDN JS 具体指哪个文件？（dist 产物？打包后？）
- 版本/commit 如何固定？
- 本项目对比的 JS entry 指向哪个 build artifact？

### HG-5：i18n 语言列表对齐确认

原项目有 75 种语言文件。Mermaid 页面新增文案需在所有 locale 中存在 key。

**需确认**：

- 新增哪些 Mermaid 专有 key？
- fallback 策略：是否全部用英文 fallback，还是部分语言提供本地化翻译？
- 语言列表是否与原项目完全一致？

### HG-6：Cloudflare Pages 部署方式确认

**需确认**：

- 构建命令（`bun run build` / `npm run build`？）
- 输出目录（`demo/dist`？）
- 环境变量需求
- SPA fallback / redirects 配置

### HG-7：extract/run.js 重写方案确认

当前 `extract/run.js` 已实现并生成 18 条测试。但 spec 要求的完整抽取报告（`extract/report.json`）中 `skippedSamples` 数组仅记录配额跳过原因，不记录每条候选的完整字段。

**需确认**：

- `extract/report.json` 的 `skippedSamples` 字段是否需要扩充为完整候选信息？
- 是否需要在 Render Loop 后动态调整配额？
- 是否需要在抽取报告中补充 source URL（当前全部为 `null`）？

---

## 9. 与 canonical spec 的差异说明

本提案**不修改** `../docs/mermaid-svg-spec.md`。以下为提案与当前 spec 的主要差异点，供人工 review 时参考：

1. **spec 第 5 节"支持范围策略"**：spec 推荐 flowchart/sequence/class/state-v2/er/pie 为优先展示类型。本提案建议在此基础上增加 gantt 和 xychart-beta 为扩展支持，有实际测试覆盖。
2. **spec 第 3.2 节"测试文件位置"**：spec 要求每条测试包含 7 项字段。当前 `test/schema.yml` 已覆盖全部 7 项，但 `source.url` 全部为 null（待补充可追溯 URL）。
3. **spec 第 3.5 节"测试抽取报告"**：spec 要求报告包含"每条被跳过样例的来源路径和跳过原因"。当前 `extract/report.json` 的 `skippedSamples` 已包含此信息，但仅记录候选元数据（id/sourceRepo/sourcePath/type/priority/classification/reason），不包含完整 input。
4. **spec 第 12 节"技术边界"**：Playwright/Puppeteer 仍不得作为渲染实现；Playwright 仅允许作为真实浏览器测试 harness。
