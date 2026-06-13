# Remove Candidates — 可能与 Mermaid 目标无关的文件

本文件列出项目中可能可以移除的内容。**本阶段不执行任何删除**，所有条目需经人工确认后处理。

## 高置信度（与 Mermaid → SVG 目标明显无关）

| 路径                    | 说明                                        | 备注                                                       |
| ----------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `extract/katex.js`      | KaTeX TeX 公式抽取逻辑                      | Mermaid 版 `extract/run.js` 需完全重写，KaTeX 抽取不再需要 |
| `extract/mathjax.js`    | MathJax TeX 公式抽取与渲染逻辑              | 同上                                                       |
| `extract/lib.js`        | TeX 抽取辅助函数（read, norm, isSupported） | 针对 TeX 公式的工具，Mermaid 抽取不需要                    |
| `sh/bench/chart.js`     | MathML 性能基准图表生成                     | 基于 KaTeX/MathJax 的基准，Mermaid 版需新方案              |
| `sh/bench/history.yml`  | MathML 性能基准历史数据                     | 同上                                                       |
| `sh/bench/pk.js`        | MathML 基准对比逻辑                         | 同上                                                       |
| `sh/bench/self.js`      | MathML 自身性能测试                         | 同上                                                       |
| `sh/bench/util.js`      | MathML 基准工具函数                         | 同上                                                       |
| `sh/gen_formula_svg.js` | 数学公式 SVG 生成                           | Mermaid 项目不需要生成公式 SVG                             |
| `sh/stringAnalyze.js`   | 字符串分析工具（可能为 MathML 专用）        | 需确认是否有通用价值                                       |
| `sh/unicodeUnescape.js` | Unicode 反转义工具（可能为 MathML 专用）    | 同上                                                       |
| `demo/svg/demo.zh.svg`  | MathML 中文 demo 截图                       | 需替换为 Mermaid demo 截图或移除                           |
| `demo/svg/demo.en.svg`  | MathML 英文 demo 截图                       | 同上                                                       |
| `demo/svg/x.svg`        | 关闭/删除图标                               | 需确认 Mermaid 页面是否使用                                |

## 中置信度（可能需要大幅改造或替换）

| 路径                     | 说明                         | 备注                                                |
| ------------------------ | ---------------------------- | --------------------------------------------------- |
| `demo/size.svg`          | 当前为 MathML 体积对比柱状图 | 需替换为 beautiful-mermaid vs 本项目的对比图        |
| `demo/speed.svg`         | 当前为 MathML 性能对比柱状图 | Mermaid 版本可能只需要 size 对比，不需要 speed 对比 |
| `demo/const/formulas.js` | 32 个数学公式数组            | 需替换为 Mermaid 示例文本数组                       |
| `demo/svg/i18n.svg`      | I18n 选择器图标              | 如果复用 `<c-i18n>` 组件则保留                      |
| `sh/compile_i18n.js`     | 编译 i18n 资源               | 需确认 Mermaid 项目是否仍需此脚本                   |
| `dist.js`                | 构建 + 发布到 npm 的脚本     | Mermaid 项目不发布 npm 包，但 `minify.js` 仍需要    |
| `README.mdt`             | Markdown 模板 README         | 可能包含 MathML 项目介绍，需更新                    |
| `README.md`              | 项目 README                  | 需更新为 Mermaid 项目说明                           |

## 低置信度（保留可能性大，但需关注）

| 路径                                  | 说明                              | 备注                             |
| ------------------------------------- | --------------------------------- | -------------------------------- |
| `workflow/loops/init/`                | Init Loop 配置和脚本              | 可能包含当前项目特定的初始化逻辑 |
| `workflow/state/init-loop.state.json` | Init Loop 状态文件                | 自动生成，可能需要清理           |
| `workflow/hooks/`                     | Workflow hooks                    | 需确认内容是否仍然适用           |
| `workflow/runs/`                      | Workflow 执行记录                 | 自动生成的记录                   |
| `docs/superpowers/`                   | 超能力文档                        | 需确认内容是否相关               |
| `.env`                                | 环境变量                          | 可能含旧项目的 API key 或配置    |
| `.opencode/`                          | OpenCode 配置                     | 可能需要更新                     |
| `opencode.jsonc`                      | OpenCode 项目配置                 | 可能需要更新                     |
| `conf`                                | 不存在的目录/文件（读取时未找到） | 可能是旧配置                     |
| `pnpm-lock.yaml`                      | pnpm lockfile（项目使用 bun）     | 如果完全切换到 bun，可移除       |

## 不建议移除（虽然看似 MathML 专用，但 Mermaid 项目仍需依赖）

| 路径                   | 说明                    | 保留原因                        |
| ---------------------- | ----------------------- | ------------------------------- |
| `src/**`               | TeX → MathML 库         | Spec 明确禁止修改，也不应删除   |
| `lib/**`               | 编译产物                | 同上                            |
| `test/case/*.yml`      | MathML 测试用例         | Spec 要求保留，上游测试不应删除 |
| `test/compare.js`      | MathML 对比测试         | 上游测试逻辑，保留              |
| `test/compare.test.js` | MathML 测试入口         | 同上                            |
| `demo/webc/Math.js`    | Math Web Component      | Spec 明确要求保留               |
| `plugin/**`            | Markdown 插件           | Spec 明确要求保留               |
| `blog/**`              | 博客                    | Spec 明确要求保留               |
| `sh/github/`           | GitHub Actions 辅助脚本 | npm 发布流程使用，保留          |

## 统计

- 高置信度候选：14 项
- 中置信度候选：8 项
- 低置信度候选：9 项
- 不建议移除：9 项

**注意**：所有删除操作需经人工确认后方可执行。保守清理优先，不确定的保留。
