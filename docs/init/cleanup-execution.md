# Cleanup Execution Report

本文件记录 cleanup-plan.md 中 Remove 部分的实际执行结果。

---

## 执行日期

2026-06-12

---

## 已删除文件

### Step A: sh/bench/ — MathML 性能基准（5 个文件）

| 文件                   | 原因                    |
| ---------------------- | ----------------------- |
| `sh/bench/chart.js`    | MathML 性能基准图表生成 |
| `sh/bench/history.yml` | MathML 性能基准历史数据 |
| `sh/bench/pk.js`       | MathML 基准对比逻辑     |
| `sh/bench/self.js`     | MathML 自身性能测试     |
| `sh/bench/util.js`     | MathML 基准工具函数     |

Commit: `b99300a` — `chore(cleanup): remove sh/bench/ MathML benchmark scripts`

### Step B: MathML 专用工具脚本（3 个文件）

| 文件                    | 原因                                              |
| ----------------------- | ------------------------------------------------- |
| `sh/gen_formula_svg.js` | 用 MathJax 生成数学公式 SVG，Mermaid 不需要       |
| `sh/stringAnalyze.js`   | 分析 lib/mathml.js 中的重复字符串，仅操作上游产物 |
| `sh/unicodeUnescape.js` | 反转义 src/mathml.js 中的 Unicode，仅操作上游源码 |

Commit: `bce85a5` — `chore(cleanup): remove MathML utility scripts`

### Step C: extract/ — TeX 抽取逻辑（4 个文件，目录保留）

| 文件                 | 原因                                        |
| -------------------- | ------------------------------------------- |
| `extract/katex.js`   | KaTeX TeX 公式抽取，Mermaid 抽取完全不同    |
| `extract/mathjax.js` | MathJax TeX 公式抽取，Mermaid 不需要        |
| `extract/lib.js`     | TeX 抽取辅助函数（read, norm, isSupported） |
| `extract/run.js`     | TeX 测试抽取入口，Mermaid 版将从零编写      |

Commit: `50c5240` — `chore(cleanup): remove TeX extraction scripts`

### Step D: npm 发布脚本（1 个文件）

| 文件      | 原因                                         |
| --------- | -------------------------------------------- |
| `dist.js` | 构建 + 发布到 npm，Mermaid 项目不发布 npm 包 |

注意：`pnpm-lock.yaml` 已在本地删除但不在 git 跟踪中（可能已被 .gitignore 排除或从未提交）。

Commit: `32df38d` — `chore(cleanup): remove dist.js npm publish script`

### Step E: MathML Demo SVG 截图和未使用图标（3 个文件）

| 文件                   | 原因                                             |
| ---------------------- | ------------------------------------------------ |
| `demo/svg/demo.zh.svg` | MathML 中文 demo 截图，Mermaid 页面不使用        |
| `demo/svg/demo.en.svg` | MathML 英文 demo 截图，Mermaid 页面不使用        |
| `demo/svg/x.svg`       | 关闭/删除图标，无代码引用（BoxX 有自己的 x.svg） |

已验证：`demo.zh.svg`、`demo.en.svg`、`x.svg` 不被任何 pug/js/styl 文件引用。

Commit: `db7204e` — `chore(cleanup): remove MathML demo SVGs and unused icon`

---

## 已修改文件

### knip.js

移除了 7 个已不存在的 entry 路径：

```diff
- "sh/bench/*.js",
- "dist.js",
- "extract/run.js",
- "sh/stringAnalyze.js",
- "sh/unicodeUnescape.js",
- "sh/bench/self.js",
- "sh/gen_formula_svg.js",
```

Commit: `d0c26f2` — `chore(cleanup): update knip.js entry list`

---

## Package Scripts

未修改 `package.json`。原因：

- `dist.js` 不在 `package.json` scripts 中（它是独立脚本）
- `lint-staged` 配置仅引用 `sh/hook/svg.js` 和 `sh/hook/styl.js`，均保留
- devDependencies 中存在冗余的 MathML 依赖（katex, mathjax, oxc-parser, cli-table3 等），但按 cleanup-plan 的策略不在 cleanup 阶段修改

---

## 暂缓处理（Defer）

以下条目按 cleanup-plan.md §3 暂缓处理：

| 路径                                  | 暂缓原因                                                                |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `demo/size.svg`                       | 当前为 KaTeX vs MathJax 体积对比图，需等 Mermaid size report 就绪后替换 |
| `demo/speed.svg`                      | MathML 性能对比图，Mermaid 项目可能只做 size 对比                       |
| `demo/const/formulas.js`              | 32 个数学公式数组，需等 Mermaid 示例数据确定后替换                      |
| `README.mdt`                          | MathML 项目介绍，最终需更新但非优先                                     |
| `README.md`                           | 编译后 README，最终需更新但非优先                                       |
| `workflow/runs/init/`                 | Init Loop 执行记录，可清理但不紧急                                      |
| `workflow/state/init-loop.state.json` | Init Loop 状态文件，运行结束后可清理                                    |
| `workflow/hooks/pre-commit.test.mjs`  | 需确认是否仍需                                                          |
| `knip.js` devDependencies 清理        | 需在所有保留文件确认不依赖后再统一清理                                  |

---

## 需人工审批（Human Gate）

以下条目按 cleanup-plan.md §4 未执行：

| 路径                      | 需人工审批原因                              |
| ------------------------- | ------------------------------------------- |
| `.env`                    | 可能包含敏感配置                            |
| `.opencode/`              | OpenCode Agent 配置目录                     |
| `opencode.jsonc`          | OpenCode 项目配置文件                       |
| `workflow/loops/init/`    | Init Loop 核心逻辑                          |
| `conf`                    | knip.js 引用了 ./conf/\*\* 但目录可能不存在 |
| `docs/superpowers/plans/` | 需确认保留价值                              |

---

## 验证结果

| 验证项                    | 结果    | 说明                                                            |
| ------------------------- | ------- | --------------------------------------------------------------- |
| i18n 校验 (`sh/check.js`) | ✅ 通过 | 所有 75 个语言文件完整且长度正确                                |
| minify 构建 (`minify.js`) | ✅ 通过 | 生成 mathml.js (7.688KB) + md.js (0.795KB)                      |
| bun test                  | ⏭ 跳过 | 当前环境无 Bun 运行时；测试为 MathML 对比测试，不涉及被删除文件 |
| Vite 构建                 | ⏭ 跳过 | 当前环境无 Bun 运行时；删除的 SVG 均无代码引用                  |

---

## 总计

| 操作              | 数量           |
| ----------------- | -------------- |
| 已删除文件        | 16 个          |
| 已修改文件        | 1 个 (knip.js) |
| Git commits       | 6 个           |
| 暂缓处理          | 9 项           |
| 需人工审批        | 6 项           |
| Package.json 修改 | 0              |
| 新增运行时依赖    | 0              |

---

## 回滚方式

所有删除操作可通过 `git revert` 按提交逐一回滚：

```
d0c26f2 — knip.js update
db7204e — demo SVG removal
32df38d — dist.js removal
50c5240 — extract/ removal
bce85a5 — MathML utility removal
b99300a — sh/bench/ removal
```
