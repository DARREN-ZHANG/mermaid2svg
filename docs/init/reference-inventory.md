# Reference Repo Mining Inventory

> Phase 4 产物。本文件记录对三个本地参考仓库的 Mermaid 测试候选挖掘结果。
> 配套候选数据见 `docs/init/test-candidates.json`。

## 概览

本阶段通过 5 个并行 explore 子代理分别挖掘三个参考仓库，共产出 **104 个候选**。

| 来源仓库 | 候选数 |
|---|---|
| `probelabs/maid` | 20 |
| `lukilabs/beautiful-mermaid` | 20 |
| `mermaid-js/mermaid` | 64 |

候选按 diagram type 分布：

| type | 数量 |
|---|---|
| flowchart | 35 |
| sequenceDiagram | 16 |
| classDiagram | 12 |
| stateDiagram | 12 |
| erDiagram | 5 |
| gantt | 3 |
| pie | 3 |
| other | 18 |

候选按 classification 分布：

| classification | 数量 |
|---|---|
| minimal_core | 80 |
| useful_later | 20 |
| unsupported_candidate | 4 |
| invalid_or_non_deterministic | 0 |

挖掘规则达成情况：

- minimal_core ≥ 5：**80**（PASS）
- flowchart ≥ 3：**35**（PASS）
- sequenceDiagram 找到：**16**（PASS）
- classDiagram / stateDiagram 找到：**24**（PASS）

---

## 1. references/maid（probelabs/maid）

### 示例/测试位置

| 目录/文件 | 说明 |
|---|---|
| `test-fixtures/flowchart/valid/` | **最丰富的单一来源**（约 45 个图），含 `VALID_DIAGRAMS.md` 嵌入全部源字符串 |
| `test-fixtures/sequence/valid/` | 约 22 个图，块/注释/激活/box 覆盖面强 |
| `test-fixtures/class/valid/` | 约 16 个图，关系多样性好 |
| `test-fixtures/state/valid/` | 约 6 个图，小而规范 |
| `test-fixtures/pie/valid/` | 约 6 个图，小而规范 |
| `test-fixtures/unsupported/` | 2 个图（gantt、journey），唯一"其他"类型来源 |
| `docs/QUICK_REFERENCE.md` | 节点形状目录、箭头目录（与 maid-003/004 重叠） |

### 该仓库候选统计

| type | 数量 |
|---|---|
| flowchart | 9 |
| sequenceDiagram | 5 |
| classDiagram | 2 |
| stateDiagram | 2 |
| pie | 1 |
| gantt | 1 |

### 不支持/风险类别

- `test-fixtures/<type>/invalid/`：大量故意损坏输入（用于 linter 错误码测试），对渲染测试无用，已排除。
- `test-fixtures/<type>/rendered/*.svg`：maid 实验性渲染器快照，非 Mermaid 输入，已排除。
- frontmatter-theme 固件：使用 YAML frontmatter 配置块，适合测试主题配置解析，但归为 `useful_later`。
- 引号边缘固定数据（`participant-unclosed-quote.mmd` 等）：Mermaid 兼容但边缘，归为 `useful_later` 而非 `minimal_core`。

### 显著缺口

- **无 erDiagram**：源仓库视为透传，无固定数据。
- **无 gitGraph / mindmap / timeline / quadrantChart / xychart / C4 / requirementDiagram** 固定数据：maid 的 linter 尚未实现这些类型。
- 仅有 gantt 和 journey 作为"其他"类型存在。

---

## 2. references/beautiful-mermaid（lukilabs/beautiful-mermaid）

### 示例/测试位置

| 目录/文件 | 说明 |
|---|---|
| `samples-data.ts` | **最丰富的单一来源**（约 1300 行 `Sample[]` 数组），按类别组织；全部 20 个候选均来自此处 |
| `xychart-samples-data.ts` | 约 100 个 xychart 变体（条形/线条/组合/水平/边缘情况）；基本为 P2 体量变体 |
| `src/__tests__/*.test.ts` | 微小嵌入图片段，但碎片化且与 samples-data 重叠 |
| `editor/js/init.js` | 默认编辑器图，备选最小流程图 |
| `examples/*.svg` | 预渲染 SVG 产物（非源码），已跳过 |
| `README.md` | 示例与 samples-data 子集重叠，无独特输入 |

### 该仓库候选统计

| type | 数量 |
|---|---|
| flowchart | 6 |
| stateDiagram | 3 |
| sequenceDiagram | 4 |
| classDiagram | 3 |
| erDiagram | 3 |
| other (xychart) | 1 |

### 不支持/风险类别

- `src/__tests__/testdata/`：ASCII/Unicode 黄金输出快照（预期渲染文本），非 Mermaid 源输入，已排除。
- `public/`：仅网站图标，已跳过。
- `linkStyle` 主题样本（bm-006）：偏主题，归为 `useful_later`。

### 显著缺口

- **仅实现 6 种图表类型**：flowchart/graph、stateDiagram-v2、sequenceDiagram、classDiagram、erDiagram、xychart-beta。
- **无 pie / gantt / journey / gitGraph / mindmap / timeline / quadrantChart / requirementDiagram / C4**：必须从其他仓库挖掘。
- **无 stateDiagram (v1)**：全部为 -v2 变体。

---

## 3. references/mermaid（mermaid-js/mermaid）

这是候选最大的来源（64 个），分三个子代理按类型维度并行挖掘。

### 3a. flowchart / graph（20 个）

#### 示例/测试位置

| 目录/文件 | 说明 |
|---|---|
| `packages/mermaid/src/diagrams/flowchart/parser/*.spec.js` | **解析器单元测试金矿**，按语法维度组织（箭头/边/线/方向/样式/文本/单节点/子图/顶点链/Markdown 字符串/节点数据） |
| `cypress/integration/rendering/flowchart/flowchart.spec.js` | 渲染级 e2e 测试（1051 行），集成示例好但多为像素快照 |
| `demos/flowchart.html` | 22+ 样本，演示每种节点形状/样式/标签变体 |
| `cypress/platform/dev-diagrams/layout-tests/*.mmd` | 独立 `.mmd` 固件文件（`shapes.mmd`、`edge-types.mmd`、`nested-subgraphs.mmd`、`self-loop.mmd`），对文件路径式测试提取最实用 |

### 3b. sequenceDiagram / stateDiagram / classDiagram（21 个）

#### 示例/测试位置

| 类型 | 最丰富来源 |
|---|---|
| sequenceDiagram | `cypress/integration/rendering/sequence/sequencediagram.spec.js` 及 `sequencediagram-v2.spec.js`（语法最密集） |
| stateDiagram | `cypress/integration/rendering/state/stateDiagram.spec.js`（经典）及 `stateDiagram-v2.spec.js`（v2 特性） |
| classDiagram | `cypress/integration/rendering/class/classDiagram.spec.js`（关系/可见性覆盖） |

辅助来源：`demos/sequence.html`、`demos/state.html`、`demos/classchart.html`、`cypress/platform/dev-diagrams/layout-tests/{class-diagram,state-diagram}.mmd`。

候选分布：sequenceDiagram 7、stateDiagram 7（含 v2）、classDiagram 7。

### 3c. erDiagram / gantt / pie / 其他类型（23 个）

#### 示例/测试位置

| 类型 | 最丰富来源 |
|---|---|
| erDiagram | `cypress/integration/rendering/er/erDiagram.spec.js`、`demos/er.html` |
| gantt | `cypress/integration/rendering/gantt/gantt.spec.js`、`demos/gantt.html` |
| pie | `cypress/integration/rendering/pie/pie.spec.ts`、`demos/pie.html` |
| journey | `cypress/integration/rendering/user-journey/journey.spec.js` |
| gitGraph | `cypress/integration/rendering/git/gitGraph.spec.js`（2182 行，最大） |
| mindmap | `cypress/integration/rendering/mindmap/mindmap.spec.ts`、`demos/mindmap.html` |
| timeline | `cypress/integration/rendering/timeline/timeline.spec.ts` |
| quadrantChart | `cypress/integration/rendering/quadrant-chart/quadrantChart.spec.js` |
| xychart | `cypress/integration/rendering/xychart/xyChart.spec.js`（1031 行） |
| requirementDiagram | `cypress/integration/rendering/requirement/requirement.spec.js` |
| C4 | `cypress/integration/rendering/c4/c4.spec.js` |
| sankey / block / architecture / packet | 各自 `cypress/integration/rendering/<type>/` 下的 spec 文件 |

#### 不支持/风险类别（标记为 unsupported_candidate）

| 类型 | 原因 |
|---|---|
| **sankey** | 使用 d3-sankey 迭代求解器；节点位置为浮点值，像素舍入可能引入不确定性 |
| **block** | 较新实验性外部图表，带自有布局引擎，确定性特征不明 |
| **architecture** | 实验性；自定义图标包需运行时 `fetch('https://unpkg.com/...')`，离线渲染回退占位符 |
| **packet** | 较新实验性外部图表，小众，支持矩阵未知 |

这些类型未被丢弃，而是显式分类记录，符合"不静默丢弃有趣的不支持用例"规则。

### 该仓库候选统计

| type | 数量 |
|---|---|
| flowchart | 20 |
| sequenceDiagram | 7 |
| stateDiagram | 7 |
| classDiagram | 7 |
| erDiagram | 2 |
| gantt | 2 |
| pie | 2 |
| other | 17 |

---

## 全局显著缺口

1. **maid 仓库覆盖面最窄**：仅覆盖 maid linter 实现的类型（flowchart/sequence/class/state/pie/gantt/journey），无 erDiagram 和全部新型图。
2. **beautiful-mermaid 覆盖 6 种类型**：缺 pie/gantt/journey/gitGraph/mindmap/timeline 等，需靠 mermaid 仓库补充。
3. **erDiagram 来源集中**：仅 beautiful-mermaid（3）和 mermaid（2），maid 无贡献。
4. **mermaid 仓库无 `.mmd` 固件覆盖"其他"类型**：er/gantt/pie/journey/gitGraph/mindmap/timeline/quadrant/xychart/C4/requirement/sankey/block/architecture/packet 的可重用输入存在于 `.spec.*` 和 `demos/*.html`，抽取脚本需解析这些文件而非仅扫 `.mmd`。
5. **无 invalid_or_non_deterministic 候选**：三个仓库中故意损坏的输入（maid 的 invalid/ 固件）未纳入，因为它们对渲染测试无价值且会制造噪音。

## 抽取脚本启示（供后续 Phase 参考）

- **maid**：`test-fixtures/` 下 `.mmd` 文件路径清晰，最易按文件路径提取；`VALID_DIAGRAMS.md` 嵌入全部源字符串也可解析。
- **beautiful-mermaid**：`samples-data.ts` 是结构化 `Sample[]` 数组，可解析 TypeScript 模板字符串提取。
- **mermaid**：需混合策略——解析 `.spec.*` 中 `imgSnapshotTest`/`renderGraph` 调用的嵌入字符串，以及 `demos/*.html` 中 `<pre class="mermaid">` 块，以及 `cypress/platform/dev-diagrams/layout-tests/*.mmd` 独立文件。
- **去噪要点**：移除 `::icon()` 调用（mindmap）、移除 `click ... call/href`（gantt）、剥离 FontAwesome 图标语法（`fa:fa-*`）、剥离 MathJax（`$$...$$`）、剥离 `UpdateRelStyle`（C4）。
- **最小核心优先**：80 个 minimal_core 候选已远超 5 个下限，为后续测试生成提供了充分的语法广度。
