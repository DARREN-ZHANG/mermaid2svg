# Cleanup Plan — Phase 2

本文件定义将原 `@webc.site/math` repo 转化为 Mermaid → SVG 项目基线的确定性清理计划。

**本阶段不执行任何删除操作。** 所有条目仅作为后续 Phase 执行时的参考。

---

## 1. Keep — 必须保留

以下文件/目录对 Mermaid 项目有直接价值或被 Spec/AGENTS.md 保护。

### 1.1 受保护（禁止修改/删除）

| 路径                                  | 原因                                    |
| ------------------------------------- | --------------------------------------- |
| `src/**`                              | 上游 TeX → MathML 库，Spec 明确禁止修改 |
| `lib/**`                              | 编译产物，由 `minify.js` 生成           |
| `../docs/mermaid-svg-spec.md`         | 项目规约                                |
| `../docs/acceptance-criteria.md`      | 验收标准                                |
| `../docs/mermaid-svg-architecture.md` | 技术架构                                |
| `../references/**`                    | 上游参考仓库                            |
| `plugin/**`                           | Markdown 插件，上游项目资产             |
| `blog/**`                             | 博客内容，上游项目资产                  |
| `readme/**`                           | README 组件，上游项目资产               |
| `.github/workflows/npm.yml`           | 上游 CI 配置                            |
| `demo/webc/Math.js`                   | 上游 Math 组件                          |

### 1.2 Demo 框架（Mermaid 页面主战场）

| 路径              | 原因                                             |
| ----------------- | ------------------------------------------------ |
| `demo/index.pug`  | 页面模板，需改写为 Mermaid 版本                  |
| `demo/index.js`   | 页面逻辑，需改写为 Mermaid 版本                  |
| `demo/style.styl` | 主样式，需扩展 Mermaid 样式                      |
| `demo/build.js`   | Vite 构建后复制 i18n 资源                        |
| `demo/public/`    | favicon 和 web manifest                          |
| `vite.config.js`  | Vite 构建配置，含 Pug/Stylus/LightningCSS 插件链 |
| `dev.js`          | Vite 开发服务器启动脚本                          |
| `supremacy.yml`   | Stylus 格式化配置                                |

### 1.3 国际化系统（75 种语言复用）

| 路径                                    | 原因                                   |
| --------------------------------------- | -------------------------------------- |
| `demo/i18n/`（75 个语言文件）           | Mermaid 需要同样的 75 种语言支持       |
| `demo/webc/I18n.js` + `demo/webc/I18n/` | `<c-i18n>` 组件系统                    |
| `demo/webc/I18n/CODE.js`                | 语言代码列表                           |
| `demo/webc/I18n/NAME.js`                | 语言名称列表                           |
| `demo/webc/I18n/i18n/`（75 个 locale）  | Web Component i18n 子系统              |
| `demo/const/langName.js`                | 语言名称映射                           |
| `sh/check.js`                           | i18n 完整性校验脚本                    |
| `sh/compile_i18n.js`                    | i18n 资源编译（从 webc.site 同步翻译） |

### 1.4 Web Components（UI 复用）

| 路径                              | 原因                   |
| --------------------------------- | ---------------------- |
| `demo/webc/Box.js` + `Box/`       | 盒子组件               |
| `demo/webc/BoxX.js` + `BoxX/`     | 扩展盒子组件           |
| `demo/webc/Btn/`                  | 按钮样式               |
| `demo/webc/Scroll.js` + `Scroll/` | 滚动组件               |
| `demo/webc/Lg/`                   | 大屏布局样式           |
| `demo/webc/js/cE.js`              | Web Component 注册工具 |
| `demo/webc/js/i18n.js`            | `onLang` 回调机制      |

### 1.5 SVG 资源（设计风格复用）

| 路径                  | 原因           |
| --------------------- | -------------- |
| `demo/svg/bg.svg`     | 页面背景图     |
| `demo/svg/npm.svg`    | NPM 图标       |
| `demo/svg/github.svg` | GitHub 图标    |
| `demo/svg/i18n.svg`   | 语言选择器图标 |

### 1.6 测试框架

| 路径                      | 原因                       |
| ------------------------- | -------------------------- |
| `test/case/*.yml`（7 个） | 上游 MathML 测试，不可删除 |
| `test/compare.js`         | MathML 对比测试核心        |
| `test/compare.test.js`    | MathML 对比测试入口        |
| `test.sh`                 | 主测试流程，需扩展         |

### 1.7 构建与工具

| 路径                                        | 原因                                |
| ------------------------------------------- | ----------------------------------- |
| `minify.js`                                 | `src/` → `lib/` 构建                |
| `sh/ROOT.js`                                | 项目根目录路径工具                  |
| `sh/hook/`（svg.js, styl.js, styl2nest.js） | Git hooks（SVG/Stylus 格式化）      |
| `sh/github/pkg.js`                          | npm 包发布辅助                      |
| `package.json`                              | 项目配置，需修改名称/描述但保留框架 |
| `knip.js`                                   | 未使用代码检测配置                  |
| `.husky/`                                   | Git hooks 配置                      |
| `.gitignore`                                | Git 忽略规则                        |
| `.eslintignore`                             | ESLint 忽略规则                     |

### 1.8 项目元数据

| 路径              | 原因           |
| ----------------- | -------------- |
| `AGENTS.md`       | AI Agent 规范  |
| `bun.lock`        | Bun 依赖锁文件 |
| `LICENSE`（如有） | 许可证         |

---

## 2. Remove — 可安全移除（高置信度）

以下文件/目录与 Mermaid → SVG 目标**明确无关**，且不被任何保留文件依赖。

### 2.1 Extract 目录中的 TeX 抽取逻辑

| 路径                 | 原因                                               | 依赖影响                              |
| -------------------- | -------------------------------------------------- | ------------------------------------- |
| `extract/katex.js`   | KaTeX TeX 公式抽取与渲染，Mermaid 抽取完全不同     | 无其他文件引用                        |
| `extract/mathjax.js` | MathJax TeX 公式抽取与渲染，Mermaid 不需要         | 无其他文件引用                        |
| `extract/lib.js`     | TeX 抽取辅助（read, norm, isSupported），针对 TeX  | 仅被 `extract/run.js` 引用            |
| `extract/run.js`     | 当前为 TeX 测试抽取，需**完全重写**为 Mermaid 版本 | 被 `knip.js` entry 引用（重写后更新） |

**策略**：删除全部 4 个文件。Mermaid 版 `extract/run.js` 将从零编写。

### 2.2 MathML 性能基准脚本

| 路径                   | 原因                    | 依赖影响                  |
| ---------------------- | ----------------------- | ------------------------- |
| `sh/bench/chart.js`    | MathML 性能基准图表生成 | 无外部引用                |
| `sh/bench/history.yml` | MathML 性能基准历史数据 | 无外部引用                |
| `sh/bench/pk.js`       | MathML 基准对比逻辑     | 无外部引用                |
| `sh/bench/self.js`     | MathML 自身性能测试     | 无外部引用                |
| `sh/bench/util.js`     | MathML 基准工具函数     | 仅被 bench 目录内文件引用 |

**策略**：删除整个 `sh/bench/` 目录。Mermaid 的 size/gzip 对比将使用新脚本。

### 2.3 MathML 专用工具脚本

| 路径                    | 原因                                | 依赖影响           |
| ----------------------- | ----------------------------------- | ------------------ |
| `sh/gen_formula_svg.js` | 用 MathJax 生成数学公式 SVG         | 无外部引用         |
| `sh/stringAnalyze.js`   | 分析 `lib/mathml.js` 中的重复字符串 | 仅操作 `src/` 产物 |
| `sh/unicodeUnescape.js` | 反转义 `src/mathml.js` 中的 Unicode | 仅操作 `src/`      |

**策略**：删除 3 个文件。Mermaid 项目不使用 MathJax，不需要字符串分析工具。

### 2.4 MathML Demo 截图

| 路径                   | 原因                  | 依赖影响                   |
| ---------------------- | --------------------- | -------------------------- |
| `demo/svg/demo.zh.svg` | MathML 中文 demo 截图 | Mermaid 页面不会使用此截图 |
| `demo/svg/demo.en.svg` | MathML 英文 demo 截图 | 同上                       |

**策略**：删除 2 个文件。Mermaid 版本的 demo 截图将重新生成。

### 2.5 npm 发布脚本

| 路径      | 原因              | 依赖影响                  |
| --------- | ----------------- | ------------------------- |
| `dist.js` | 构建 + 发布到 npm | Mermaid 项目不发布 npm 包 |

**策略**：删除。但注意 `dist.js` 内部调用了 `minify.js`，`minify.js` 本身保留。

### 2.6 过时 Lockfile

| 路径             | 原因                      | 依赖影响            |
| ---------------- | ------------------------- | ------------------- |
| `pnpm-lock.yaml` | pnpm 锁文件，项目使用 bun | 项目使用 `bun.lock` |

**策略**：删除。

### 2.7 Mermaid 不需要的 SVG 资源

| 路径             | 原因          | 依赖影响                           |
| ---------------- | ------------- | ---------------------------------- |
| `demo/svg/x.svg` | 关闭/删除图标 | Mermaid 页面可能不需要，无代码引用 |

**策略**：删除。如果后续 Mermaid 页面需要关闭按钮，可以重新添加。

---

## 3. Defer — 暂缓处理（需更多上下文）

以下文件/目录**可能**可以移除或替换，但需要等到后续 Phase 实施时才能判断。

### 3.1 当前 MathML 对比图

| 路径             | 暂缓原因                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `demo/size.svg`  | 当前为 KaTeX vs MathJax vs @webc.site/math 体积对比图。Mermaid 版需要替换为 beautiful-mermaid vs 本项目。但需要等 size report 脚本就绪后再替换，暂缓 |
| `demo/speed.svg` | 当前为 MathML 性能对比图。Mermaid 项目可能只做 size 对比。需等 Phase 6 (Size/Gzip Comparison) 确认是否需要                                           |

### 3.2 公式数据

| 路径                     | 暂缓原因                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `demo/const/formulas.js` | 当前为 32 个数学公式数组。Mermaid 版需替换为 Mermaid 示例文本数组。但需等 Mermaid 示例数据确定后再替换 |

### 3.3 README

| 路径         | 暂缓原因                                                           |
| ------------ | ------------------------------------------------------------------ |
| `README.mdt` | Markdown 模板 README，包含 MathML 项目介绍。最终需更新但不是优先级 |
| `README.md`  | 编译后的 README，引用 `readme/` 目录内容。最终需更新但不是优先级   |

### 3.4 Workflow 自动生成内容

| 路径                                  | 暂缓原因                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `workflow/runs/init/`                 | Init Loop 执行记录（commands.log, failure 日志, snapshots），自动生成的临时文件。可清理但不紧急 |
| `workflow/state/init-loop.state.json` | Init Loop 状态文件。Init Loop 运行结束后可清理                                                  |
| `workflow/hooks/pre-commit.test.mjs`  | Workflow pre-commit hook 测试。需确认是否仍需                                                   |

### 3.5 Knip 配置

| 路径      | 暂缓原因                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `knip.js` | 未使用代码检测配置，当前 entry 包含大量 MathML 专用脚本路径（`sh/bench/*.js`, `sh/gen_formula_svg.js` 等）。需在 Remove 阶段执行后更新 |

---

## 4. Human Gate — 需人工审批

以下文件/目录的删除需要**明确的人工确认**，不能自动执行。

### 4.1 环境变量

| 路径   | 需人工审批原因                                                                         |
| ------ | -------------------------------------------------------------------------------------- |
| `.env` | 可能包含 API key、token 或其他敏感配置。内容不公开，需要人工确认是否仍需保留或需要更新 |

### 4.2 OpenCode 配置

| 路径             | 需人工审批原因                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- |
| `.opencode/`     | OpenCode Agent 配置目录。删除可能影响开发 workflow。需人工确认是否需要更新而非删除 |
| `opencode.jsonc` | OpenCode 项目配置文件。同上                                                        |

### 4.3 Init Loop 脚本

| 路径                                                                           | 需人工审批原因                                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `workflow/loops/init/`（含 init-loop.ts, init-loop.config.ts, lib/, prompts/） | Init Loop 的核心逻辑。如果后续仍需使用 Init Loop，不应删除。需人工决定是否保留或迁移 |

### 4.4 conf 目录

| 路径   | 需人工审批原因                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| `conf` | 目录/文件似乎不存在或为空，但 `knip.js` 的 ignore 列表引用了 `./conf/**`。需人工确认是否有隐藏内容或历史用途 |

### 4.5 Superpowers 文档

| 路径                      | 需人工审批原因                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| `docs/superpowers/plans/` | 包含 `2026-06-12-init-loop-integration.md`。需人工确认是否有保留价值 |

---

## 汇总

| 分类       | 数量   | 说明                                                                                                                          |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| keep       | ~50 项 | 受保护 + Demo 框架 + i18n + Web Components + SVG + 测试 + 工具 + 元数据                                                       |
| remove     | ~20 项 | extract/ (4) + bench/ (5) + 工具脚本 (3) + demo 截图 (2) + dist.js (1) + lockfile (1) + x.svg (1) + run.js (1) ≈ 18 文件/目录 |
| defer      | ~9 项  | size/speed.svg + formulas.js + README + workflow 临时文件 + knip.js                                                           |
| human_gate | ~5 项  | .env + .opencode/ + opencode.jsonc + workflow/loops/init/ + conf + superpowers                                                |

**原则**：保守清理优先。不确定的保留，不因清理导致项目不可构建。
