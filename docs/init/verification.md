# Verification Report — Phase 7

> 初始化阶段验证报告。如实记录所有命令执行结果，不伪造成功。

## 执行日期

2026-06-13

## 环境

| 项 | 值 |
|---|---|
| node | v24.14.0 |
| npm | 11.9.0 |
| bun | **未安装** |
| git | 可用 |
| 工作目录 | `mermaid2svg/` |

---

## 命令执行结果

### npm scripts（package.json 中定义的）

| 命令 | 状态 | Exit Code | 说明 |
|---|---|---|---|
| `npm test` | ❌ FAIL | 1 | Missing script: "test" |
| `npm run build` | ❌ FAIL | 1 | Missing script: "build" |
| `npm run extract` | ❌ FAIL | 1 | Missing script: "extract" |

package.json 中仅存在 `prepare` 和 `agent:*` 系列脚本（tsx 驱动的 workflow loop 入口），无 `test` / `build` / `extract` 便捷脚本。

### 项目脚本

| 命令 | 状态 | Exit Code | 说明 |
|---|---|---|---|
| `./test.sh` | ❌ FAIL | 127 | 首行 `./sh/check.js` 成功，但第二行 `bun x oxfmt` 报 `env: bun: No such file or directory` |
| `./sh/check.js` | ❌ FAIL | 127 | shebang 为 `#!/usr/bin/env bun`，当前环境无 bun |
| `node sh/check.js` | ✅ PASS | 0 | 用 node 直接执行通过：所有 75 个语言文件完整且长度正确 |
| `node extract/run.js` | ✅ PASS | 0 | 成功生成 18 个 YAML 测试 + schema.yml + report.json |
| `bun test test/compare.test.js` | ❌ FAIL | 127 | `command not found: bun` |

### 失败命令 stderr 摘要

**`npm test` / `npm run build` / `npm run extract`:**
```
npm error Missing script: "test"  (或 "build" / "extract")
npm error To see a list of scripts, run:
npm error   npm run
```

**`./test.sh`:**
```
+ ./sh/check.js
env: bun: No such file or directory
```
（注：check.js 因自身 shebang 也是 bun，实际在此处因 test.sh 用 `./sh/check.js` 直接调用而先失败。）

**`./sh/check.js`:**
```
env: bun: No such file or directory
```

**`bun test`:**
```
zsh:1: command not found: bun
```

---

## 未安装 bun 的影响

`bun` 运行时在当前环境中未安装。以下能力被阻断：

1. `test.sh` 完整流程（check → oxfmt → minify → oxlint → bun test）无法运行
2. `bun test` 测试运行器无法执行
3. 任何 `#!/usr/bin/env bun` shebang 的脚本无法直接调用（如 `sh/check.js`）
4. `bun minify.js`（src/ → lib/ 重新打包）无法运行

**缓解**：`sh/check.js` 和 `extract/run.js` 用 `node` 直接执行均通过，说明逻辑本身正确，仅缺 bun 运行时。

---

## 生成的测试产物

### 抽取脚本输出（`node extract/run.js`）

| 指标 | 数量 |
|---|---|
| 总候选 | 127 |
| 已接受（生成 YAML） | 18 |
| 已跳过 | 109 |
| diagram type 覆盖 | 8 |
| 来源仓库覆盖 | 3/3 |

### test/*.yml 文件清单

根目录 Mermaid 测试（18 个）：
`bm-001`, `bm-002`, `bm-007`, `bm-010`, `bm-014`, `bm-017`, `bm-020`,
`maid-001`, `maid-002`, `maid-010`, `maid-015`, `maid-017`, `maid-019`, `maid-020`,
`mm-fc-001`, `mm-other-001`, `mm-other-005`, `mm-seq-001`

Schema 文件：`test/schema.yml`

上游 MathML 测试（`test/case/`，保持不动）：7 个（basic, frac, func, greek, operator_relation, sqrt, sub_sup）

### Schema 字段校验

对 18 个 Mermaid YAML 文件逐一检查顶层必填字段 `[id, source, diagram, input, expect, skip]`：

```
schema field check: 18 ok, 0 fail of 18
```

### report.json 校验

`extract/report.json` 为合法 JSON，结构完整：

- `sources` 包含全部 3 个指定仓库（probelabs/maid, lukilabs/beautiful-mermaid, mermaid-js/mermaid）
- `summary`: `{totalCandidates:127, totalAccepted:18, totalSkipped:109}`
- `skipReasons`: 10 种跳过原因
- `skippedSamples`: 109 条（含来源路径和原因）

---

## 测试运行器状态

| 测试集 | runner | 状态 |
|---|---|---|
| `test/case/*.yml`（MathML 上游） | `test/compare.test.js`（bun test） | ⚠️ 逻辑存在，但 bun 未安装无法执行 |
| `test/*.yml`（Mermaid 新增） | 无 | ❌ 尚未实现 Mermaid test runner |

Mermaid 测试 runner 不存在属于**预期状态**——初始化阶段不实现转换器，runner 将在 Render Loop 阶段构建。

---

## i18n 校验

`node sh/check.js` 输出：

```
✅ 所有 75 个语言文件完整且长度正确。
```

75 个 locale 文件（`demo/i18n/*.js`）key 一致性通过。

---

## 最终 Git Diff 摘要

### 已跟踪文件改动（test.sh 运行前已有 + extract 重跑产生）

```
 extract/report.json                        |  2 +-
 lib/mathml.js                              |  2 +-
 lib/mathml.js.map                          |  2 +-
 lib/md.js.map                              |  2 +-
 opencode.jsonc                             |  5 +++++
 package.json                               |  3 +--
 workflow/loops/init/init-loop.test.mjs     |  6 ++++++
 workflow/loops/init/lib/opencode-runner.ts |  2 +-
 workflow/state/init-loop.state.json        | 25 +++++++++++++++++++------
 9 files changed, 36 insertions(+), 13 deletions(-)
```

说明：
- `extract/report.json` 仅有 `generatedAt` 时间戳变更（重跑产生）
- `lib/*` 改动为早期 init 阶段 minify 产物差异，非本阶段产生
- `workflow/*`、`opencode.jsonc`、`package.json` 为 workflow loop 基础设施改动，非本阶段产生
- 未跟踪文件：`pnpm-lock.yaml`、`workflow/runs/`

### 本次验证未引入新改动

本阶段仅运行只读检查命令和幂等的 `extract/run.js`（重生成时间戳），未修改源代码或配置。

---

## 是否已准备好进入正式任务拆解？

### 已就绪 ✅

1. **测试抽取**：`extract/run.js` 可重复执行，幂等，生成稳定产物
2. **测试数据**：18 个 Mermaid YAML 测试 + schema.yml，字段完整、可解析
3. **抽取报告**：`extract/report.json` 结构完整，3 来源全覆盖，跳过原因可追溯
4. **i18n 基线**：75 语言文件完整
5. **项目清理**：16 个无关文件已移除（见 cleanup-execution.md），受保护文件未动
6. **参考仓库**：3 个参考仓库已 clone 到 `references/`，抽取脚本可读取
7. **规约文档**：spec / acceptance-criteria / architecture 已冻结（在 `../docs/`）

### 阻塞项 ❌

| 阻塞项 | 影响 | 建议处理 |
|---|---|---|
| **bun 运行时未安装** | test.sh、bun test、minify 无法执行 | Render Loop 或环境准备任务中安装 bun |
| **无 npm test/build/extract 脚本** | CI 和自动化流程无法通过标准 npm 命令调用 | 由后续 loop 在 package.json 添加非运行时便捷脚本 |
| **无 Mermaid 测试 runner** | Mermaid YAML 测试无法自动执行 | Render Loop 阶段实现（预期，非缺陷） |

---

## 结论

初始化阶段产出的**核心 artifact 全部健全**：抽取脚本可运行、测试数据完整、schema 可校验、报告可追溯、i18n 基线通过。

当前环境的工具链缺口（bun 未安装、npm 便捷脚本缺失）属于**环境/工程化配置问题**，不影响初始化产物的正确性，但需在进入 Render Loop 前解决 bun 安装问题，否则测试流程无法执行。

**判定**：可以进入正式任务拆解（Codex Decomposition），但任务图应包含一个「环境准备」前置任务，负责安装 bun 运行时并补齐 `test` / `build` / `extract` npm 脚本。
