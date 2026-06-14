# Web Demo Loop Final Report

Web Demo Loop 交付总结。所有数据来自机器可读产物（源码、验证报告、构建结果、git 提交链），不含主观估算。

本 Loop 在 Render Loop 与 SVG Output Compatibility Loop 之上，将 Mermaid 输入区、SVG 预览区、示例图库集成到 demo 页面，复用 `@webc.site/math` 设计风格，不实现主题切换、体积对比、i18n 或部署。

---

## 1. Inputs Consumed from Prior Loops

Web Demo Loop 以以下产物为输入，未修改渲染器或归一化器的返回契约：

| 输入       | 路径                                                                | 用途                                                                                 |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 渲染器     | `src/render/mermaid-to-svg.js`                                      | Mermaid 源文本 → 原始 SVG，返回 `[OK, svg, diagramType]` / `[errCode, msg]`          |
| 归一化器   | `src/render/normalize-svg.js`                                       | 原始 SVG → 稳定、确定性、无运行时 JS 的嵌入输出，返回 `[OK, svg]` / `[errCode, msg]` |
| 能力报告   | `workflow/reports/render-capabilities.json`                         | 18/18 用例可渲染，覆盖全部八个 HG-1 MVP diagram 类型                                 |
| 兼容性报告 | `workflow/reports/svg-output-compatibility.json`                    | 18/18 用例归一化通过，`deterministic: true`，`failures: []`                          |
| demo 目录  | `demo/index.pug`, `demo/style.styl`, `demo/webc/**`, `demo/i18n/**` | 上游 `@webc.site/math` 项目结构与视觉资产                                            |

demo 页面通过组合 `renderMermaidToSvg` + `normalizeSvg` 生成最终 SVG，未编写新的渲染或归一化代码。

---

## 2. Output Artifacts Created

| 产物                 | 路径                                     | 产生阶段       |
| -------------------- | ---------------------------------------- | -------------- |
| 示例数据             | `demo/const/mermaidExamples.js`          | implementation |
| 页面模板             | `demo/index.pug`（重写）                 | implementation |
| 页面脚本             | `demo/index.js`（重写）                  | implementation |
| 页面样式             | `demo/style.styl`（重写）                | implementation |
| 页面设计计划         | `docs/web-demo/web-demo-plan.md`         | plan           |
| 验证报告（机器可读） | `workflow/reports/web-demo-report.json`  | verification   |
| 最终报告             | `docs/web-demo-loop-report.md`（本文件） | final-report   |

### 2.1 组合调用方式

```
const renderToSvg = async (mermaidText) => {
  const [code, raw, diagramType] = await renderMermaidToSvg(mermaidText);
  if (code !== RENDER_OK) return [code, raw];
  const [nCode, normalized] = normalizeSvg(raw);
  if (nCode !== NORM_OK) return [nCode, normalized];
  return [RENDER_OK, normalized, diagramType];
};
```

错误码分层透传：渲染层 `0`–`4`，归一化层 `100`–`102`。消费方按数字码即可区分失败层级。

### 2.2 架构选择

未新建 Mermaid web component。渲染逻辑直接在 `demo/index.js` 中组合上游模块，保持最小耦合。上游 `demo/webc/Math.js` 按约束保留不动。

---

## 3. Page Structure

### 3.1 模板（`demo/index.pug`）

```
header
  ├── c-i18n (语言切换组件，保持功能)
  └── github-link

main
  ├── .header-main
  │   ├── h1 #ui-title         "Mermaid → SVG"
  │   └── p #ui-subtitle       "Browser-side Mermaid to SVG converter"
  ├── .main-grid
  │   ├── .usage-card          代码用法示例
  │   ├── .benchmark-card      体积对比占位壳 (TODO size-loop)
  │   └── .editor-card
  │       ├── textarea#mermaid-input
  │       ├── #svg-preview
  │       └── #render-status
  └── .examples-section
      └── #examples-grid       瀑布流示例图库
```

### 3.2 脚本（`demo/index.js`，177 行）

| 功能     | 实现                                                                |
| -------- | ------------------------------------------------------------------- |
| 组合渲染 | `renderToSvg` = `renderMermaidToSvg` → `normalizeSvg` → `innerHTML` |
| 防抖渲染 | `setTimeout(renderInput, 250)`                                      |
| 自动高度 | `adjustHeight()` — `field-sizing: content` + `scrollHeight` 回退    |
| 进入聚焦 | `IntersectionObserver` threshold 1.0                                |
| 示例渲染 | 逐条 `renderToSvg`，真实 Mermaid 渲染，非静态截图                   |
| 点击加载 | `selectExample(src)` 载入编辑器并重新渲染                           |
| 瀑布流   | `layoutWaterfall()` — 1-3 列按容器宽度，`ResizeObserver` 响应       |
| 语言切换 | `onLang(() => {})` 注册回调，保持 `c-i18n` 组件功能                 |

### 3.3 示例数据（`demo/const/mermaidExamples.js`）

8 条示例，覆盖全部 HG-1 MVP diagram 类型，源文本取自已通过的 YAML 测试用例：

| 顺序 | diagramType     | displayName      |
| ---- | --------------- | ---------------- |
| 1    | flowchart       | Flowchart        |
| 2    | sequenceDiagram | Sequence Diagram |
| 3    | classDiagram    | Class Diagram    |
| 4    | stateDiagram-v2 | State Diagram    |
| 5    | erDiagram       | ER Diagram       |
| 6    | pie             | Pie Chart        |
| 7    | gantt           | Gantt Chart      |
| 8    | xychart-beta    | XY Chart         |

### 3.4 错误状态处理

| 错误码  | 常量             | 页面行为                                              |
| ------- | ---------------- | ----------------------------------------------------- |
| 1       | `ERR_EMPTY`      | 清空预览，显示空状态提示（无 `.error` 样式）          |
| 2       | `ERR_PARSE`      | 清空预览，显示 `Parse error: <msg>`（`.error` 样式）  |
| 3       | `ERR_RENDER`     | 清空预览，显示 `Render error: <msg>`（`.error` 样式） |
| 4       | `ERR_TIMEOUT`    | 清空预览，显示 `Render timed out`（`.error` 样式）    |
| 100-102 | normalize errors | 清空预览，显示 `Output error: <msg>`（`.error` 样式） |

切换为合法输入后，错误状态自动清除并恢复渲染。

### 3.5 设计风格复用

| 上游资产   | 复用方式                                                                              |
| ---------- | ------------------------------------------------------------------------------------- |
| 设计 token | `:root` CSS custom properties（`--accent-color`, `--text-color`, `--card-bg` 等）     |
| 玻璃态     | `.Lg` class — `backdrop-filter blur(8px) saturate(150%)`（`demo/webc/Lg/theme.styl`） |
| 卡片基类   | `.card` 共享于 usage-card、benchmark-card、editor-card                                |
| 代码块     | `.code-block` 等宽字体                                                                |
| 瀑布流     | `layoutWaterfall()` + `ResizeObserver` + absolute positioning                         |
| 响应式     | `@media (max-width 768px)` 断点                                                       |
| 主网格     | `.main-grid` CSS grid `1fr 360px`                                                     |

---

## 4. Verification Results

验证报告 `workflow/reports/web-demo-report.json` 记录 8/8 检查通过：

| 验收项               | AC            | 状态 |
| -------------------- | ------------- | ---- |
| Mermaid 输入         | AC-UI-001     | pass |
| SVG 预览             | AC-UI-002     | pass |
| 多类型示例           | AC-UI-003     | pass |
| 错误状态稳定         | AC-UI-004     | pass |
| 设计风格复用         | AC-DESIGN-001 | pass |
| blocked pattern 缺席 | —             | pass |
| Math 残留缺席        | —             | pass |
| 构建 + dev server    | —             | pass |

### 4.1 构建与 dev server

| 项              | 值                                |
| --------------- | --------------------------------- |
| build 命令      | `bun run build`                   |
| build exit code | 0                                 |
| 输出目录        | `demo/dist`                       |
| chunk-size 警告 | >500kB（预期，移交 Size Loop）    |
| dev server      | `bun dev.js`，端口 9999，HTTP 200 |

### 4.2 测试结果

| 测试套件                                       | passed | failed |
| ---------------------------------------------- | ------ | ------ |
| `bun test test/svg-output.test.mjs`            | 29     | 0      |
| `bun test test/render-yml.test.mjs`            | 19     | 0      |
| `bun test test/compare.test.js`（上游 MathML） | 421    | 0      |

---

## 5. Commit Chain

| 顺序 | Phase          | Commit     | 说明                                               |
| ---- | -------------- | ---------- | -------------------------------------------------- |
| 1    | plan           | `44692ed`  | `docs(web-demo): add web demo page plan`           |
| 2    | implementation | `0cdc9bd`  | `feat(web-demo): convert demo page to mermaid svg` |
| 3    | implementation | `6743d6d`  | `chore(web-demo): record demo report`              |
| 4    | verification   | `ff2f0d0`  | `docs(web-demo): record verification evidence`     |
| 5    | final-report   | （本提交） | `docs(web-demo): write web demo loop final report` |

implementation 阶段修改的文件：`demo/const/mermaidExamples.js`（新增）、`demo/index.js`（重写）、`demo/index.pug`（重写）、`demo/style.styl`（重写）。

---

## 6. Blocked Patterns Compliance

| 禁止 pattern            | 检查文件                          | 发现次数 |
| ----------------------- | --------------------------------- | -------- |
| `database`              | `demo/index.pug`, `demo/index.js` | 0        |
| `queue`                 | 同上                              | 0        |
| `server API`            | 同上                              | 0        |
| `Cloudflare deployment` | 同上                              | 0        |

Math 残留检查：核心 demo 文件（`index.pug`, `index.js`, `mermaidExamples.js`, `style.styl`）中零 Math 引用。上游 `demo/i18n/*.js` 仍含 Math key，按 I18N Loop 处理。

---

## 7. Constraints Compliance Checklist

| 约束                                           | 状态                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| 基于已有渲染器和归一化器（不新写渲染代码）     | 已满足（`renderToSvg` 组合上游两个模块）                       |
| 页面展示结果为 SVG（非截图/canvas/静态图片）   | 已满足（`innerHTML = normalizeSvg(renderMermaidToSvg(text))`） |
| 输入变化后图像结果随之更新                     | 已满足（250ms 防抖 `oninput` → 重新渲染）                      |
| 错误输入页面不崩溃                             | 已满足（空/非法/超时/归一化错误均有状态分支）                  |
| 复用 `@webc.site/math` 设计风格                | 已满足（token、玻璃态、卡片、瀑布流、响应式网格）              |
| 不工作于主题切换 / 体积对比 / i18n / 部署      | 已满足（对应区域为占位壳或 TODO 标记）                         |
| 不修改 `src/**`                                | 已满足（仅组合调用，未改渲染器或归一化器）                     |
| 不修改上游 `demo/webc/Math.js`                 | 已满足（保留不动）                                             |
| 不修改 parent canonical docs / `references/**` | 已满足                                                         |

---

## 8. Deferred Scope and Handoff Points

以下职责**明确移交**后续 Loop，本 Loop 未触碰：

| 职责                                                  | 移交 Loop   | 当前状态                                                                                                    |
| ----------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| Beautiful Mermaid CSS 主题切换                        | Theme Loop  | 未开始；页面无主题按钮                                                                                      |
| 与 `beautiful-mermaid` 的 JS/gzip 体积对比 SVG 柱状图 | Size Loop   | `.benchmark-card` 为占位壳，`index.pug` 标记 `TODO(size-loop)`                                              |
| 75 语言 Mermaid 页面文案接入                          | I18N Loop   | 页面 UI 文案为硬编码英文，`index.pug`/`index.js` 标记 `TODO(i18n-loop)`；`demo/i18n/*.js` 仍为上游 Math key |
| Cloudflare Pages 部署配置                             | Deploy Loop | 未开始                                                                                                      |
| 主题切换按钮                                          | Theme Loop  | 页面无主题切换控件                                                                                          |

### 关键 handoff 标记

- `index.pug` 内 `TODO(size-loop)`：体积对比 SVG 柱状图接入点
- `index.pug` / `index.js` 内 `TODO(i18n-loop)`：共 10 处待提取为 i18n key 的文案
- chunk-size 警告 >500kB：预期产物，Size Loop 负责生成体积报告

---

## 9. Conclusion

- demo 页面已完成 Mermaid 输入区、SVG 预览区、8 类型示例图库集成，通过真实 Mermaid 浏览器端渲染，非静态截图。
- 渲染路径清晰：`renderMermaidToSvg` → `normalizeSvg` → `innerHTML`，未新增渲染或归一化代码。
- 设计风格全面复用 `@webc.site/math` 的 token、玻璃态、卡片系统、瀑布流与响应式布局。
- 8/8 验收检查通过，构建 exit code 0，dev server HTTP 200，全部测试套件零失败。
- 主题切换、体积对比图、i18n 文案、Cloudflare Pages 部署明确移交后续 Loop，对应接入点已标记 TODO。

Web Demo Loop gate 达成。
