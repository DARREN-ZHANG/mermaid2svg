# Cleanup Risk Assessment — Phase 2

本文件评估执行 cleanup-plan.md 中各操作可能带来的风险，并制定回滚策略。

---

## 1. 可能的破坏性影响

### 1.1 Extract 目录清空 → 测试流程中断

**风险**：删除 `extract/` 下全部 4 个文件后，如果 `test.sh` 中有步骤依赖 `extract/run.js` 的旧输出，测试流程可能中断。

**影响范围**：`test.sh` 和 `knip.js` 的 entry 列表。

**缓解措施**：
- 删除前检查 `test.sh` 是否直接调用 `extract/run.js`
- 删除后立即更新 `knip.js` 移除已不存在的 entry 路径
- `extract/run.js` 的 Mermaid 版本应在下一个 Phase 编写，不会留下空目录

**严重程度**：低。`test.sh` 当前不调用 `extract/run.js`，测试用例已存在于 `test/case/`。

### 1.2 Bench 目录删除 → Knip/引用断裂

**风险**：`sh/bench/` 被 `knip.js` 的 entry 列表引用。删除后 knip 会报告 entry 不存在。

**影响范围**：`knip.js` 配置。

**缓解措施**：
- 删除 `sh/bench/` 后同步更新 `knip.js`，移除 `sh/bench/*.js` entry
- 无其他文件 import bench 目录中的模块

**严重程度**：低。knip 是开发工具，不影响构建或测试。

### 1.3 dist.js 删除 → minify 依赖链

**风险**：`dist.js` 内部 import 了 `minify.js`。删除 `dist.js` 不会影响 `minify.js`，但如果其他脚本依赖 `dist.js` 则会断裂。

**影响范围**：`knip.js` 的 entry 列表中包含 `dist.js`。

**缓解措施**：
- 删除后更新 `knip.js`
- `minify.js` 保持独立，不受影响
- Mermaid 项目不需要 npm 发布功能

**严重程度**：极低。`dist.js` 不被其他脚本 import。

### 1.4 Demo SVG 删除 → 页面渲染问题

**风险**：删除 `demo/svg/demo.zh.svg`、`demo.svg/demo.en.svg`、`demo/svg/x.svg` 后，如果 `demo/index.pug` 仍引用这些文件，Vite 构建可能报错。

**影响范围**：`demo/index.pug` 或 `demo/index.js` 中的 SVG 引用。

**缓解措施**：
- 删除前检查 `demo/index.pug` 和 `demo/index.js` 是否引用这些 SVG
- 这些 demo 截图 SVG 仅用于展示 MathML 效果，Mermaid 版改写页面时会移除相关引用
- 如果 pug 模板仍引用，应在改写页面时同步清理，而非在 cleanup 阶段

**严重程度**：中。可能需要在改写 demo 页面的 Phase 同步处理，而非在 cleanup 阶段独立删除。

**建议**：将 `demo/svg/demo.zh.svg` 和 `demo.svg/demo.en.svg` 从 remove 移至 defer，等 demo 页面改写完成后再删除。

---

## 2. 构建/测试风险

### 2.1 test.sh 执行链

当前 `test.sh` 执行流程：
```
check → oxfmt → minify → oxlint → bun test
```

**风险分析**：
- `check`（`sh/check.js`）：检查 i18n key 一致性 → **保留**，无影响
- `oxfmt`：代码格式化 → **保留**，无影响
- `minify`（`minify.js`）：`src/` → `lib/` → **保留**，无影响
- `oxlint`：代码检查 → **保留**，无影响
- `bun test`（`test/compare.test.js`）：运行 MathML 对比测试 → **保留**，无影响

**结论**：remove 计划中的文件均不在 `test.sh` 执行链中。测试流程不会中断。

### 2.2 Vite 构建

当前 Vite 构建依赖：
- `vite.config.js` → 保留
- `demo/index.pug` → 保留（待改写）
- `demo/style.styl` → 保留
- `demo/svg/*.svg` → 部分保留，部分删除

**风险**：如果删除的 SVG 仍被 `demo/index.pug` 或 `demo/style.styl` 引用，构建会报 `file not found`。

**缓解措施**：
- `vite.config.js` 中的 `scanSvgs()` 函数扫描整个 `demo/` 目录下的 SVG 文件用于 CSS 内联
- 删除未被 CSS 引用的 SVG 不会影响构建
- `demo.svg/demo.zh.svg` 和 `demo.svg/demo.en.svg` 很可能在 pug 模板中被引用
- `x.svg` 需确认是否在代码中使用

**建议**：在执行删除前，先 grep 确认引用关系。

### 2.3 Bun Install

**风险**：删除文件后 `bun.lock` 不需要更新，因为删除的是源文件而非依赖声明。但如果 `package.json` 中的 `lint-staged` 配置引用了被删除的脚本，git commit 时 hook 可能失败。

**缓解措施**：
- 当前 `lint-staged` 配置仅引用 `sh/hook/svg.js` 和 `sh/hook/styl.js` → 保留
- 无风险

---

## 3. 设计资产保留风险

### 3.1 核心设计资产

以下设计资产必须保留以确保 Mermaid 页面可以复用 `math.webc.site` 风格：

| 资产 | 风险等级 | 说明 |
|------|----------|------|
| `demo/svg/bg.svg` | 无风险 | 保留，页面背景 |
| `demo/style.styl` | 无风险 | 保留，核心样式 |
| `demo/webc/Box/`, `BoxX/`, `Btn/`, `Lg/`, `Scroll/` | 无风险 | 保留，布局组件 |
| `demo/svg/npm.svg`, `github.svg`, `i18n.svg` | 无风险 | 保留，图标 |

### 3.2 可替换设计资产

| 资产 | 风险等级 | 说明 |
|------|----------|------|
| `demo/size.svg` | 低风险 | 需替换为 Mermaid 版对比图，暂缓处理 |
| `demo/speed.svg` | 低风险 | 可能不再需要，暂缓处理 |
| `demo/const/formulas.js` | 低风险 | 需替换为 Mermaid 示例数据，暂缓处理 |

**结论**：cleanup 计划不会破坏任何需要保留的设计资产。

---

## 4. 依赖风险

### 4.1 devDependencies 中的 MathML 专用依赖

以下 `package.json` 中的 `devDependencies` 在 Mermaid 项目中可能不再需要：

| 依赖 | 当前用途 | Mermaid 项目是否需要 |
|------|----------|---------------------|
| `katex` | TeX 公式渲染对比 | 不需要（extract/katex.js 被删除） |
| `mathjax` | TeX 公式渲染和 SVG 生成 | 不需要（gen_formula_svg.js 被删除） |
| `@mathjax/mathjax-mhchem-font-extension` | MathJax 化学方程式字体 | 不需要 |
| `markdown-it` | Markdown 插件测试 | 保留（plugin/ 保留） |
| `marked` | Markdown 插件测试 | 保留（plugin/ 保留） |
| `remark-math`, `remark-parse`, `remark-html`, `unified` | Markdown 插件测试 | 保留（plugin/ 保留） |
| `html-minifier` | HTML 压缩 | 需确认用途 |
| `oxc-parser` | AST 解析（stringAnalyze.js） | 不需要（stringAnalyze.js 被删除） |
| `cli-table3` | 表格输出（bench/chart.js） | 不需要（bench/ 被删除） |

**策略**：不在 cleanup 阶段修改 `package.json`。依赖清理应作为独立步骤，在确认所有保留文件不再依赖这些包后再执行。建议在下一个 Phase 末尾由人工确认后统一清理。

### 4.2 Bun vs pnpm

项目使用 `bun.lock`，同时存在 `pnpm-lock.yaml`。删除 `pnpm-lock.yaml` 无风险。

---

## 5. 推荐回滚策略

### 5.1 回滚原则

- 每个删除操作对应一个独立的 git commit
- 使用 conventional commits：`chore(cleanup): remove <path>`
- commit message 中注明删除原因
- 如果回滚，直接 `git revert <commit>` 即可

### 5.2 回滚步骤

如果删除导致问题：

1. **构建失败**：`git revert` 对应 commit → 重新 `bun dev.js` 验证
2. **测试失败**：`git revert` 对应 commit → 重新 `./test.sh` 验证
3. **页面渲染异常**：`git revert` 对应 commit → 重新打开 dev server 验证

### 5.3 分步执行建议

建议按以下顺序分步执行清理，每步之间验证构建：

1. **Step A**：删除 `sh/bench/` 整个目录 + 更新 `knip.js`
2. **Step B**：删除 `sh/gen_formula_svg.js` + `sh/stringAnalyze.js` + `sh/unicodeUnescape.js` + 更新 `knip.js`
3. **Step C**：删除 `extract/` 下全部文件（目录保留，Mermaid 版 run.js 后续写入）
4. **Step D**：删除 `dist.js` + `pnpm-lock.yaml` + 更新 `knip.js`
5. **Step E**：删除 `demo/svg/demo.zh.svg` + `demo.svg/demo.en.svg` + `demo/svg/x.svg`

每步执行后：
- 运行 `./test.sh` 确认测试通过
- 运行 `bun dev.js` 确认 dev server 正常
- 运行 `bun demo/build.js` 确认构建通过

### 5.4 不回滚的情况

以下情况不需要回滚，直接修复即可：
- `knip.js` entry 路径过期 → 更新 `knip.js`
- `package.json` 中的 `lint-staged` 引用过期 → 更新配置

---

## 6. 总结

| 风险类别 | 严重程度 | 可回滚性 |
|----------|----------|----------|
| 测试流程中断 | 低 | git revert |
| Vite 构建报错 | 中（需检查 SVG 引用） | git revert |
| 设计资产丢失 | 无（全部保留） | N/A |
| 依赖断裂 | 低 | 更新 knip.js |
| devDependencies 冗余 | 低（不影响功能） | 后续清理 |

**总体评估**：cleanup 计划风险可控。所有删除操作可通过 git revert 回滚。建议分步执行，每步验证。
