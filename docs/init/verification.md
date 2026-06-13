# Verification Report — Phase 7

> 初始化阶段验证报告。如实记录所有命令执行结果，不伪造成功。

## 执行日期

2026-06-13

## 环境

| 项       | 值             |
| -------- | -------------- |
| node     | v24.14.0       |
| npm      | 11.9.0         |
| bun      | 1.3.14         |
| git      | 可用           |
| 工作目录 | `mermaid2svg/` |

---

## 命令执行结果

### npm scripts（package.json 中定义的）

| 命令              | 状态    | Exit Code | 说明                                   |
| ----------------- | ------- | --------- | -------------------------------------- |
| `npm test`        | ✅ PASS | 0         | 完整测试链通过，421 个 bun test 通过   |
| `npm run build`   | ✅ PASS | 0         | 执行 demo 构建，输出 `demo/dist/`      |
| `npm run extract` | ✅ PASS | 0         | 生成 18 个 YAML 测试 + schema + report |

package.json 已补齐 `test` / `build` / `extract` 便捷脚本，并拆出 `build:lib` 用于保留原 `src/` → `lib/` 构建。

### 项目脚本

| 命令                            | 状态    | Exit Code | 说明                                                          |
| ------------------------------- | ------- | --------- | ------------------------------------------------------------- |
| `./test.sh`                     | ✅ PASS | 0         | check → oxfmt --check → minify → oxlint → bun test 全链路通过 |
| `./sh/check.js`                 | ✅ PASS | 0         | 75 个语言文件完整且长度正确                                   |
| `node extract/run.js`           | ✅ PASS | 0         | 成功生成 18 个 YAML 测试 + schema.yml + report.json           |
| `bun test test/compare.test.js` | ✅ PASS | 0         | 421 个 MathML 测试通过                                        |

---

## 环境缺口处理状态

`bun` 运行时和 npm 便捷脚本均已补齐。`test.sh` 中的格式化步骤已改为 `bun x oxfmt --check`，避免验证命令重写 tracked files。

---

## 生成的测试产物

### 抽取脚本输出（`node extract/run.js`）

| 指标                | 数量 |
| ------------------- | ---- |
| 总候选              | 127  |
| 已接受（生成 YAML） | 18   |
| 已跳过              | 109  |
| diagram type 覆盖   | 8    |
| 来源仓库覆盖        | 3/3  |

### test/\*.yml 文件清单

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

| 测试集                           | runner                             | 状态                               |
| -------------------------------- | ---------------------------------- | ---------------------------------- |
| `test/case/*.yml`（MathML 上游） | `test/compare.test.js`（bun test） | ⚠️ 逻辑存在，但 bun 未安装无法执行 |
| `test/*.yml`（Mermaid 新增）     | 无                                 | ❌ 尚未实现 Mermaid test runner    |

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

### 剩余阻塞项 ❌

| 阻塞项                     | 影响                          | 建议处理                             |
| -------------------------- | ----------------------------- | ------------------------------------ |
| **无 Mermaid 测试 runner** | Mermaid YAML 测试无法自动执行 | Render Loop 阶段实现（预期，非缺陷） |

---

## 结论

初始化阶段产出的**核心 artifact 全部健全**：抽取脚本可运行、测试数据完整、schema 可校验、报告可追溯、i18n 基线通过。

此前的环境/工程化配置缺口（bun 未安装、npm 便捷脚本缺失）已解决。当前可进入 Render Loop；若失败，应优先查看 loop state 和 `workflow/runs/<loop>/` 下的 diagnostics。

**判定**：可以进入正式任务拆解（Codex Decomposition）和 Render Loop。
