# Preserve List — 必须保留的文件与目录

本文件列出项目中必须保留的内容，并说明保留原因。

## 受保护（Spec 明确禁止修改/删除）

| 路径                                  | 原因                                             |
| ------------------------------------- | ------------------------------------------------ |
| `src/**`                              | 上游 TeX → MathML 库，Mermaid 项目不改核心库     |
| `lib/**`                              | 编译产物，由 `minify.js` 从 `src/` 生成          |
| `../docs/mermaid-svg-spec.md`         | 项目规约文档                                     |
| `../docs/acceptance-criteria.md`      | 验收标准文档                                     |
| `../docs/mermaid-svg-architecture.md` | 技术架构文档                                     |
| `../references/**`                    | 上游参考仓库（maid, beautiful-mermaid, mermaid） |
| `plugin/**`                           | Markdown 插件集成，属于上游项目资产              |
| `blog/**`                             | 博客内容，属于上游项目资产                       |
| `readme/**`                           | README 组件，属于上游项目资产                    |
| `.github/workflows/npm.yml`           | 上游 CI 配置                                     |
| `demo/webc/Math.js`                   | 上游 Math 组件                                   |

## 必须保留（Mermaid 项目需要复用或依赖）

| 路径                                       | 原因                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `demo/i18n/` (75 个语言文件)               | Mermaid 项目必须支持同样的 75 种语言国际化。每个文件需要新增 Mermaid 相关翻译 key |
| `demo/webc/I18n.js` + `demo/webc/I18n/`    | 国际化 Web Component 系统，Mermaid 页面复用此组件进行语言切换                     |
| `demo/webc/I18n/CODE.js`                   | 语言代码列表，i18n 基础数据                                                       |
| `demo/webc/I18n/NAME.js`                   | 语言名称列表                                                                      |
| `demo/webc/I18n/i18n/` (75 个 locale 目录) | Web Component i18n 子系统的翻译文件                                               |
| `demo/webc/js/cE.js`                       | Web Component 注册工具函数                                                        |
| `demo/webc/js/i18n.js`                     | `onLang` 回调机制，语言切换核心                                                   |
| `demo/webc/Scroll.js` + `Scroll/`          | 滚动组件，可能复用于 Mermaid SVG 预览区                                           |
| `demo/webc/Box.js` + `Box/`                | 盒子组件，页面布局复用                                                            |
| `demo/webc/BoxX.js` + `BoxX/`              | 扩展盒子组件                                                                      |
| `demo/webc/Btn/`                           | 按钮样式，主题切换按钮可能复用                                                    |
| `demo/webc/Lg/`                            | 大屏布局样式                                                                      |
| `demo/style.styl`                          | 主样式文件，Mermaid 页面需在其基础上修改                                          |
| `demo/index.pug`                           | 页面模板，Mermaid 页面需重写                                                      |
| `demo/index.js`                            | 页面逻辑，需改为 Mermaid 逻辑                                                     |
| `demo/build.js`                            | 构建脚本，Vite 构建后复制 i18n 资源                                               |
| `demo/public/`                             | favicon 和 web manifest                                                           |
| `demo/const/langName.js`                   | 语言名称映射，i18n 依赖                                                           |
| `demo/svg/bg.svg`                          | 页面背景图，视觉风格复用                                                          |
| `demo/svg/npm.svg`                         | NPM 图标                                                                          |
| `demo/svg/github.svg`                      | GitHub 图标                                                                       |
| `demo/svg/i18n.svg`                        | 语言选择器图标                                                                    |
| `vite.config.js`                           | Vite 构建配置，需扩展但保留基础框架                                               |
| `package.json`                             | 项目配置，需修改（名称、描述等）但保留依赖和 scripts 基础                         |
| `minify.js`                                | Rolldown minify 脚本，`src/` → `lib/` 构建                                        |
| `test.sh`                                  | 主测试流程，需扩展但保留现有 MathML 测试步骤                                      |
| `sh/check.js`                              | i18n 校验脚本，Mermaid 新增 key 后仍需此脚本                                      |
| `sh/ROOT.js`                               | 项目根目录路径工具                                                                |
| `sh/hook/`                                 | Git hooks（svg, styl 格式化）                                                     |
| `dev.js`                                   | Vite 开发服务器启动                                                               |
| `supremacy.yml`                            | Stylus 格式化配置                                                                 |
| `.husky/`                                  | Git hooks 配置                                                                    |
| `.gitignore`                               | Git 忽略规则                                                                      |
| `.eslintignore`                            | ESLint 忽略规则                                                                   |
| `knip.js`                                  | 未使用代码检测配置                                                                |

## 必须保留（上游 MathML 测试，不能删除）

| 路径                              | 原因                     |
| --------------------------------- | ------------------------ |
| `test/case/basic.yml`             | 上游 MathML 基础测试     |
| `test/case/frac.yml`              | 上游 MathML 分数测试     |
| `test/case/func.yml`              | 上游 MathML 函数测试     |
| `test/case/greek.yml`             | 上游 MathML 希腊字母测试 |
| `test/case/operator_relation.yml` | 上游 MathML 运算符测试   |
| `test/case/sqrt.yml`              | 上游 MathML 根号测试     |
| `test/case/sub_sup.yml`           | 上游 MathML 上下标测试   |
| `test/compare.js`                 | MathML 对比测试核心逻辑  |
| `test/compare.test.js`            | MathML 对比测试入口      |

## 可适当修改（Mermaid 集成需要改动但保留基础）

| 路径                     | 原因                                              |
| ------------------------ | ------------------------------------------------- |
| `demo/const/formulas.js` | 当前是 Math 公式数组，需替换或新增为 Mermaid 示例 |
| `demo/size.svg`          | 当前是 MathML 体积对比图，需替换为 Mermaid 版本   |
| `demo/speed.svg`         | 当前是 MathML 性能对比图，需替换为 Mermaid 版本   |
| `demo/svg/demo.zh.svg`   | 当前是 MathML demo 截图，可能需要替换             |
| `demo/svg/demo.en.svg`   | 同上                                              |
