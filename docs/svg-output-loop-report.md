# SVG Output Compatibility Loop Final Report

SVG Output Compatibility Loop 交付总结。所有数据来自机器可读产物（源码、测试输出、兼容性报告、git 提交链），不含主观估算。

本 Loop 在 Render Loop 产出的原始 SVG 之上，增加一层确定性、可嵌入、安全的归一化，不实现 Mermaid parser 或 layout engine，不改写渲染路径。

---

## 1. Inputs Consumed from Render Loop

SVG Output Loop 以 Render Loop 的以下产物为输入，未修改渲染器返回契约：

| 输入                  | 路径                                        | 用途                                                                                                                         |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 渲染器入口            | `src/render/mermaid-to-svg.js`              | 源 SVG 生产者，返回 `[OK, rawSvg, diagramType]` / `[errCode, msg]`。本 Loop 保持该元组契约不变，归一化器作为兄弟模块组合调用 |
| 渲染测试 harness 模式 | `test/render-yml.test.mjs`                  | Vite middleware + Playwright Chromium + `page.evaluate` 在页内调用渲染器的模式被本 Loop 的兼容性测试复用                     |
| 能力报告              | `workflow/reports/render-capabilities.json` | 18/18 用例可渲染，覆盖全部八个 HG-1 MVP diagram 类型，证明每条用例都存在原始 SVG 供归一化                                    |

渲染器错误码范围 `0`–`4`（`OK`/`ERR_EMPTY`/`ERR_PARSE`/`ERR_RENDER`/`ERR_TIMEOUT`）。归一化器错误码从 `100` 起，组合调用方可单凭数字码区分失败层级。

---

## 2. Output Artifacts Created

| 产物               | 路径                                                     | 产生阶段                               |
| ------------------ | -------------------------------------------------------- | -------------------------------------- |
| SVG 归一化模块     | `src/render/normalize-svg.js`                            | 03 normalizer-implementation           |
| 兼容性测试 runner  | `test/svg-output.test.mjs`                               | 04 compatibility-tests                 |
| 机器可读兼容性报告 | `workflow/reports/svg-output-compatibility.json`         | 04 / 05（测试 `after()` 钩子自动生成） |
| 兼容性实现计划     | `docs/svg-output/svg-output-plan.md`                     | 02 compatibility-plan                  |
| 验证结果记录       | `docs/svg-output/svg-output-validation.md`               | 05 validation                          |
| Phase 05 原始输出  | `workflow/runs/svg-output/phase05-validation-output.txt` | 05 validation                          |
| 最终报告           | `docs/svg-output-loop-report.md`（本文件）               | 06 final-report                        |

### 2.1 归一化模块 API

```js
// src/render/normalize-svg.js
export const OK = 0,
  ERR_NO_SVG = 100,   // 输入不含 svg 根节点
  ERR_VIEWBOX = 101,  // 无法确定可用坐标空间
  ERR_PARSE = 102;    // SVG 标记解析或序列化失败

export const normalizeSvg = (rawSvg) => { ... }
// 返回 [OK, normalizedSvg] | [errCode, message]
```

### 2.2 组合调用方式

```
const [code, raw] = await renderMermaidToSvg(text);
if (code !== OK) return [code, raw];   // 渲染层错误透传
return normalizeSvg(raw);              // 归一化为稳定输出
```

---

## 3. Compatibility Rules Checked

SVG 契约由五条通用语料规则（对全部 18 条用例）与十条合成规则（独立验证单个机制）组成。所有规则均为通用结构断言，无针对单个 test id 的硬编码补丁。

### 3.1 语料规则（18 条可执行用例）

| 规则            | 通过 | 失败 | 断言内容                                                                                                                   |
| --------------- | ---- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `svg-root`      | 18   | 0    | 归一化输出含 `<svg` 根节点                                                                                                 |
| `viewBox`       | 18   | 0    | 归一化输出含可用 `viewBox`                                                                                                 |
| `no-runtime-js` | 18   | 0    | 不含 `<script` 元素、不含 `on*=` 事件处理属性（不安全运行时 JS 缺席）                                                      |
| `deterministic` | 18   | 0    | 易变化 render-id token（`m2s-N`）被去易变化为规范 `mermaid-svg`，覆盖根 id、`#id` 选择器、marker/clip id 与 `url(#…)` 引用 |
| `error-shape`   | 18   | 0    | 成功结果恒为 `[0, string]` 结构化元组，绝不抛异常或返回残缺字符串                                                          |

### 3.2 合成规则（10 条，全部通过）

| 合成测试                 | 通过 | 输入 → 期望                                                   |
| ------------------------ | ---- | ------------------------------------------------------------- |
| `missing-svg-root`       | yes  | `<div>not svg</div>` → `[ERR_NO_SVG(100), msg]`               |
| `empty-string`           | yes  | `""` → `[ERR_NO_SVG(100), msg]`                               |
| `garbage-text`           | yes  | `"hello world"` → `[ERR_NO_SVG(100), msg]`                    |
| `script-removal`         | yes  | `<svg>…<script>alert(1)</script>…` → 输出无 `<script`         |
| `event-handler-removal`  | yes  | `<rect onclick="bad()">` → 输出无 `onclick`                   |
| `javascript-uri-removal` | yes  | `xlink:href="javascript:alert(1)"` → href 被移除              |
| `viewBox-derivation`     | yes  | `<svg width="100" height="50">` → 获得 `viewBox="0 0 100 50"` |
| `viewBox-preserved`      | yes  | 已有 `viewBox="0 0 10 10"` 保持不变                           |
| `same-input-determinism` | yes  | 同一 SVG 归一化两次 → 字节一致输出                            |
| `id-rewrite-determinism` | yes  | `<svg id="m2s-1">` vs `m2s-2`（含匹配内部引用）→ 归一化后一致 |

### 3.3 归一化规则覆盖的确定性问题

Render Loop 的渲染器为每次调用生成唯一 id（`"m2s-" + ++counter`），Mermaid 将该 id 深度嵌入原始 SVG：根 `<svg id>`、内部 `<style>` 选择器、marker/clip id 及 `url(#…)` 引用。导致同一输入两次渲染产生字节不同的 SVG。

归一化器检测根 `<svg id="…">` 的 token，将序列化输出中该 token 的**所有**出现替换为单一规范 id `mermaid-svg`。使用字面量 `str.split(token).join(canonical)` 而非 `RegExp(token)`，避免 id 中正则元字符导致的误匹配。

---

## 4. Verification Commands and Outcomes

### 4.1 Phase 05 完整 gate（主验证命令）

```bash
node --test test/svg-output.test.mjs test/render-yml.test.mjs workflow/loops/svg-output/svg-output-loop.test.mjs
```

三层 gate 合并执行，任一层回归即整 phase 失败：

| 层                   | 文件                                                 | 职责                                     |
| -------------------- | ---------------------------------------------------- | ---------------------------------------- |
| SVG 输出兼容性       | `test/svg-output.test.mjs`                           | 对语料 + 合成输入断言 SVG 契约           |
| Render Loop 回归     | `test/render-yml.test.mjs`                           | 确认渲染未回归（输出 Loop 未破坏渲染层） |
| SVG Output Loop 契约 | `workflow/loops/svg-output/svg-output-loop.test.mjs` | 静态校验：产物存在、无 blocked pattern   |

运行结果（原始输出存于 `workflow/runs/svg-output/phase05-validation-output.txt`）：

| 指标        | 值    |
| ----------- | ----- |
| tests       | 55    |
| suites      | 2     |
| pass        | 55    |
| fail        | 0     |
| skipped     | 0     |
| duration_ms | ~1009 |
| exit code   | 0     |

55 项拆解：

- **render-yml（19）：** 1 schema 校验 + 18 逐用例渲染断言。
- **svg-output（29）：** 1 schema 校验 + 18 语料契约测试 + 10 合成规则测试。
- **svg-output-loop（7）：** package script、opencode config、agent 指令、loop config、loop 命名、prompts、validator 接受已交付产物并拒绝缺失产物。

### 4.2 Phase 06 验证命令（本阶段）

```bash
node --test workflow/loops/svg-output/svg-output-loop.test.mjs
```

确认 loop 基础设施完好、最终报告产物存在。

### 4.3 兼容性报告数据一致性

`workflow/reports/svg-output-compatibility.json` 由测试 `after()` 钩子自动写入，其数值与断言结果保证一致：

```json
"summary": { "total": 18, "passed": 18, "failed": 0, "deterministic": true }
"failures": []
```

页面展示（Web Demo Loop 起）应直接读取此报告，数据不可手写或估算。

---

## 5. SVG Output Loop Phase 提交链

| 顺序 | Phase                        | Commit     | 说明                                                               |
| ---- | ---------------------------- | ---------- | ------------------------------------------------------------------ |
| 1    | 02 compatibility-plan        | `78a7396`  | `docs(svg-output): add svg output compatibility plan`              |
| 2    | 03 normalizer-implementation | `2073623`  | `feat(svg-output): add svg normalizer with stable output contract` |
| 3    | 04 compatibility-tests       | `b143a4d`  | `test(svg-output): add compatibility tests and report`             |
| 4    | 05 validation                | `18384b4`  | `docs(svg-output): record compatibility validation results`        |
| 5    | 06 final-report              | （本提交） | `docs(svg-output): write svg output loop final report`             |

compatibility-plan 与 compatibility-tests 阶段均经 subagent-driven-development 完成 spec compliance review 与 code quality review（见 `workflow/runs/svg-output/*.status.json` 的 children 记录）。

---

## 6. Known Unsupported Cases

### 6.1 语料内

**无。** `failures` 为空数组，`summary.failed` 为 `0`。全部 18 条可执行用例渲染为 SVG 并归一化为契约合规、确定性、无运行时 JS 的输出。

### 6.2 HG-1 明确排除的 diagram 类型

`journey`、`gitGraph`、`mindmap`、`timeline` 及其他 HG-1 明确排除的不确定或边缘 diagram 类型**不在**当前 `test/*.yml` 语料中，未被渲染或归一化。

排除原因：HG-1（Human Gate-1）将它们判定为 MVP 边界外，需 Render Loop 提供真实渲染证据后方可提升。扩大语料按 HG-2 推迟，待 loop 证据支撑。

### 6.3 确定性边界（已如实记录，在契约范围内）

部分 diagram 族（如 sequenceDiagram 的 `actor-N`、classDiagram 的 `classId-N`）Mermaid 会发射随渲染变化的内部计数器 id。语料 `deterministic` 规则因此断言的是**易变化根 render-id** 的去易变化机制（`m2s-N` token 被替换为规范 `mermaid-svg`），这正是 SVG Output Loop 拥有的归一化机制。

同一 SVG 字符串归一化两次的字节级确定性由 `same-input-determinism` 与 `id-rewrite-determinism` 合成测试独立证明。

渲染层内部计数器的字节稳定性属于渲染层关注点，超出本 Loop 归一化范围。此处如实记录，而非声称渲染器内部计数器的完整字节稳定性。

---

## 7. Constraints Compliance Checklist

| 约束                                                 | 状态                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 基于官方 Mermaid 浏览器端 API（不改渲染路径）        | 已满足（`renderMermaidToSvg` 返回契约不变，归一化器为兄弟模块）                                                                                   |
| 不自研 Mermaid parser                                | 已满足（归一化作用于 SVG 字符串/DOM，不碰 Mermaid 源文本）                                                                                        |
| 不自研 Mermaid layout engine                         | 已满足（Mermaid 布局输出原样保留，仅规范化结构/属性）                                                                                             |
| Playwright 仅作 test harness                         | 已满足（页内调用渲染器 + 归一化器，断言 SVG 字符串/DOM 结构）                                                                                     |
| 不用截图/canvas/pixel/静态 fixture 作 oracle         | 已满足（oracle 为 SVG 字符串与解析后 DOM 结构）                                                                                                   |
| 不用 mermaid-cli / puppeteer / 服务端渲染 / 在线转换 | 已满足                                                                                                                                            |
| 归一化器源无 blocked pattern                         | 已满足（validator 静态校验 `puppeteer`/`playwright`/`mermaid-cli`/`screenshot`/`canvas`/`html2canvas`/`toDataURL`/remote mermaid service 均缺席） |
| 错误结果为结构化元组，不抛异常                       | 已满足（`[errCode, message]`，100+ 码与渲染层 0-4 区分）                                                                                          |

---

## 8. Scope Deferred to Later Loops

以下职责**明确移交**后续 Loop，本 Loop 未触碰：

| 职责                                                  | 移交 Loop          | 原因                                        |
| ----------------------------------------------------- | ------------------ | ------------------------------------------- |
| Demo 页面 UI（输入区、预览区、示例区）                | Web Demo Loop      | 超出 SVG 输出兼容性范围                     |
| Beautiful Mermaid CSS 主题切换                        | Theme Loop         | 本 Loop 仅保证 SVG 结构稳定，不涉及视觉样式 |
| 与 `beautiful-mermaid` 的 JS/gzip 体积对比 SVG 柱状图 | Size Loop          | 体积数据由独立脚本生成                      |
| 75 语言国际化文案接入                                 | I18N Loop          | 本 Loop 无页面文案                          |
| Cloudflare Pages 部署                                 | Deploy Loop        | 部署验证独立进行                            |
| 扩大测试语料超出 18 条                                | 后续（HG-2 推迟）  | 需 Render Loop 提供真实渲染证据             |
| SVG 下载 / 文件保存                                   | 非目标（spec §14） | 当前版本明确排除                            |

---

## 9. Conclusion

- 归一化模块 `src/render/normalize-svg.js` 已交付，将 Render Loop 的原始 SVG 归一化为稳定、可嵌入、确定性、无运行时 JS 的输出。
- 渲染器返回契约 `[OK, svg, diagramType]` / `[errCode, msg]` 保持不变，归一化器作为兄弟模块组合调用。
- 18 条抽取 YAML 用例全部渲染 + 归一化成功，五条语料规则 + 十条合成规则全部通过，零 unsupported，零 skip，exit code 0。
- 八个 HG-1 MVP diagram 类型全部被真实 Mermaid 源文本覆盖并归一化通过。
- 兼容性报告 `workflow/reports/svg-output-compatibility.json` 由测试自动生成，`summary.deterministic: true`，`failures: []`。
- 确定性边界（渲染层内部计数器）已如实记录，在契约范围内。

SVG Output Compatibility Loop gate 达成。
