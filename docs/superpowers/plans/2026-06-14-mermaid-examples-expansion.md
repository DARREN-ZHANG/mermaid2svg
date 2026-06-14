# Mermaid 示例扩充实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `demo/const/mermaidExamples.js` 从 8 条扩充到 24 条（8 种图表类型 × 3 级复杂度），同步更新 78 个 i18n 文件。

**Architecture:** 仅改 4 类文件（`mermaidExamples.js` + 78 个 `demo/i18n/*.js`）。UI 与 `index.js` 渲染逻辑完全不动，依赖 `.examples-grid` 的 CSS Grid 自适应 + `buildCard` 已有 i18n 回退逻辑。

**Tech Stack:** Bun runtime, Playwright + Vite harness（测试），Mermaid 11.15（渲染），oxfmt/oxlint（lint），conventional commits。

**关联 spec:** `docs/superpowers/specs/2026-06-14-mermaid-examples-expansion-design.md`

---

## 文件结构

| 文件                                                                | 责任                                | 本计划是否修改                               |
| ------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `demo/const/mermaidExamples.js`                                     | 示例源数据数组（24 条元组）         | 是（追加 16 条 + 改前 8 条 displayName）     |
| `demo/i18n/zh.js` `demo/i18n/en.js`                                 | 完整翻译（24 项 names）             | 是（前 8 改名 + 追加后 16）                  |
| `demo/i18n/{其余 76 种语言}.js`                                     | 渐进本地化                          | 是（前 8 保留 + 追加后 16 英文占位）         |
| `test/render-examples.test.mjs`                                     | 全量示例渲染测试（防回归）          | 是（新建）                                   |
| `test/lib/renderHarness.mjs`                                        | Playwright + Vite harness（已存在） | 否                                           |
| `package.json` `test.sh`                                            | 测试入口                            | 是（加 `test:examples` 脚本与 test.sh 调用） |
| `scripts/i18n-expand.mjs`                                           | 一次性批量更新 76 个 i18n 文件      | 是（新建）                                   |
| `demo/index.js` `demo/index.pug` `demo/style.styl` `demo/theme.css` | UI 层                               | **不动**（`buildCard` 已有回退逻辑）         |

---

## Task 1：建立 demo 全量示例渲染测试基线

防止后续追加示例时引入语法错误。基线为现有 8 条，后续 Task 自动覆盖新增示例。

**Files:**

- Create: `test/render-examples.test.mjs`
- Modify: `package.json`（加 `test:examples` 脚本）
- Modify: `test.sh`（加调用）

- [ ] **Step 1: 创建 `test/render-examples.test.mjs`**

```js
// Demo 全量示例渲染测试
// 遍历 demo/const/mermaidExamples.js 中所有 src，
// 通过 Playwright harness 调用 renderMermaidToSvg + normalizeSvg，
// 断言每条都能产出带 <svg 根节点和 viewBox 的合法 SVG。
// 用途：防止 mermaidExamples.js 在追加示例时引入语法错误。

import assert from "node:assert/strict";
import { test, describe, before, after } from "node:test";
import MERMAID_EXAMPLES from "../demo/const/mermaidExamples.js";
import { openHarness } from "./lib/renderHarness.mjs";

const OK = 0,
  RENDERER_PATH = "/demo/render/mermaid-to-svg.js",
  NORMALIZER_PATH = "/demo/render/normalize-svg.js";

// 渲染单条 mermaid 源：返回 [code, svg]
const renderOne = async (page, src) => {
  const [code, raw] = await page.evaluate(async (text) => {
    return await window.__mods[0].renderMermaidToSvg(text);
  }, src);
  if (code !== OK) return [code, raw];
  const [nCode, normalized] = await page.evaluate(async (r) => {
    return await window.__mods[1].normalizeSvg(r);
  }, raw);
  return [nCode, normalized];
};

describe("render-examples", () => {
  let page, closeHarness;

  before(async () => {
    const [, p, close] = await openHarness([RENDERER_PATH, NORMALIZER_PATH]);
    page = p;
    closeHarness = close;
  });

  after(async () => {
    await closeHarness?.();
  });

  // 至少有 8 条基线（防止 mermaidExamples.js 误删）
  test("baseline: 至少 8 条示例", () => {
    assert.ok(
      MERMAID_EXAMPLES.length >= 8,
      "MERMAID_EXAMPLES 应至少有 8 条，实际 " + MERMAID_EXAMPLES.length,
    );
  });

  // 每条独立测试，命名包含 displayName 便于定位失败
  for (const [type, name, src] of MERMAID_EXAMPLES) {
    test("render: " + name + " [" + type + "]", async () => {
      const [code, svg] = await renderOne(page, src);
      assert.equal(code, OK, "render failed for " + name + ": " + svg);
      assert.ok(typeof svg === "string" && svg.includes("<svg"), "SVG root missing for " + name);
      assert.ok(/viewBox=/.test(svg), "viewBox missing for " + name);
    });
  }
});
```

- [ ] **Step 2: 在 `package.json` 的 scripts 段加 `test:examples`**

打开 `package.json`，在 `"test:speed": "bun test test/render-speed.test.mjs",` 之后插入：

```json
    "test:examples": "bun test test/render-examples.test.mjs",
```

- [ ] **Step 3: 在 `test.sh` 加调用**

打开 `test.sh`，在 `bun test test/render-speed.test.mjs` 之后插入：

```bash
bun test test/render-examples.test.mjs
```

- [ ] **Step 4: 跑测试，验证 8 条基线全部通过**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，9 个测试（1 个 baseline + 8 个 render:）

- [ ] **Step 5: 跑完整测试链，确保没有副作用**

Run: `./test.sh`
Expected: 全部通过（含现有 632+ 测试 + 9 个新增 render-examples）

- [ ] **Step 6: 提交**

```bash
git add test/render-examples.test.mjs package.json test.sh
git commit -m "test(examples): add render-examples test baseline for demo examples"
```

---

## Task 2：重命名现有 8 条 displayName + 更新 zh/en 前 8 项

把现有 8 条 `displayName` 改为场景化名称，与 spec 第 3 节表格对齐。同步更新 `zh.js` / `en.js` 的 names 前 8 项。

**Files:**

- Modify: `demo/const/mermaidExamples.js`（仅改元组第 2 项 displayName，源代码不动）
- Modify: `demo/i18n/zh.js`（names 前 8 项改为新中文名）
- Modify: `demo/i18n/en.js`（names 前 8 项改为新英文名）

- [ ] **Step 1: 修改 `demo/const/mermaidExamples.js` 的 default export**

将文末 `export default [ ... ]` 块替换为（保留常量定义不变，仅改元组）：

```js
export default [
  ["flowchart", "Start Process", flowchart],
  ["sequenceDiagram", "Greeting", sequence],
  ["classDiagram", "Animal Class", classDiagram],
  ["stateDiagram-v2", "Basic States", stateDiagram],
  ["erDiagram", "Customer-Order", erDiagram],
  ["pie", "Pets", pie],
  ["gantt", "Simple Tasks", gantt],
  ["xychart-beta", "Product Sales", xychart],
];
```

- [ ] **Step 2: 修改 `demo/i18n/zh.js` 的 names 数组**

将 `names: [...]` 替换为：

```js
  names: [
    "开始处理流程",
    "问候对话",
    "动物类",
    "基础状态",
    "客户订单",
    "宠物分布",
    "基础任务",
    "产品销量",
  ],
```

- [ ] **Step 3: 修改 `demo/i18n/en.js` 的 names 数组**

将 `names: [...]` 替换为：

```js
  names: [
    "Start Process",
    "Greeting",
    "Animal Class",
    "Basic States",
    "Customer-Order",
    "Pets",
    "Simple Tasks",
    "Product Sales",
  ],
```

- [ ] **Step 4: 跑测试，确保 8 条基线仍全部通过**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，9 个测试

- [ ] **Step 5: 提交**

```bash
git add demo/const/mermaidExamples.js demo/i18n/zh.js demo/i18n/en.js
git commit -m "refactor(demo): rename existing 8 examples to scenario-based names"
```

---

## Task 3：flowchart 加中阶 + 复杂示例（#2 Order Approval + #3 CI/CD Pipeline）

**Files:**

- Modify: `demo/const/mermaidExamples.js`（追加 2 条元组）

- [ ] **Step 1: 在 `mermaidExamples.js` 的 flowchart 常量定义之后、export default 之前，追加 2 个新常量**

在文件中找到 `flowchart` 常量定义行（第 3 行），在其下方插入：

```js
  flowchartApproval =
    "graph TD\n" +
    "subgraph 申请人\n" +
    "  A[提交订单] --> B{经理审批}\n" +
    "end\n" +
    "subgraph 审批人\n" +
    "  B -->|通过| C[审核通过]\n" +
    "  B -->|拒绝| D[退回修改]\n" +
    "end\n" +
    "subgraph 系统\n" +
    "  C --> E[生成订单]\n" +
    "  D --> A\n" +
    "end",
  flowchartCicd =
    "graph TD\n" +
    "subgraph Dev\n" +
    "  A[提交代码] --> B[推送分支]\n" +
    "end\n" +
    "subgraph CI\n" +
    "  B --> C[Lint 检查]\n" +
    "  C --> D[单元测试]\n" +
    "  D --> E[构建镜像]\n" +
    "end\n" +
    "subgraph CD\n" +
    "  E --> F[部署测试环境]\n" +
    "  F --> G{验收测试}\n" +
    "  G -->|通过| H[部署生产]\n" +
    "  G -->|失败| I[回滚]\n" +
    "end\n" +
    "subgraph Monitor\n" +
    "  H --> J[监控告警]\n" +
    "  I --> J\n" +
    "end\n" +
    "classDef critical fill:#ff4444,stroke:#333,stroke-width:2px,color:#fff\n" +
    "classDef success fill:#44aa44,stroke:#333,stroke-width:2px,color:#fff\n" +
    "class E,H critical\n" +
    "class C,D,F success\n" +
    "linkStyle 7 stroke:#ff4444,stroke-width:3px\n" +
    "linkStyle 8 stroke:#44aa44,stroke-width:3px",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

修改 `export default [ ... ]`，在 `["flowchart", "Start Process", flowchart],` 之后插入：

```js
  ["flowchart", "Order Approval", flowchartApproval],
  ["flowchart", "CI/CD Pipeline", flowchartCicd],
```

- [ ] **Step 3: 跑测试，验证 2 条新示例渲染通过**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，11 个测试（1 baseline + 8 旧 + 2 新）

如失败，按 spec 第 7 节降级策略调整 Mermaid 源代码。

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex flowchart examples"
```

---

## Task 4：sequenceDiagram 加中阶 + 复杂示例（#5 Retry Mechanism + #6 OAuth Flow）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `sequence` 常量定义之后追加 2 个新常量**

```js
  sequenceRetry =
    "sequenceDiagram\n" +
    "participant C as Client\n" +
    "participant S as Server\n" +
    "Note over C,S: HTTP 请求重试\n" +
    "loop 最多 3 次重试\n" +
    "  C->>S: GET /api/data\n" +
    "  alt 成功\n" +
    "    S-->>C: 200 OK\n" +
    "  else 失败\n" +
    "    S-->>C: 500 Error\n" +
    "    Note over C: 等待 1s 后重试\n" +
    "  end\n" +
    "end\n" +
    "alt 全部失败\n" +
    "  C->>C: 触发降级\n" +
    "end",
  sequenceOauth =
    "sequenceDiagram\n" +
    "autonumber\n" +
    "participant U as User\n" +
    "participant C as Client\n" +
    "participant A as AuthServer\n" +
    "participant R as ResourceServer\n" +
    "rect rgb(240, 248, 255)\n" +
    "  Note over U,A: 1. 授权阶段\n" +
    "  U->>C: 点击登录\n" +
    "  activate C\n" +
    "  C->>A: 跳转授权页\n" +
    "  activate A\n" +
    "  A-->>U: 显示登录页\n" +
    "  U->>A: 输入凭证\n" +
    "  A-->>C: 返回授权码 code\n" +
    "  deactivate A\n" +
    "end\n" +
    "rect rgb(240, 255, 240)\n" +
    "  Note over C,R: 2. 换取令牌\n" +
    "  C->>A: code + client_secret\n" +
    "  activate A\n" +
    "  A-->>C: access_token\n" +
    "  deactivate A\n" +
    "  C->>R: 请求资源 + access_token\n" +
    "  activate R\n" +
    "  R-->>C: 返回用户数据\n" +
    "  deactivate R\n" +
    "  deactivate C\n" +
    "end",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["sequenceDiagram", "Greeting", sequence],` 之后插入：

```js
  ["sequenceDiagram", "Retry Mechanism", sequenceRetry],
  ["sequenceDiagram", "OAuth Flow", sequenceOauth],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，13 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex sequenceDiagram examples"
```

---

## Task 5：classDiagram 加中阶 + 复杂示例（#8 Animal Hierarchy + #9 Strategy Pattern）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `classDiagram` 常量定义之后追加 2 个新常量**

```js
  classHierarchy =
    "classDiagram\n" +
    "class Animal {\n" +
    "  +String name\n" +
    "  +int age\n" +
    "  +eat() void\n" +
    "  +sleep() void\n" +
    "}\n" +
    "class Dog {\n" +
    "  +String breed\n" +
    "  +bark() void\n" +
    "}\n" +
    "class Cat {\n" +
    "  +boolean indoor\n" +
    "  +meow() void\n" +
    "}\n" +
    "class Bird {\n" +
    "  +double wingspan\n" +
    "  +fly() void\n" +
    "}\n" +
    "Animal <|-- Dog\n" +
    "Animal <|-- Cat\n" +
    "Animal <|-- Bird",
  classStrategy =
    "classDiagram\n" +
    "class Strategy {\n" +
    "  <<interface>>\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class Context {\n" +
    "  -Strategy strategy\n" +
    "  +setStrategy(Strategy) void\n" +
    "  +executeStrategy(int, int) int\n" +
    "}\n" +
    "class AddStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class SubStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class MulStrategy {\n" +
    "  +execute(int, int) int\n" +
    "}\n" +
    "class LoggerFactory {\n" +
    "  <<abstract>>\n" +
    "  +log(String) void\n" +
    "}\n" +
    "note for Strategy \"策略接口：定义算法族\"\n" +
    "note for Context \"上下文：持有策略引用\"\n" +
    "Strategy <|.. AddStrategy\n" +
    "Strategy <|.. SubStrategy\n" +
    "Strategy <|.. MulStrategy\n" +
    "Context *-- Strategy : 组合\n" +
    "Context ..> LoggerFactory : 依赖",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["classDiagram", "Animal Class", classDiagram],` 之后插入：

```js
  ["classDiagram", "Animal Hierarchy", classHierarchy],
  ["classDiagram", "Strategy Pattern", classStrategy],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，15 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex classDiagram examples"
```

---

## Task 6：stateDiagram-v2 加中阶 + 复杂示例（#11 Order State Machine + #12 Elevator Dispatch）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `stateDiagram` 常量定义之后追加 2 个新常量**

```js
  stateOrder =
    "stateDiagram-v2\n" +
    "[*] --> 待支付\n" +
    "待支付 --> 已支付 : 用户付款\n" +
    "待支付 --> 已取消 : 超时或用户取消\n" +
    "state 已支付 {\n" +
    "  [*] --> 待发货\n" +
    "  待发货 --> 已发货 : 商家发货\n" +
    "  已发货 --> 已签收 : 用户签收\n" +
    "}\n" +
    "已签收 --> 已完成 : 自动确认 7 天后\n" +
    "已取消 --> [*]\n" +
    "已完成 --> [*]\n" +
    "note right of 待支付\n" +
    "  30 分钟未付款\n" +
    "  自动取消\n" +
    "end note",
  stateElevator =
    "stateDiagram-v2\n" +
    "[*] --> 空闲\n" +
    "空闲 --> 接收指令 : 按钮按下\n" +
    "接收指令 --> fork_state\n" +
    "state fork_state <<fork>>\n" +
    "fork_state --> 上行 : 目标楼层在上\n" +
    "fork_state --> 下行 : 目标楼层在下\n" +
    "上行 --> 到达 : 到达目标\n" +
    "下行 --> 到达 : 到达目标\n" +
    "state 到达 {\n" +
    "  [*] --> 门打开\n" +
    "  门打开 --> 门保持\n" +
    "  门保持 --> 门关闭 : 5 秒后\n" +
    "  门关闭 --> [*]\n" +
    "}\n" +
    "state join_state <<join>>\n" +
    "到达 --> join_state\n" +
    "join_state --> 空闲\n" +
    "空闲 --> 报警 : 紧急按钮\n" +
    "报警 --> [*]\n" +
    "note right of 空闲\n" +
    "  历史状态：电梯\n" +
    "  会记住上次方向\n" +
    "end note",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["stateDiagram-v2", "Basic States", stateDiagram],` 之后插入：

```js
  ["stateDiagram-v2", "Order State Machine", stateOrder],
  ["stateDiagram-v2", "Elevator Dispatch", stateElevator],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，17 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex stateDiagram-v2 examples"
```

---

## Task 7：erDiagram 加中阶 + 复杂示例（#14 E-commerce Core + #15 Banking System）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `erDiagram` 常量定义之后追加 2 个新常量**

```js
  erEcommerce =
    "erDiagram\n" +
    "CUSTOMER ||--o{ ORDER : places\n" +
    "ORDER ||--|{ ORDER_ITEM : contains\n" +
    "ORDER_ITEM }|--|| PRODUCT : refers_to\n" +
    "PRODUCT }o--o{ CATEGORY : belongs_to\n" +
    "CUSTOMER {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "  string email\n" +
    "}\n" +
    "ORDER {\n" +
    "  int id PK\n" +
    "  int customer_id FK\n" +
    "  datetime created_at\n" +
    "}\n" +
    "ORDER_ITEM {\n" +
    "  int id PK\n" +
    "  int order_id FK\n" +
    "  int product_id FK\n" +
    "  int quantity\n" +
    "}\n" +
    "PRODUCT {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "  decimal price\n" +
    "}\n" +
    "CATEGORY {\n" +
    "  int id PK\n" +
    "  string name\n" +
    "}",
  erBanking =
    "erDiagram\n" +
    "CUSTOMER ||--o{ ACCOUNT : owns\n" +
    "ACCOUNT ||--o{ TRANSACTION : has\n" +
    "CUSTOMER ||--o{ CARD : has\n" +
    "ACCOUNT ||--o{ LOAN : secures\n" +
    "CARD }o--|| ACCOUNT : linked_to\n" +
    "CUSTOMER {\n" +
    "  int id PK\n" +
    "  string name UK\n" +
    "  string id_card UK\n" +
    "  string phone\n" +
    "  datetime created_at\n" +
    "}\n" +
    "ACCOUNT {\n" +
    "  string account_no PK\n" +
    "  int customer_id FK\n" +
    "  decimal balance\n" +
    "  string currency\n" +
    "  datetime opened_at\n" +
    "}\n" +
    "TRANSACTION {\n" +
    "  bigint id PK\n" +
    "  string from_account FK\n" +
    "  string to_account FK\n" +
    "  decimal amount\n" +
    "  datetime trans_at\n" +
    "}\n" +
    "CARD {\n" +
    "  string card_no PK\n" +
    "  int customer_id FK\n" +
    "  string account_no FK\n" +
    "  date expire_date\n" +
    "  string card_type\n" +
    "}\n" +
    "LOAN {\n" +
    "  bigint id PK\n" +
    "  string account_no FK\n" +
    "  decimal principal\n" +
    "  decimal rate\n" +
    "  int term_months\n" +
    "}",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["erDiagram", "Customer-Order", erDiagram],` 之后插入：

```js
  ["erDiagram", "E-commerce Core", erEcommerce],
  ["erDiagram", "Banking System", erBanking],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，19 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex erDiagram examples"
```

---

## Task 8：pie 加中阶 + 复杂示例（#17 Device Share + #18 Browser Market）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `pie` 常量定义之后追加 2 个新常量**

```js
  pieDevice =
    "pie title 设备流量分布 2024\n" +
    '"移动端" : 60\n' +
    '"桌面端" : 25\n' +
    '"平板" : 10\n' +
    '"其他" : 5',
  pieBrowser =
    '%%{init: {"themeVariables": {"pie1": "#FF6384", "pie2": "#36A2EB", "pie3": "#FFCE56", "pie4": "#4BC0C0", "pie5": "#9966FF", "pie6": "#FF9F40"}}}%%\n' +
    "pie title 全球浏览器市场份额 2024 Q4 (StatCounter)\n" +
    '"Chrome" : 65\n' +
    '"Safari" : 18\n' +
    '"Edge" : 5\n' +
    '"Firefox" : 3\n' +
    '"Samsung Internet" : 2.5\n' +
    '"其他" : 6.5',
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["pie", "Pets", pie],` 之后插入：

```js
  ["pie", "Device Share", pieDevice],
  ["pie", "Browser Market", pieBrowser],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，21 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex pie examples"
```

---

## Task 9：gantt 加中阶 + 复杂示例（#20 Software Project + #21 Quarterly Plan）

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `gantt` 常量定义之后追加 2 个新常量**

```js
  ganttSoftware =
    "gantt\n" +
    "  title 软件开发项目甘特图\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  section 需求\n" +
    "  需求分析     :done,    req, 2024-01-01, 7d\n" +
    "  需求评审     :done,    req2, after req, 2d\n" +
    "  section 设计\n" +
    "  UI 设计      :active,  ui, 2024-01-10, 10d\n" +
    "  架构设计     :         arch, 2024-01-10, 7d\n" +
    "  section 开发\n" +
    "  前端开发     :         fe, after ui, 14d\n" +
    "  后端开发     :         be, after arch, 14d\n" +
    "  联调         :         int, after fe, 7d\n" +
    "  section 测试\n" +
    "  测试         :         test, after int, 7d\n" +
    "  上线         :milestone, mil, after test, 0d",
  ganttQuarterly =
    "gantt\n" +
    "  title 2024 Q1-Q2 跨季度项目\n" +
    "  dateFormat YYYY-MM-DD\n" +
    "  excludes weekends, 2024-01-01, 2024-02-10, 2024-02-12, 2024-04-04, 2024-05-01\n" +
    "  section Q1\n" +
    "  立项         :done, q1a, 2024-01-02, 5d\n" +
    "  调研         :done, q1b, after q1a, 10d\n" +
    "  原型开发     :crit, q1c, after q1b, 15d\n" +
    "  内部测试     :crit, q1d, after q1c, 5d\n" +
    "  section Q2\n" +
    "  公测         :q2a, after q1d, 14d\n" +
    "  Bug 修复     :crit, q2b, after q2a, 7d\n" +
    "  正式发布     :milestone, mil, after q2b, 0d\n" +
    "  运营推广     :q2c, after mil, 14d",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["gantt", "Simple Tasks", gantt],` 之后插入：

```js
  ["gantt", "Software Project", ganttSoftware],
  ["gantt", "Quarterly Plan", ganttQuarterly],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，23 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex gantt examples"
```

---

## Task 10：xychart-beta 加中阶 + 复杂示例（#23 Multi-series Chart + #24 Quarterly Revenue）

**注意：** Mermaid 11.15 的 `xychart-beta` 对多组 bar 的支持有限。如果 Step 3 测试失败，按 spec 第 7 节降级策略——把第二条 bar 删掉，改为更丰富的单组 bar + 长分类轴。

**Files:**

- Modify: `demo/const/mermaidExamples.js`

- [ ] **Step 1: 在 `xychart` 常量定义之后追加 2 个新常量**

```js
  xychartMulti =
    "xychart-beta\n" +
    'title "三款产品季度销量对比"\n' +
    'x-axis ["Q1", "Q2", "Q3", "Q4"]\n' +
    'y-axis "销量（万件）" 0 --> 300\n' +
    "bar [150, 180, 210, 250]\n" +
    "bar [80, 120, 150, 200]\n" +
    "bar [200, 190, 170, 160]",
  xychartRevenue =
    "xychart-beta\n" +
    'title "季度营收对比 2023 vs 2024"\n' +
    'x-axis ["Q1-23", "Q2-23", "Q3-23", "Q4-23", "Q1-24", "Q2-24", "Q3-24", "Q4-24"]\n' +
    'y-axis "营收（百万 USD）" 0 --> 300\n' +
    "bar [120, 145, 168, 198]\n" +
    "bar [142, 178, 201, 245]",
```

- [ ] **Step 2: 在 `export default` 数组中追加 2 条元组**

在 `["xychart-beta", "Product Sales", xychart],` 之后插入：

```js
  ["xychart-beta", "Multi-series Chart", xychartMulti],
  ["xychart-beta", "Quarterly Revenue", xychartRevenue],
```

- [ ] **Step 3: 跑测试**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，25 个测试（1 baseline + 24 render）

**如果失败**（Mermaid 11.15 不支持多组 bar），降级：

将 `xychartMulti` 改为：

```js
  xychartMulti =
    "xychart-beta\n" +
    'title "六款产品季度销量（含趋势线）"\n' +
    'x-axis ["Product A", "Product B", "Product C", "Product D", "Product E", "Product F"]\n' +
    'y-axis "销量（万件）" 0 --> 300\n' +
    "bar [150, 220, 180, 90, 250, 175]\n" +
    "line [180, 200, 175, 150, 180, 170]",
```

将 `xychartRevenue` 改为：

```js
  xychartRevenue =
    "xychart-beta\n" +
    'title "2024 八季度营收走势"\n' +
    'x-axis ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"]\n' +
    'y-axis "营收（百万 USD）" 0 --> 300\n' +
    "bar [120, 145, 168, 198, 142, 178, 201, 245]",
```

降级后重跑测试。

- [ ] **Step 4: 提交**

```bash
git add demo/const/mermaidExamples.js
git commit -m "feat(demo): add intermediate and complex xychart-beta examples"
```

---

## Task 11：更新 `zh.js` / `en.js` 的 names 后 16 项

**Files:**

- Modify: `demo/i18n/zh.js`
- Modify: `demo/i18n/en.js`

- [ ] **Step 1: 替换 `demo/i18n/zh.js` 的整个 names 数组**

```js
  names: [
    // flowchart
    "开始处理流程",
    "订单审批流程",
    "CI/CD 流水线",
    // sequenceDiagram
    "问候对话",
    "重试机制",
    "OAuth 授权流程",
    // classDiagram
    "动物类",
    "动物分类",
    "策略模式",
    // stateDiagram-v2
    "基础状态",
    "订单状态机",
    "电梯调度",
    // erDiagram
    "客户订单",
    "电商核心",
    "银行系统",
    // pie
    "宠物分布",
    "设备占比",
    "浏览器市场",
    // gantt
    "基础任务",
    "软件项目",
    "季度规划",
    // xychart-beta
    "产品销量",
    "多组数据",
    "季度营收",
  ],
```

- [ ] **Step 2: 替换 `demo/i18n/en.js` 的整个 names 数组**

```js
  names: [
    // flowchart
    "Start Process",
    "Order Approval",
    "CI/CD Pipeline",
    // sequenceDiagram
    "Greeting",
    "Retry Mechanism",
    "OAuth Flow",
    // classDiagram
    "Animal Class",
    "Animal Hierarchy",
    "Strategy Pattern",
    // stateDiagram-v2
    "Basic States",
    "Order State Machine",
    "Elevator Dispatch",
    // erDiagram
    "Customer-Order",
    "E-commerce Core",
    "Banking System",
    // pie
    "Pets",
    "Device Share",
    "Browser Market",
    // gantt
    "Simple Tasks",
    "Software Project",
    "Quarterly Plan",
    // xychart-beta
    "Product Sales",
    "Multi-series Chart",
    "Quarterly Revenue",
  ],
```

- [ ] **Step 3: 跑测试，确保无副作用**

Run: `bun test test/render-examples.test.mjs`
Expected: PASS，25 个测试

- [ ] **Step 4: 提交**

```bash
git add demo/i18n/zh.js demo/i18n/en.js
git commit -m "feat(i18n): add zh/en names for 24 demo examples"
```

---

## Task 12：批量更新其余 76 个 i18n 文件

写一次性脚本，对每个非 zh/en 的语言文件：保留前 8 项本地化，追加 en.js 的后 16 项作为英文占位。

**Files:**

- Create: `scripts/i18n-expand.mjs`
- Modify: `demo/i18n/{76 个文件}.js`

- [ ] **Step 1: 创建 `scripts/i18n-expand.mjs`**

```js
// 一次性脚本：将 demo/i18n/*.js（除 zh.js / en.js）的 names 数组扩到 24 项
// 前 8 项保留本地化，后 16 项追加 en.js 的英文作为占位。
// 跑一次：bun scripts/i18n-expand.mjs
// 跑完后可保留作为参考，或删除。

import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const I18N_DIR = "demo/i18n";
const SKIP_FILES = new Set(["zh.js", "en.js"]);

// 从 en.js 提取 names 数组（默认 export 工厂函数返回对象的 names 字段）
const readNames = async (file) => {
  const content = await readFile(file, "utf8");
  const match = content.match(/names:\s*\[([\s\S]*?)\],?/);
  if (!match) throw new Error("names 数组未找到 in " + file);
  // 解析每个被引号包围的字符串项（兼容 " 和 '）
  const items = [];
  const re = /["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(match[1])) !== null) items.push(m[1]);
  return items;
};

// 从源文件提取前 8 项 names（保留本地化）
const extractFirst8 = async (file) => {
  const names = await readNames(file);
  if (names.length < 8) {
    throw new Error(file + " names 数组少于 8 项，实际 " + names.length);
  }
  return names.slice(0, 8);
};

// 替换源文件中的 names 数组为新数组
const replaceNames = (content, newNames) => {
  // 缩进 4 空格，每行一项，符合现有风格
  const body = "names: [\n" + newNames.map((n) => '    "' + n + '",').join("\n") + "\n  ],";
  return content.replace(/names:\s*\[([\s\S]*?)\],?/, body);
};

const main = async () => {
  const enNames = await readNames(I18N_DIR + "/en.js");
  if (enNames.length !== 24) {
    throw new Error("en.js names 应有 24 项，实际 " + enNames.length);
  }
  const enTail16 = enNames.slice(8); // 后 16 项英文占位

  const files = (await readdir(I18N_DIR)).filter((f) => f.endsWith(".js") && !SKIP_FILES.has(f));

  console.log("Processing " + files.length + " files...");
  let processed = 0;
  for (const f of files) {
    const filepath = I18N_DIR + "/" + f;
    const content = await readFile(filepath, "utf8");
    const first8 = await extractFirst8(filepath);
    const newNames = [...first8, ...enTail16];
    const newContent = replaceNames(content, newNames);
    await writeFile(filepath, newContent);
    processed++;
  }
  console.log("Done. Processed " + processed + " files.");
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: 运行脚本**

Run: `bun scripts/i18n-expand.mjs`
Expected: 输出 `Processing 76 files...` + `Done. Processed 76 files.`

- [ ] **Step 3: 抽样验证 3 个文件结构正确**

Run: `bun -e 'import("./demo/i18n/ja.js").then(m => console.log(m.default().names.length))'`
Expected: `24`

Run: `bun -e 'import("./demo/i18n/fr.js").then(m => console.log(m.default().names.length))'`
Expected: `24`

Run: `bun -e 'import("./demo/i18n/ar.js").then(m => console.log(m.default().names.length))'`
Expected: `24`

- [ ] **Step 4: 验证前 8 项保持本地化、后 16 项为英文占位**

Run: `bun -e 'import("./demo/i18n/ja.js").then(m => { const n = m.default().names; console.log("first8:", n.slice(0,8)); console.log("last16:", n.slice(8)); })'`
Expected:

- first8: 是日语（如 `フローチャート`）
- last16: 是英文（如 `Order Approval`, `CI/CD Pipeline`...）

- [ ] **Step 5: 跑完整测试链**

Run: `./test.sh`
Expected: 全部通过

- [ ] **Step 6: 提交（脚本 + 76 个 i18n 文件一起）**

```bash
git add scripts/i18n-expand.mjs demo/i18n/
git commit -m "feat(i18n): expand 76 non-zh/en locale files with english fallback names"
```

---

## Task 13：最终验证（浏览器 + 完整测试链）

**Files:** 不修改任何文件，仅人工验证。

- [ ] **Step 1: 跑完整测试链**

Run: `./test.sh`
Expected: 全部通过

- [ ] **Step 2: 启动 dev 服务器**

Run: `bun dev`（在另一个终端，或后台运行）
浏览器打开 demo URL（通常是 `http://localhost:5173` 或类似）。

- [ ] **Step 3: 视觉验证 24 张卡片**

- 滚动到 "Examples" 区域
- 确认共 24 张卡片
- 每张卡片的 `.mermaid-code`（源代码）和 `.rendered-svg`（SVG 预览）都正确显示，控制台无红色错误
- 顺序按「类型分组 × 简单→中阶→复杂」排列

- [ ] **Step 4: 切换语言验证**

点击主题切换器旁的语言切换器（或下拉）：

- 中文：24 张卡片标题全中文
- 英文：24 张卡片标题全英文
- 日语（或其他）：前 8 张本地化 + 后 16 张英文

- [ ] **Step 5: 切换主题验证**

点击主题切换器，切换 2-3 个主题：

- 24 张卡片渲染样式应保持一致（颜色、字体）

- [ ] **Step 6: 主预览交互验证**

点击 3 张不同复杂度的卡片（如 #1 简单 flowchart、#3 复杂 CI/CD、#15 复杂 Banking System）：

- 主预览区正确渲染对应 SVG
- 输入框聚焦后光标位置正确

- [ ] **Step 7: 关闭 dev 服务器并清理**

如启动了后台进程，停止它。

---

## 完成条件

- [ ] 13 个 Task 全部完成
- [ ] `mermaidExamples.js` 共 24 条元组
- [ ] `zh.js` / `en.js` names 数组各 24 项
- [ ] 其余 76 个 i18n 文件 names 数组各 24 项（前 8 本地化 + 后 16 英文占位）
- [ ] `test/render-examples.test.mjs` 25 个测试全部通过
- [ ] `./test.sh` 全部通过
- [ ] 浏览器手动验证：24 张卡片渲染、语言切换、主题切换、点击交互均正常

## 不做的事项

- 不引入新 Mermaid 图表类型
- 不改 UI 布局 / 不加 section 分组 / 不加筛选器
- 不改 `demo/index.js` `index.pug` `style.styl` `theme.css`
- 不一次性翻译 76 种语言的后 16 项
