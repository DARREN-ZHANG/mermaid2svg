# Test Inventory

> Phase 5 产物。记录 Mermaid 测试抽取结果，由 `extract/run.js` 自动生成的数据驱动。
> 配套候选数据见 `docs/init/test-candidates.json`，抽取报告见 `extract/report.json`。

## 概览

从 127 个候选中按配额轮询选取 **18 条高信号测试**，覆盖 **8 种 diagram type**，来自全部 **3 个参考仓库**。

| 指标 | 数量 |
|---|---|
| 总候选 | 127 |
| 已接受 | 18 |
| 已跳过 | 109 |
| diagram type 覆盖 | 8 |
| 来源仓库覆盖 | 3/3 |

## 生成的测试文件

所有文件位于 `test/` 目录下，命名格式为 `<id>.yml`。

| ID | type | 来源仓库 | 来源路径 | 首行 |
|---|---|---|---|---|
| bm-001 | flowchart | lukilabs/beautiful-mermaid | samples-data.ts | `graph TD` |
| bm-002 | flowchart | lukilabs/beautiful-mermaid | samples-data.ts | `graph LR` |
| bm-007 | stateDiagram | lukilabs/beautiful-mermaid | samples-data.ts | `stateDiagram-v2` |
| bm-010 | sequenceDiagram | lukilabs/beautiful-mermaid | samples-data.ts | `sequenceDiagram` |
| bm-014 | classDiagram | lukilabs/beautiful-mermaid | samples-data.ts | `classDiagram` |
| bm-017 | erDiagram | lukilabs/beautiful-mermaid | samples-data.ts | `erDiagram` |
| bm-020 | other | lukilabs/beautiful-mermaid | samples-data.ts | `xychart-beta` |
| maid-001 | flowchart | probelabs/maid | test-fixtures/flowchart/valid/simple-flow.mmd | `flowchart TD` |
| maid-002 | flowchart | probelabs/maid | test-fixtures/flowchart/valid/with-text.mmd | `flowchart LR` |
| maid-010 | sequenceDiagram | probelabs/maid | test-fixtures/sequence/valid/basic.mmd | `sequenceDiagram` |
| maid-015 | classDiagram | probelabs/maid | test-fixtures/class/valid/relations-all.mmd | `classDiagram` |
| maid-017 | stateDiagram | probelabs/maid | test-fixtures/state/valid/simple.mmd | `stateDiagram-v2` |
| maid-019 | pie | probelabs/maid | test-fixtures/pie/valid/simple.mmd | `pie` |
| maid-020 | gantt | probelabs/maid | test-fixtures/unsupported/gantt.mmd | `gantt` |
| mm-fc-001 | flowchart | mermaid-js/mermaid | packages/.../flow-arrows.spec.js:16 | `graph TD` |
| mm-other-001 | erDiagram | mermaid-js/mermaid | cypress/.../erDiagram.spec.js | `erDiagram` |
| mm-other-005 | pie | mermaid-js/mermaid | cypress/.../pie.spec.ts | `pie title Sports in Sweden` |
| mm-seq-001 | sequenceDiagram | mermaid-js/mermaid | cypress/.../sequencediagram.spec.js | `sequenceDiagram` |

## Diagram Type 覆盖

| type | accepted | skipped | 来源数 |
|---|---|---|---|
| flowchart | 5 | 36 | 3 |
| sequenceDiagram | 3 | 19 | 3 |
| classDiagram | 2 | 12 | 2 |
| stateDiagram | 2 | 14 | 2 |
| erDiagram | 2 | 6 | 2 |
| pie | 2 | 2 | 2 |
| gantt | 1 | 3 | 1 |
| other | 1 | 17 | 1 |

选取规则达成情况：

- 总数 ≥ 5：**18**（PASS）
- flowchart ≥ 3：**5**（PASS）
- sequenceDiagram ≥ 1：**3**（PASS）
- classDiagram 或 stateDiagram ≥ 1：**4**（PASS）
- 三来源均有入选：**3/3**（PASS）

## 来源仓库分布

| 仓库 | scanned | candidates | accepted | skipped |
|---|---|---|---|---|
| probelabs/maid | 211 | 25 | 7 | 18 |
| lukilabs/beautiful-mermaid | 24 | 25 | 7 | 18 |
| mermaid-js/mermaid | 271 | 77 | 4 | 73 |

## 省略候选及原因

### 跳过原因聚合

| reason | count | 说明 |
|---|---|---|
| quota_exceeded_flowchart | 32 | flowchart 配额 (5) 已满，剩余候选未入选 |
| quota_exceeded_sequenceDiagram | 16 | sequenceDiagram 配额 (3) 已满 |
| classification_useful_later | 22 | 候选标记为 useful_later，留待 Render Loop 验证 |
| quota_exceeded_stateDiagram | 13 | stateDiagram 配额 (2) 已满 |
| quota_exceeded_classDiagram | 8 | classDiagram 配额 (2) 已满 |
| quota_exceeded_other | 7 | other 配额 (1) 已满 |
| quota_exceeded_erDiagram | 4 | erDiagram 配额 (2) 已满 |
| classification_unsupported_candidate | 4 | 候选标记为 unsupported_candidate |
| quota_exceeded_gantt | 2 | gantt 配额 (1) 已满 |
| quota_exceeded_pie | 1 | pie 配额 (2) 已满 |

每条跳过候选的来源路径和原因详见 `extract/report.json` 中的 `skippedSamples` 数组。

## unsupported_candidate 汇总

以下 4 个候选因实验性或确定性风险暂未纳入：

| ID | type | 来源路径 | 风险说明 |
|---|---|---|---|
| mm-other-020 | sankey-beta | cypress/.../sankey.spec.ts | d3-sankey 迭代布局，浮点坐标可能引入像素舍入不确定性 |
| mm-other-021 | block-beta | cypress/.../block.spec.js | 较新实验性外部图表，带自有布局求解器 |
| mm-other-022 | architecture-beta | cypress/.../architecture.spec.ts | 实验性，fcose 力导向布局种子依赖 |
| mm-other-023 | packet | cypress/.../packet.spec.ts | 较新实验性外部图表，支持矩阵未知 |

> 参考仓库审计指出这 4 类在 mermaid 上游有像素快照基线，确定性并非完全未知。
> 后续 Render Loop 若实测可稳定渲染，可由该 loop 决定提升为 minimal_core。

## 推荐 MVP 语法边界

基于已入选的 18 条测试，MVP 版本的推荐支持范围为：

| diagram type | 推荐支持 | 验证来源 |
|---|---|---|
| flowchart / graph | ✅ 核心 | 3 个来源，5 条测试，覆盖基本节点/边/分支/子图 |
| sequenceDiagram | ✅ 核心 | 3 个来源，3 条测试，覆盖 participant/消息/返回 |
| classDiagram | ✅ 核心 | 2 个来源，2 条测试，覆盖类成员/关系箭头 |
| stateDiagram-v2 | ✅ 核心 | 2 个来源，2 条测试，覆盖状态转换/起止标记 |
| erDiagram | ✅ 核心 | 2 个来源，2 条测试，覆盖关系基数/属性键标记 |
| pie | ✅ 核心 | 2 个来源，2 条测试，覆盖标题/切片 |
| gantt | ⚠️ 扩展 | 1 个来源，1 条测试，覆盖 dateFormat/section/任务状态 |
| journey / xychart-beta | ⚠️ 扩展 | 1 个来源，各 1 条测试，验证非核心类型渲染可行性 |

### 选取算法说明

脚本使用**按类型配额 + 来源轮询**策略：

1. 仅接受 `minimal_core` 分类候选
2. 每种 diagram type 按配额上限选取（flowchart=5, sequenceDiagram=3 等）
3. 同优先级内交替从不同来源仓库取候选，确保来源多样性
4. 优先级 P0 > P1 > P2
5. 总计 18 条，平衡覆盖广度与人工 review 成本

## 重新生成

```bash
node extract/run.js
```

脚本幂等：每次运行先清理旧 `test/*.yml`（保留 `schema.yml` 和 `case/`），再重新生成全部产物。
