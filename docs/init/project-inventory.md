# Project Inventory — Phase 1 Cognition

## 基础信息

- **原始项目**: `@webc.site/math` — 全球最小最快的网页 Markdown 公式渲染器（TeX → MathML）
- **fork 来源**: `https://github.com/webc-site/math`
- **包名**: `@webc.site/math` (v0.1.22)
- **许可证**: MulanPSL-2.0
- **运行时**: Bun（开发和构建），ESM module
- **部署目标**: Cloudflare Pages（静态站点）

## 框架与构建工具

| 工具                    | 用途                                               |
| ----------------------- | -------------------------------------------------- |
| **Vite 8**              | 开发服务器 + 生产构建，root 指向 `demo/`           |
| **Pug**                 | HTML 模板引擎，通过 Vite 插件编译 `demo/index.pug` |
| **Stylus**              | CSS 预处理器，通过 `@3-/stylus` 编译               |
| **LightningCSS**        | CSS 压缩和浏览器兼容                               |
| **Rolldown**            | `src/` → `lib/` 的 minify 打包（`minify.js`）      |
| **Bun test**            | 测试运行器                                         |
| **oxlint / oxfmt**      | 代码检查和格式化                                   |
| **Husky + lint-staged** | Git hooks                                          |

## 源目录及职责

### `src/` — 上游 TeX → MathML 库（受保护，不修改）

- `mathml.js` — 核心 TeX → MathML 编译器
- `md.js` — Markdown 中 LaTeX 公式的解析与编译
- `lex.js` — 词法分析
- `parse.js` — 语法解析
- `const/` — 常量定义（ATTR, ENV, ERR, FUNC, LIMITS, NOTATION, STYL, SYM, TOK, TYPE）
- `mathml.d.ts`, `md.d.ts` — TypeScript 类型声明

### `lib/` — 编译产物（受保护，不修改）

- 由 `minify.js` 从 `src/` 生成
- 包含 `mathml.js`, `md.js` 及其 sourcemap 和 `.d.ts`

### `demo/` — Web Demo 页面（Mermaid 集成主战场）

- `index.pug` — 主页面 Pug 模板，当前为 Math 公式渲染器 demo
- `index.js` — 主页面逻辑，包含 i18n 加载、MathML 交互编辑器、公式卡片瀑布流布局
- `style.styl` — 主样式，定义卡片、编辑器、网格布局、响应式
- `build.js` — Vite 构建后复制 i18n 资源到 dist
- `i18n/` — **75 个语言文件**，每个导出一个函数返回翻译对象（含 title, subtitle, formulas*title, benchmark*\_, editor\_\_, usage\_\*, names[] 等 key）
- `webc/` — Web Components
  - `Math.js` — `<c-math>` 组件，Shadow DOM，调用 `lib/mathml.js` 渲染 MathML
  - `I18n.js` + `I18n/` — `<c-i18n>` 国际化组件，语言选择器
  - `Box.js` + `Box/` — 盒子组件
  - `BoxX.js` + `BoxX/` — 扩展盒子组件
  - `Scroll.js` + `Scroll/` — 滚动组件
  - `Btn/` — 按钮样式
  - `Lg/` — 大屏布局样式
  - `js/` — 共享 JS 工具（cE.js, i18n.js 等）
- `svg/` — SVG 图标资源
  - `bg.svg` — 页面背景
  - `npm.svg`, `github.svg` — 社交链接图标
  - `i18n.svg` — 语言选择器图标
  - `demo.zh.svg`, `demo.en.svg` — demo 截图
  - `x.svg` — 关闭图标
- `const/` — 静态数据
  - `formulas.js` — 32 个经典数学公式数组
  - `langName.js` — 语言名称映射
- `public/` — favicon 和 web manifest
- `size.svg` — JS 体积对比柱状图（KaTeX vs MathJax vs 本项目）
- `speed.svg` — 性能对比柱状图

### `extract/` — 测试抽取（需重写为 Mermaid）

- `run.js` — 当前从 KaTeX/MathJax 抽取 TeX 测试用例，生成 `test/case/*.yml`
- `katex.js` — KaTeX 公式抽取与渲染
- `mathjax.js` — MathJax 公式抽取与渲染
- `lib.js` — 抽取辅助函数（read, norm, isSupported）

### `test/` — 测试

- `compare.test.js` — bun test 入口，遍历所有 case 执行对比测试
- `compare.js` — 测试核心逻辑：加载 YAML → 调用编译器 → 对比 MathML 输出
- `case/` — MathML YAML 测试用例（7 个文件：basic, frac, func, greek, operator_relation, sqrt, sub_sup）

### `sh/` — 脚本

- `check.js` — i18n 语言文件完整性校验（检查 75 个语言文件的 key 一致性）
- `ROOT.js` — 项目根目录路径
- `compile_i18n.js` — 编译 i18n 资源
- `gen_formula_svg.js` — 生成公式 SVG 图
- `bench/` — 性能基准测试脚本
  - `chart.js`, `history.yml`, `pk.js`, `self.js`, `util.js`
- `hook/` — Git hooks
  - `svg.js`, `styl.js`
- `github/` — GitHub Actions 辅助脚本
- `stringAnalyze.js`, `unicodeUnescape.js` — 工具脚本

### `plugin/` — Markdown 插件集成（受保护）

- `markdown-it/`, `marked/`, `remark/` — 三种 Markdown 解析器的 MathML 插件
- `serve.js` — 插件 demo 服务
- `index.pug` — 插件 demo 页面

### `blog/` — 博客内容（受保护）

- `en/`, `zh/` — 中英文博客文章
- `svg/` — 博客用 SVG
- `assets/` — 博客资源
- `devto_id.json` — DevTo 文章 ID

### `readme/` — README 组件（受保护）

- `en/`, `zh/` — 多语言 README 片段

### `workflow/` — 自动化 workflow

- `loops/init/` — Init Loop 相关
  - `init-loop.config.ts`, `init-loop.ts` (如存在)
- `hooks/` — workflow hooks
- `runs/` — 执行记录
- `state/` — 状态文件
  - `init-loop.state.json`

### 其他文件

- `dev.js` — Vite 开发服务器启动脚本
- `dist.js` — 构建 + 发布到 npm
- `minify.js` — Rolldown minify `src/` → `lib/`
- `knip.js` — 未使用代码检测配置
- `test.sh` — 测试流程：check → oxfmt → minify → oxlint → bun test
- `supremacy.yml` — Stylus 格式化配置
- `.env` — 环境变量（可能含 API key）
- `.opencode/` — OpenCode 配置
- `opencode.jsonc` — OpenCode 配置

## package.json Scripts

```json
{
  "prepare": "husky",
  "test": "bash test.sh",
  "build": "bun demo/build.js",
  "build:lib": "bun minify.js",
  "extract": "node extract/run.js",
  "dev": "bun dev.js",
  "agent:init": "tsx --env-file=.env workflow/loops/init/init-loop.ts"
}
```

注意：`build` 是 demo/Cloudflare Pages 口径，输出 `demo/dist/`；原 `src/` → `lib/` 构建保留为 `build:lib`。

## 部署配置

- **开发**: `bun dev.js` → Vite dev server on port 9999
- **构建**: `bun demo/build.js` → Vite build → 输出到 `demo/dist/`
- **CI**: `.github/workflows/npm.yml` — 自动发布到 npm（package.json 变更时触发）
- **无 Cloudflare Pages 配置** — 需新增

## Demo 页面当前结构

页面（`demo/index.pug`）分为：

1. **Header** — 标题 + I18n 选择器 + NPM/GitHub 链接
2. **Main Grid** (2 列)
   - 左侧：使用示例卡片 + 交互式编辑器卡片（textarea + `<c-math>` 预览）
   - 右侧：尺寸对比 SVG 柱状图 + 性能对比 SVG 柱状图
3. **公式区域** — 经典公式卡片瀑布流

### I18n 机制

- 语言列表：75 个 locale（LANG_CODES 数组）
- 翻译文件：`demo/i18n/{code}.js`，每个导出 `() => ({...})` 函数
- Web Component `<c-i18n>` 提供语言切换 UI
- 翻译 key 包括：title, subtitle, formulas*title, benchmark_size*_, benchmark*speed*_, editor*\*, usage*\*, names[]
- Web Component i18n 子系统：`demo/webc/I18n/i18n/{code}/js.json` — 75 个 locale 的 UI 翻译

## 风险与未知

1. **mermaid 依赖引入方式**：mermaid 包体积较大（~1MB+），如何保持"轻量"目标？需要确认是否仅浏览器端按需加载或使用 CDN
2. **Vite 构建配置**：当前 vite.config.js 有自定义 Pug/Stylus 插件，新增 mermaid 可能需要调整
3. **demo/index.pug 重写范围**：当前页面完全围绕 MathML 设计，Mermaid 版本需要大幅改造布局
4. **test.sh 兼容**：当前 test.sh 包含 `bun x oxfmt` 和 `bun minify.js`，这些是 MathML 构建流程的一部分，Mermaid 测试需要兼容
5. **`extract/run.js` 重写**：当前抽取的是 TeX 公式，需要完全重写为 Mermaid 测试抽取
6. **size.svg / speed.svg**：当前是 MathML 对比图（KaTeX vs MathJax vs @webc.site/math），需要替换为 beautiful-mermaid vs 本项目
7. **Cloudflare Pages 构建命令**：当前没有 CF Pages 配置，需要确定构建命令和输出目录
8. **mermaid 浏览器端渲染**：需确认 mermaid 包的 ESM 兼容性和 Vite 集成方式
9. **`sh/bench/` 脚本**：当前用于 MathML 性能基准，Mermaid 版本需要新的基准策略
10. **CSS 主题**：beautiful-mermaid CSS 的集成方式需确认（直接内联、CDN 还是 npm 包）
