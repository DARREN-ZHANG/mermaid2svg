# Mermaid 示例扩充设计

- 日期：2026-06-14
- 状态：已与用户对齐，待写实施计划
- 范围：仅 `demo/` 前端展示页面，不引入新 Mermaid 图表类型

## 1. 目标与背景

`demo/const/mermaidExamples.js` 现有 8 个示例（每种 Mermaid 图表类型 1 条），复杂度普遍偏低（如 ER 图仅 2 实体一关系，flowchart 仅 3 节点线性）。

本次扩充目标：

- 不引入新图表类型，仅在现有 8 种类型内加深
- 每类扩充为 3 级：简单（保留现有）/ 中阶 / 复杂
- 复杂度按「特性递进」分级：简单仅基础语法 → 中阶加控制结构 → 复杂加样式与高阶特性
- 命名采用「场景化名称」（如「订单审批流程」「OAuth 授权流程」），不用难度后缀或序号

最终示例总数：8 类 × 3 级 = **24 个**。

## 2. 改动范围（仅 4 类文件）

| 文件 | 改动 |
|------|------|
| `demo/const/mermaidExamples.js` | 数组从 8 条扩到 24 条；现有 8 条 `displayName` 改为场景化名称；按「类型分组 × 简单→中阶→复杂」排序 |
| `demo/i18n/zh.js` | `names` 数组扩到 24 项（完整中文翻译） |
| `demo/i18n/en.js` | `names` 数组扩到 24 项（完整英文翻译，与 `displayName` 对齐） |
| `demo/i18n/{其余 76 种语言}.js` | `names` 数组扩到 24 项：**前 8 项保留现有本地化**，**后 16 项复用 en.js 英文作为占位** |

**不动**：`index.js`、`index.pug`、`style.styl`、`theme.css`。`buildCard` 中已有的 `(i18n.names && i18n.names[idx]) || fallbackName` 回退逻辑足以支撑本次扩充。

**UI 影响**：`.examples-grid` 是 CSS Grid（`repeat(auto-fill, minmax(300px, 1fr))`），24 张卡片自动换行，无需改样式。同类型 3 张卡片相邻排序，自然形成视觉分组。

## 3. 24 个示例清单

排序规则：按「类型分组 × 简单→中阶→复杂」顺序排列。

| # | 类型 | 难度 | displayName (en) | 中文场景名 |
|---|------|------|------------------|-----------|
| 1 | flowchart | 简单 | Start Process | 开始处理流程 |
| 2 | flowchart | 中阶 | Order Approval | 订单审批流程 |
| 3 | flowchart | 复杂 | CI/CD Pipeline | CI/CD 流水线 |
| 4 | sequenceDiagram | 简单 | Greeting | 问候对话 |
| 5 | sequenceDiagram | 中阶 | Retry Mechanism | 重试机制 |
| 6 | sequenceDiagram | 复杂 | OAuth Flow | OAuth 授权流程 |
| 7 | classDiagram | 简单 | Animal Class | 动物类 |
| 8 | classDiagram | 中阶 | Animal Hierarchy | 动物分类 |
| 9 | classDiagram | 复杂 | Strategy Pattern | 策略模式 |
| 10 | stateDiagram-v2 | 简单 | Basic States | 基础状态 |
| 11 | stateDiagram-v2 | 中阶 | Order State Machine | 订单状态机 |
| 12 | stateDiagram-v2 | 复杂 | Elevator Dispatch | 电梯调度 |
| 13 | erDiagram | 简单 | Customer-Order | 客户订单 |
| 14 | erDiagram | 中阶 | E-commerce Core | 电商核心 |
| 15 | erDiagram | 复杂 | Banking System | 银行系统 |
| 16 | pie | 简单 | Pets | 宠物分布 |
| 17 | pie | 中阶 | Device Share | 设备占比 |
| 18 | pie | 复杂 | Browser Market | 浏览器市场 |
| 19 | gantt | 简单 | Simple Tasks | 基础任务 |
| 20 | gantt | 中阶 | Software Project | 软件项目 |
| 21 | gantt | 复杂 | Quarterly Plan | 季度规划 |
| 22 | xychart-beta | 简单 | Product Sales | 产品销量 |
| 23 | xychart-beta | 中阶 | Multi-series Chart | 多组数据 |
| 24 | xychart-beta | 复杂 | Quarterly Revenue | 季度营收 |

**简单版**（#1, #4, #7, #10, #13, #16, #19, #22）：保持现有源代码不变，仅改 `displayName`。场景名与现有代码已对齐（如 `Start Process` 对应 `A[Start] --> B[Process] --> C[End]`）。

## 4. 中阶 / 复杂示例的复杂度特性清单

每条列出「场景意图」+「必须包含的 Mermaid 语法元素」。前端工程师照此编写源代码。

### flowchart

**#2 Order Approval（中阶）**
- 场景：申请人提交订单 → 经理审批 → 通过/拒绝分支
- 必须包含：`{决策}` 菱形节点、`subgraph` 角色分组（申请人 / 审批人 / 系统）、`LR` 或 `TD` 方向

**#3 CI/CD Pipeline（复杂）**
- 场景：开发提交 → CI 测试 → 构建镜像 → CD 部署 → 监控反馈
- 必须包含：嵌套 `subgraph`、`classDef` 自定义样式高亮关键路径、`linkStyle` 修改特定连线样式、≥ 5 个角色或 subgraph

### sequenceDiagram

**#5 Retry Mechanism（中阶）**
- 场景：客户端调用服务，失败重试 3 次，最终成功 / 彻底失败
- 必须包含：`loop` 循环块、`alt/else` 分支、`Note over` 跨实体注释

**#6 OAuth Flow（复杂）**
- 场景：User → Client → AuthServer → ResourceServer 的 OAuth 2.0 授权码流程
- 必须包含：`autonumber`、`activate/deactivate` 生命线激活、`rect rgb()` 块状背景区分阶段、4 个 participant

### classDiagram

**#8 Animal Hierarchy（中阶）**
- 场景：Animal 基类派生 Dog / Cat / Bird，体现继承关系
- 必须包含：`<|--` 继承箭头、≥ 4 个类、属性 + 方法

**#9 Strategy Pattern（复杂）**
- 场景：策略模式（Context 持有 Strategy 接口，多个具体策略实现）
- 必须包含：`<<interface>>`、`<<abstract>>`、`<|--` 继承、`*--` 组合、`o--` 聚合、`..>` 依赖、`note` 注释

### stateDiagram-v2

**#11 Order State Machine（中阶）**
- 场景：订单 待支付 → 已支付 → 已发货 → 已签收 / 已取消
- 必须包含：复合状态（`state { ... }` 嵌套）、`note right/left`

**#12 Elevator Dispatch（复杂）**
- 场景：电梯 空闲 → 上行/下行 → 开门/关门 → 报警
- 必须包含：`fork` / `join` 并发分支、`[*]` 历史状态、`note`

### erDiagram

**#14 E-commerce Core（中阶）**
- 场景：Customer / Order / Product / Category 四实体关系
- 必须包含：4 个实体、3 种以上基数（`||--o{`、`}|--||`、`}o--o{`）、每实体 ≥ 2 属性

**#15 Banking System（复杂）**
- 场景：Account / Customer / Transaction / Card / Loan 五实体银行核心
- 必须包含：5 个实体、每实体 ≥ 4 属性（含 PK 标注）、4 种以上关系、识别 vs 非识别关系

### pie

**#17 Device Share（中阶）**
- 场景：移动 / 桌面 / 平板 / 其他 四类设备流量占比
- 必须包含：≥ 4 项、`title`、占比悬殊的数据（如 60/25/10/5）

**#18 Browser Market（复杂）**
- 场景：Chrome / Safari / Edge / Firefox / Samsung / Other 浏览器市场份额
- 必须包含：≥ 6 项、长 title、通过 `%%{init: ...}%%` 注解或 mermaid init config 自定义调色板

### gantt

**#20 Software Project（中阶）**
- 场景：前端 / 后端 / 测试 三阶段软件开发
- 必须包含：≥ 3 个 `section`、`after` 依赖关系、`milestone`（里程碑）、`active` / `done` 状态

**#21 Quarterly Plan（复杂）**
- 场景：Q1-Q4 跨季度项目，含节假日、关键路径
- 必须包含：`excludes`（节假日）、`crit` 关键任务、`today` 标记、`link` 任务链接

### xychart-beta

**#23 Multi-series Chart（中阶）**
- 场景：多个产品的销量对比
- 必须包含：多组 `bar` 数据（≥ 2 组）、自定义 `x-axis` 标签、`title`

**#24 Quarterly Revenue（复杂）**
- 场景：四个季度的营收对比 + 同比
- 必须包含：多组 `bar` + 自定义 `y-axis` 范围、长 title、≥ 6 个 x 轴分类

## 5. i18n 完整内容

### 5.1 `demo/i18n/zh.js` 的 names 数组（24 项）

```js
names: [
  // flowchart
  "开始处理流程", "订单审批流程", "CI/CD 流水线",
  // sequenceDiagram
  "问候对话", "重试机制", "OAuth 授权流程",
  // classDiagram
  "动物类", "动物分类", "策略模式",
  // stateDiagram-v2
  "基础状态", "订单状态机", "电梯调度",
  // erDiagram
  "客户订单", "电商核心", "银行系统",
  // pie
  "宠物分布", "设备占比", "浏览器市场",
  // gantt
  "基础任务", "软件项目", "季度规划",
  // xychart-beta
  "产品销量", "多组数据", "季度营收",
],
```

### 5.2 `demo/i18n/en.js` 的 names 数组（24 项，与 `mermaidExamples.js` 的 `displayName` 一一对应）

```js
names: [
  // flowchart
  "Start Process", "Order Approval", "CI/CD Pipeline",
  // sequenceDiagram
  "Greeting", "Retry Mechanism", "OAuth Flow",
  // classDiagram
  "Animal Class", "Animal Hierarchy", "Strategy Pattern",
  // stateDiagram-v2
  "Basic States", "Order State Machine", "Elevator Dispatch",
  // erDiagram
  "Customer-Order", "E-commerce Core", "Banking System",
  // pie
  "Pets", "Device Share", "Browser Market",
  // gantt
  "Simple Tasks", "Software Project", "Quarterly Plan",
  // xychart-beta
  "Product Sales", "Multi-series Chart", "Quarterly Revenue",
],
```

### 5.3 其余 76 个文件的批量更新

**方式**：写一次性脚本（如 `scripts/i18n-expand.mjs`），逻辑：

1. 读取 `demo/i18n/en.js`，提取 names 数组后 16 项（index 8-23）
2. 遍历 `demo/i18n/*.js`，跳过 `zh.js` 和 `en.js`
3. 用正则匹配每个文件的 `names: [ ... ]` 块，保留前 8 项（原本地化），追加 en.js 的后 16 项
4. 写回原文件

**执行后**：78 个 i18n 文件 names 数组都扩到 24 项，结构完全一致。

**示例（以 `ja.js` 为例）**：

```js
names: [
  "フローチャート",
  // ...前 8 项保持原日语不变
  "XY チャート",
  // ↓ 追加的 16 项（en.js 内容）
  "Order Approval",
  "CI/CD Pipeline",
  // ...
  "Quarterly Revenue",
],
```

**未翻译的可见行为**：非 zh/en 语言下，前 8 张卡片显示本地化（如日语「フローチャート」），后 16 张显示英文（如「Order Approval」）。这是渐进式本地化的合理过渡，后续可分批翻译。

## 6. 验证方式

| 验证项 | 命令 / 步骤 |
|--------|------------|
| 现有测试不破坏 | `./test.sh`（应保持全部通过） |
| 新增示例渲染 | 浏览器打开 demo，确认 24 张卡片 SVG 都能正常渲染（无报错） |
| 切换语言 | 切到中文 → 24 张标题全中文；切到日语 → 前 8 张日语 + 后 16 张英文；切到其他语言 → 同日语模式 |
| 切换主题 | 默认 / 暗色主题切换，24 张卡片渲染样式应保持一致 |
| 主预览输入 | 点击任一卡片，主预览能正确渲染对应 SVG |

## 7. 边界情况与降级策略

- **Mermaid 11.15 不支持的复杂语法**：前端工程师写完每条复杂示例后，需在主预览框实际渲染验证。若失败，降级为「同难度但场景更宏大」（如增加节点数 / 实体数），并在 PR 描述中标注降级原因。
- **xychart-beta 复杂版的 line + bar 混合**：Mermaid 11.15 对 xychart 支持有限。若 #23 / #24 的混合特性不支持，降级为多组 bar。
- **pie 复杂版的自定义颜色**：Mermaid pie 通过 `%%{init: {...}}%%` 注解自定义颜色，需验证 11.15 行为。

## 8. 不做的事项（YAGNI）

- 不引入新图表类型（如 mindmap、timeline、journey、quadrant、gitGraph 等）
- 不改 UI 布局（不加 section 分组标题、不加筛选器、不改 grid 样式）
- 不改 `index.js` 渲染逻辑
- 不重写简单版示例的源代码（仅改 `displayName`）
- 不一次性翻译 76 种语言的后 16 项（保留渐进本地化空间）
