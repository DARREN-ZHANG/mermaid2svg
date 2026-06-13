# Render Loop Final Report

Render Loop 交付总结。所有数据来自机器可读产物（源码、测试输出、能力报告、git 提交），不含主观估算。

---

## 1. Renderer Entry Point

| 项 | 值 |
| --- | --- |
| 文件路径 | `src/render/mermaid-to-svg.js` |
| 导出函数 | `renderMermaidToSvg(mermaidText)` |
| 返回形状 | `[code, svg, diagramType]` 元组 |
| 渲染引擎 | 官方 `mermaid` 浏览器端 API（`import mermaid from "mermaid"`） |

### 错误码常量

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `OK` | 0 | 渲染成功，返回 SVG 字符串与 diagramType |
| `ERR_EMPTY` | 1 | 空输入 |
| `ERR_PARSE` | 2 | 语法/解析错误 |
| `ERR_RENDER` | 3 | 渲染/布局错误 |
| `ERR_TIMEOUT` | 4 | 渲染超时（10s 上限） |

### 实现要点

- 调用 `mermaid.initialize({ startOnLoad: false, securityLevel: "strict", suppressErrorRendering: true })`，仅初始化一次。
- 每次渲染使用唯一 id（`"m2s-" + ++counter`），避免跨用例 id 冲突。
- `Promise.race` 包裹 `mermaid.render` 与超时 Promise，超时后返回 `ERR_TIMEOUT`。
- `classifyError` 通过 name/message 关键字区分 `ERR_PARSE` 与 `ERR_RENDER`。
- 未实现任何 Mermaid parser 或 layout engine，完全依赖官方浏览器端渲染能力。

---

## 2. Render Test Runner

| 项 | 值 |
| --- | --- |
| 文件路径 | `test/render-yml.test.mjs` |
| 测试框架 | Node.js 原生 `node:test` |
| 浏览器 | Playwright Chromium（真实浏览器，仅作 test harness） |
| 模块解析 | Vite middleware（`middlewareMode`，预构建 `mermaid`） |

### 执行流程

1. 读取 `test/schema.yml`，对每条 `test/*.yml` 做 schema 校验，不合格直接阻止渲染。
2. 启动 Vite + 原生 HTTP server，挂载 `/__render_test__` harness 页面。
3. Playwright 启动 Chromium，将渲染器模块预加载到页面全局 `window.__m2s`。
4. 逐条用例在真实浏览器页面内调用 `window.__m2s.renderMermaidToSvg(text)`。
5. 断言主 oracle：SVG 字符串含 `<svg` 根节点、含 `viewBox`、含 YAML 声明的 `expect.svg.containsText`。
6. `after()` 钩子将支持/不支持结果写入能力报告。

### 约束遵守

- Playwright 仅作为 test harness 调用项目渲染器，未作为渲染实现。
- 未使用截图、image snapshot、canvas、pixel data 或静态 SVG fixture 作为 pass/fail oracle。
- 未使用 `@mermaid-js/mermaid-cli`、Puppeteer、服务端渲染或在线转换服务。

---

## 3. Capability Report

| 项 | 值 |
| --- | --- |
| 报告位置 | `workflow/reports/render-capabilities.json` |
| 生成方式 | 测试 `after()` 钩子自动写入，数据与断言结果一致 |

### 汇总

| 指标 | 值 |
| --- | --- |
| total | 18 |
| supported | 18 |
| unsupported | 0 |
| skipped | 0 |

### 按 diagram type 聚合

| Diagram type | Supported | Unsupported |
| --- | --- | --- |
| flowchart | 5 | 0 |
| sequenceDiagram | 3 | 0 |
| classDiagram | 2 | 0 |
| stateDiagram | 2 | 0 |
| erDiagram | 2 | 0 |
| pie | 2 | 0 |
| gantt | 1 | 0 |
| other | 1 | 0 |

### HG-1 MVP 覆盖

八个 HG-1 MVP 类型全部由真实 Mermaid 源文本覆盖（`flowchart`/`graph`、`sequenceDiagram`、`classDiagram`、`stateDiagram-v2`、`erDiagram`、`pie`、`gantt`、`xychart-beta`）。`journey`、`gitGraph`、`mindmap`、`timeline` 等 HG-1 明确排除的类型不在当前测试集中。

---

## 4. Verification Commands and Results

### 命令 1（本阶段验证命令）

```bash
node --test workflow/loops/render/render-loop.test.mjs
```

运行结果（本阶段实测）：

| 指标 | 值 |
| --- | --- |
| tests | 7 |
| pass | 7 |
| fail | 0 |
| skipped | 0 |
| duration_ms | ~67 |
| exit code | 0 |

覆盖内容：package script 指向、opencode config agent 钉死模型、agent 指令边界、loop config 相位拓扑与产物、loop 命名、六份 prompt 文件存在且含约束、validator 接受已交付产物并仍能拒绝缺失产物。

### 命令 2（Phase 05 完整渲染验证）

```bash
node --test test/render-yml.test.mjs workflow/loops/render/render-loop.test.mjs
```

运行结果（Phase 05 实测，原始输出存于 `workflow/runs/render/phase05-validation-output.txt`）：

| 指标 | 值 |
| --- | --- |
| tests | 26 |
| suites | 1 |
| pass | 26 |
| fail | 0 |
| skipped | 0 |
| duration_ms | ~709 |
| exit code | 0 |

26 项拆解：1 项 schema 校验 + 18 项逐用例渲染断言 + 7 项 loop 契约测试。

两次运行结果稳定（两次连续测量约 693.9ms 与 709.5ms，因启动真实 Chromium 而略有波动，pass/fail 结果一致）。

---

## 5. Render Loop Phase 提交链

| Phase | Commit | 说明 |
| --- | --- | --- |
| prerequisites | `96f65ad` | `chore(deps): add mermaid and playwright for render loop prerequisites` |
| renderer-plan | `e80c4e0` | `docs(render): add renderer implementation plan` |
| renderer-implementation | `3fd0f67` | `feat(render): add mermaid-to-svg browser renderer` |
| render-test-runner | `c3efafa` | `test(render): add YAML render test runner and capabilities report` |
| validation | `2034bf9` | `docs(render): record phase 05 render validation results` |

renderer-implementation 与 render-test-runner 阶段均经 subagent-driven-development 完成 spec compliance review 与 code quality review（见 `workflow/runs/render/*.status.json` 的 children 记录）。

---

## 6. Delivered Artifacts

| 产物 | 路径 |
| --- | --- |
| 渲染器 | `src/render/mermaid-to-svg.js` |
| 渲染测试 runner | `test/render-yml.test.mjs` |
| 能力报告 | `workflow/reports/render-capabilities.json` |
| 渲染器实现说明 | `docs/render/renderer-implementation.md` |
| 渲染器设计计划 | `docs/render/renderer-plan.md` |
| Phase 05 验证记录 | `docs/render/render-validation.md` |
| Phase 05 原始输出 | `workflow/runs/render/phase05-validation-output.txt` |

---

## 7. Remaining Scope for SVG Output Compatibility Loop

Render Loop 只保证「能渲染出含 `<svg` 和 `viewBox` 的 SVG 字符串」。以下规范化职责留给后续 SVG Output Compatibility Loop，不在本阶段范围：

1. **viewBox / 尺寸规范化** — 当前 viewBox 来自 Mermaid 原始输出，尚未做统一裁剪或尺寸归一；需保证所有支持类型输出可用 viewBox。
2. **确定性输出** — 尚未对 SVG 内部随机 id（Mermaid 生成的 element id）做去随机化或稳定化，同输入多次运行的字节级一致性待验证。
3. **不安全内容清理** — `securityLevel: "strict"` 已在渲染层启用，但 SVG Output Layer 需独立校验输出不含运行时 JS、`<script>`、外部资源引用等不安全内容。
4. **错误结果形状规范化** — 当前错误返回 `[code, msg]`，SVG Output Layer 需定义面向消费方的明确错误结构契约。
5. **SVG 结构断言加固** — 当前 runner 断言 `<svg` 与 `viewBox` 字符串包含；SVG Output Loop 应补充根节点合法性、namespace、子结构稳定性的结构化断言。
6. **embeddable 契约** — 验证输出 SVG 可直接嵌入前端页面（含 demo 与 Cloudflare Pages 部署环境），不依赖运行时 JS。

以上项均不涉及自研 parser 或 layout engine，仅在 Mermaid 浏览器端渲染产物之上做结构规范化。

---

## 8. Constraints Compliance Checklist

| 约束 | 状态 |
| --- | --- |
| 使用官方 Mermaid 浏览器端 API | 已满足（`import mermaid from "mermaid"`） |
| 不自研 Mermaid parser | 已满足 |
| 不自研 Mermaid layout engine | 已满足 |
| Playwright 仅作 test harness | 已满足 |
| 不用截图/canvas/pixel/静态 fixture 作 oracle | 已满足 |
| 不用 mermaid-cli / puppeteer / 服务端渲染 | 已满足 |

---

## 9. Conclusion

- 渲染器入口 `src/render/mermaid-to-svg.js` 已交付并通过真实浏览器渲染验证。
- 18 条抽取 YAML 用例全部渲染成功，零 unsupported，零 skip，exit code 0。
- 八个 HG-1 MVP diagram 类型全部被真实源文本覆盖。
- 能力报告 `workflow/reports/render-capabilities.json` 由测试自动生成，数据与断言一致。
- SVG 结构规范化（viewBox 归一、确定性 id、不安全内容清理、embeddable 契约）明确移交后续 SVG Output Compatibility Loop。

Render Loop gate 达成。
