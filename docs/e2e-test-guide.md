# Mermaid → SVG 端到端测试指南

> 本文档供测试工程师按步骤执行。覆盖浏览器手动 E2E、构建产物验证、自动化测试三大类。
> 验收依据：项目 Human Gate 决策（HG-1 ~ HG-7），见 `workflow/human-gate-decisions.md`。

## 1. 项目概览

**被测对象**：浏览器端 Mermaid → SVG 转换器（`@webc.site/math`）。

**核心链路**：`renderMermaidToSvg(mermaid 源码)` → 返回 `[code, rawSvg, diagramType]` → `normalizeSvg(rawSvg)` → 返回 `[ok, 干净SVG]` → 页面展示。

**MVP 支持的 8 种图表**（HG-1）：flowchart、sequenceDiagram、classDiagram、stateDiagram-v2、erDiagram、pie、gantt、xychart-beta。

**关键质量要求**（HG-3）：

- 输出 SVG 含 `<svg>` 根 + 可用 `viewBox`
- 等价输入产出确定性输出
- 错误结果明确且结构化
- 输出 SVG 无运行时 JS（无 `<script>`、无 `on*` 事件属性、无 `javascript:` 链接）

## 2. 环境准备

### 2.1 前置依赖

- Node.js ≥ 20（推荐 24）
- bun（构建/dev server 运行时）
- pnpm（包管理）
- 现代浏览器（Chrome / Edge / Firefox 最新版）

### 2.2 安装与启动

在项目根目录 `mermaid2svg/` 执行：

```bash
# 安装依赖（首次或依赖变更后）
pnpm install

# 方式 A：开发模式（热更新，推荐手动测试用）
bun dev
# → 终端打印本地地址，通常为 http://localhost:9999/

# 方式 B：生产构建 + 本地静态预览（验证部署产物）
pnpm build                      # 产物输出到 demo/dist/
python3 -m http.server 8080 --directory demo/dist
# → 浏览器打开 http://localhost:8080/
```

### 2.3 页面主要 UI 元素（测试时定位用）

| 元素           | 选择器            | 说明                    |
| -------------- | ----------------- | ----------------------- |
| Mermaid 输入框 | `#mermaid-input`  | 交互式编辑器的 textarea |
| SVG 预览区     | `#svg-preview`    | 实时渲染结果            |
| 渲染状态/错误  | `#render-status`  | 错误提示在此显示        |
| 主题切换器     | `#theme-switcher` | 位于编辑器标题旁        |
| 语言切换       | `c-i18n` 组件     | 位于页面右上角 header   |
| 示例区         | `#examples-grid`  | 8 种图表示例            |
| 体积对比图     | `#size-chart`     | Size Comparison 卡片    |

### 2.4 浏览器 DevTools 辅助脚本（强烈推荐）

打开浏览器 DevTools → Console，粘贴下方脚本并回车，可一次性自动检查当前页面所有 SVG 的质量（viewBox / script / on\* 属性）。**整个测试过程中可反复调用 `checkSvg()`**：

```js
function checkSvg() {
  const svgs = document.querySelectorAll("svg");
  let noViewBox = 0,
    hasScript = 0,
    hasOnAttr = 0;
  svgs.forEach((s) => {
    if (!s.getAttribute("viewBox")) noViewBox++;
    if (s.querySelector("script")) hasScript++;
    if (/\son\w+=/i.test(s.outerHTML)) hasOnAttr++;
  });
  console.log(`SVG 总数: ${svgs.length}`);
  console.log(`缺 viewBox: ${noViewBox}（应为 0）`);
  console.log(`含 <script>: ${hasScript}（应为 0）`);
  console.log(`含 on* 事件属性: ${hasOnAttr}（应为 0）`);
  console.log(
    noViewBox === 0 && hasScript === 0 && hasOnAttr === 0 ? "✅ SVG 质量合格" : "❌ 存在不合格项",
  );
}
checkSvg();
```

## 3. 测试用例

> 判定标记：✅ Pass / ❌ Fail。每个用例需记录实际结果。

### 模块 A：基础渲染（8 种图表）

**目标**：HG-1 的 8 种 MVP 图表都能正确渲染出 SVG。

**前置**：`bun dev` 启动，浏览器打开本地地址。

**操作**：在 `#mermaid-input` 中依次粘贴下表源码，每次观察 `#svg-preview` 是否渲染出图形。

| 编号 | 图表类型        | 粘贴到输入框的 Mermaid 源码                                                                                                                                                                                                                        | 预期                                 |
| ---- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| A1   | flowchart       | `graph TD`<br>`A[Start] --> B[Process] --> C[End]`                                                                                                                                                                                                 | 出现 3 个方框 + 箭头                 |
| A2   | sequenceDiagram | `sequenceDiagram`<br>`Alice->>Bob: Hello`<br>`Bob-->>Alice: Hi`                                                                                                                                                                                    | 出现 Alice/Bob 两条生命线 + 两条消息 |
| A3   | classDiagram    | `classDiagram`<br>`class Animal {`<br>`  +String name`<br>`  +int age`<br>`  +eat() void`<br>`  +sleep() void`<br>`}`                                                                                                                              | 出现 Animal 类框，含属性和方法       |
| A4   | stateDiagram-v2 | `stateDiagram-v2`<br>`[*] --> Idle`<br>`Idle --> Running : start`<br>`Running --> [*] : stop`                                                                                                                                                      | 出现 Idle/Running 状态 + 转移箭头    |
| A5   | erDiagram       | `erDiagram`<br>`CUSTOMER \|\|--o{ ORDER : places`                                                                                                                                                                                                  | 出现 CUSTOMER/ORDER 实体 + 关系线    |
| A6   | pie             | `pie`<br>`  title "Pets"`<br>`  "Dogs" : 10`<br>`  "Cats" : 5`                                                                                                                                                                                     | 出现饼图，Dogs/Cats 两块             |
| A7   | gantt           | `gantt`<br>`  dateFormat  YYYY-MM-DD`<br>`  title Adding GANTT diagram to mermaid`<br>`  section A section`<br>`  Completed task            :done,    des1, 2014-01-06,2014-01-08`<br>`  Active task               :active,  des2, 2014-01-09, 3d` | 出现甘特图时间轴 + 任务条            |
| A8   | xychart-beta    | `xychart-beta`<br>`title "Product Sales"`<br>`x-axis [Widgets, Gadgets, Gizmos, Doodads, Thingamajigs]`<br>`bar [150, 230, 180, 95, 310]`                                                                                                          | 出现柱状图，5 根柱子                 |

**判定**：8 项全部渲染出符合该图表类型的图形 → 模块 A 通过。

---

### 模块 B：SVG 输出质量（HG-3 核心）

**目标**：所有渲染出的 SVG 满足干净性 + 确定性要求。

| 编号 | 检查项                 | 操作                                                                                                                               | 预期                                  | 判定 |
| ---- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---- |
| B1   | viewBox 完整           | 执行任意渲染后，Console 调用 `checkSvg()`                                                                                          | "缺 viewBox: 0"                       |      |
| B2   | 无 script              | 同上                                                                                                                               | "含 `<script>`: 0"                    |      |
| B3   | 无 on\* 事件属性       | 同上                                                                                                                               | "含 on\* 事件属性: 0"                 |      |
| B4   | 确定性（等价输入一致） | 同一源码粘贴两次（中间清空）：每次渲染后，Console 执行 `document.querySelector('#svg-preview svg').outerHTML.length`，记录两次长度 | 两次 outerHTML 长度一致（内容应相同） |      |

**判定**：B1/B2/B3 必须全部 0；B4 两次长度一致 → 模块 B 通过。

---

### 模块 C：交互式编辑器

| 编号 | 操作                                     | 预期                                                   | 判定 |
| ---- | ---------------------------------------- | ------------------------------------------------------ | ---- |
| C1   | 页面加载后编辑器默认有内容并渲染         | `#svg-preview` 显示默认 flowchart（Start/Process/End） |      |
| C2   | 修改输入框内容                           | `#svg-preview` 实时更新（无需手动点按钮）              |      |
| C3   | 清空输入框（全选删除）                   | 触发空输入处理（见模块 F-1），不崩页                   |      |
| C4   | 输入超长文本（如重复粘贴 A1 源码 50 次） | 页面不卡死，能正常渲染或给出错误                       |      |

---

### 模块 D：主题切换（HG-4）

**目标**：9 个主题可切换；默认主题不依赖外部 CDN；切换后持久化。

主题列表（来自 `demo/const/themes.js`）：

| ID                 | 显示名                                       |
| ------------------ | -------------------------------------------- |
| `mermaid-default`  | Mermaid Default（哨兵主题，不应用 CSS 覆盖） |
| `zinc-light`       | Zinc Light                                   |
| `zinc-dark`        | Zinc Dark                                    |
| `tokyo-night`      | Tokyo Night                                  |
| `catppuccin-mocha` | Catppuccin Mocha                             |
| `nord`             | Nord                                         |
| `github-light`     | GitHub Light                                 |
| `github-dark`      | GitHub Dark                                  |
| `dracula`          | Dracula                                      |

| 编号 | 操作                                                                   | 预期                                                  | 判定 |
| ---- | ---------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| D1   | 依次点击 9 个主题                                                      | 每次切换，编辑器/预览区配色（背景/前景/线条）可见变化 |      |
| D2   | 切到某主题后，刷新页面（F5）                                           | 主题保持不变（localStorage key = `m2s-theme`）        |      |
| D3   | 切到 `mermaid-default`，断网（DevTools → Network → Offline），刷新页面 | 页面正常渲染，默认主题不依赖 CDN（HG-4）              |      |
| D4   | Console 执行 `localStorage.getItem('m2s-theme')`                       | 返回当前主题 id                                       |      |

**判定**：D1~D4 全部通过 → 模块 D 通过。

---

### 模块 E：国际化（HG-5）

**目标**：75 个 locale 可切换；UI 文案切换；Mermaid demo key 无缺失。

| 编号 | 操作                                                                                      | 预期                                                                          | 判定 |
| ---- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---- |
| E1   | 点击右上角语言切换，遍历若干代表性 locale（至少：en、zh、ja、ko、de、fr、es、ru、ar、he） | 每次切换，页面标题/按钮/提示等 UI 文案变为对应语言                            |      |
| E2   | 切到阿拉伯语(ar)/希伯来语(he)                                                             | 页面布局变为 RTL（从右到左）                                                  |      |
| E3   | 任选一个 locale，检查"使用方法""体积对比""交互式编辑器""示例"等区块标题                   | 均有翻译或英文回退，**无空白/无缺 key 占位符**（如 `undefined`、`[missing]`） |      |

**判定**：E1~E3 全部通过 → 模块 E 通过。

---

### 模块 F：错误处理（HG-3）

**目标**：异常输入产生结构化错误，页面不崩溃。

| 编号 | 输入（粘贴到 `#mermaid-input`）           | 预期 `#render-status` 显示                                | 判定 |
| ---- | ----------------------------------------- | --------------------------------------------------------- | ---- |
| F1   | （清空，空输入）                          | 空输入提示（如"请输入"/ERR_EMPTY 语义）                   |      |
| F2   | `this is @@@ totally invalid mermaid ###` | 解析错误提示（如"解析错误: No diagram type detected..."） |      |
| F3   | `flowchart TD`<br>`A -->` （不完整语法）  | 解析错误提示，不崩页                                      |      |
| F4   | 任意错误输入后，改回正确源码（如 A1）     | 错误消失，正常恢复渲染                                    |      |

**判定**：F1~F4 全部：错误明确 + 页面不崩 + 可恢复 → 模块 F 通过。

---

### 模块 G：构建产物验证

**目标**：生产构建产物完整、可部署。

```bash
pnpm build
```

| 编号 | 检查项            | 操作                                                             | 预期                                      | 判定 |
| ---- | ----------------- | ---------------------------------------------------------------- | ----------------------------------------- | ---- |
| G1   | 构建成功          | 运行 `pnpm build`                                                | exit code 0，无报错                       |      |
| G2   | 产物完整          | `ls demo/dist/`                                                  | 含 `index.html`、`assets/`、`_headers`    |      |
| G3   | 生产预览可用      | `python3 -m http.server 8080 --directory demo/dist` 后浏览器打开 | 页面正常加载、渲染（与 dev 模式表现一致） |      |
| G4   | 生产产物 SVG 干净 | 在生产预览页 Console 调用 `checkSvg()`                           | 缺 viewBox/script/on\* 全为 0             |      |

## 4. 自动化测试（回归用）

项目已内置自动化测试，建议每次发版/合并前运行：

```bash
pnpm test
```

该命令（`test.sh`）依次执行：

1. `./sh/check.js` — 项目自检
2. `bun x oxfmt --check '!lib/**'` — 代码格式检查
3. `bun minify.js` — 构建 lib
4. `bun x oxlint` — lint
5. `bun test test/compare.test.js --only-failures` — 对比测试

另外两个关键测试文件（可单独运行深入验证）：

- `test/render-yml.test.mjs` — 用 `test/*.yml` 用例（bm-/maid-/mm- 前缀）跑真实渲染，断言 SVG/viewBox/确定性
- `test/svg-output.test.mjs` — 验证 normalize-svg 的去脚本/确定性/错误形状

```bash
# 单独跑渲染测试（Playwright 真实浏览器环境）
bun test test/render-yml.test.mjs
# 单独跑 SVG 输出测试
bun test test/svg-output.test.mjs
```

**自动化覆盖了 B1~B3（SVG 质量）+ 确定性 + 18+ YAML 用例渲染**，手动 E2E 侧重 UI 交互（主题/i18n/错误处理/构建产物）。

## 5. 判定标准

| 等级        | 说明                                                                              |
| ----------- | --------------------------------------------------------------------------------- |
| **P0 阻塞** | 模块 A（8 图表渲染）、模块 B（SVG 质量）、模块 F（错误处理）任一不过 → 不允许发布 |
| **P1 重要** | 模块 D（主题）、模块 E（i18n）、模块 G（构建）不过 → 需修复后发布                 |
| **P2 一般** | 模块 C（编辑器交互）非阻塞性问题 → 记录缺陷，可带病发布                           |

**整体通过标准**：所有 P0 + P1 模块通过，且 `pnpm test` 全绿。

## 6. 缺陷上报模板

发现缺陷时，按以下格式记录：

```
### 缺陷 <编号>
- 模块/用例：<如 模块A-A6 pie>
- 环境：<浏览器+版本、OS、访问方式 dev/build>
- 复现步骤：
  1. ...
  2. ...
- 预期：<...>
- 实际：<...>
- 严重等级：<P0/P1/P2>
- 附件：<截图/Console 报错/checkSvg() 输出>
- 复现概率：<必现/偶发(预估%)>
```

## 7. 附录：常见问题排查

| 现象                                            | 可能原因                                    | 处理                                               |
| ----------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| `bun dev` 报端口占用                            | 9999 被占                                   | `lsof -i:9999` 找进程 kill，或改用生产预览方式     |
| Console 出现 `ResizeObserver loop completed...` | mermaid 渲染时的已知良性警告                | 忽略，不影响功能（非缺陷）                         |
| 主题切换无视觉变化                              | 主题 CSS 未加载                             | 检查 Network 是否有 `theme.css` 404                |
| i18n 切换后部分文案未变                         | 该 locale 走英文回退（设计如此，HG-5 允许） | 确认不是"缺 key"（空白/undefined）即可             |
| `pnpm build` 失败                               | 依赖未装/版本不符                           | `pnpm install` 后重试；确认 Node/bun 版本满足 §2.1 |

---

**文档版本**：1.0 · 对应 `final-audit` 通过后的项目状态（机器验收 44/44）。
