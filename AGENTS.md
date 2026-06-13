编辑 demo 后，运行 ./sh/check.js 检查语言文件是否都正确。

修改 src/lib 后运行 ./test.sh，测试

# JS 代码规范

## 代码风格

- 简洁、优雅、高效，用最现代的 js 语法
- 拆分过长的函数，接口设计要低耦合、高内聚
- 多用数组+循环 / forEach / map，少写重复代码
- 简单代码不写函数注释，避免过度注释。复杂逻辑、特殊需求，用精炼的中文注释
- 重复代码抽象为函数，降低冗余，比如 `cosnt A=new Table({ style: { border: NO_BORDER } }), B=new Table({ style: { border: NO_BORDER } })`，可以写为 `const newTable=()=>new Table({ style: { border: NO_BORDER } }), A=newTable(), B=newTable()`
- 变量声明：合并多个连续的 `const` 声明为一个语句。要写 `const a=1, b=2, c=3;`，而不是分三行写
- 异步处理：用 `await`，禁止使用 `.then` 链式调用
- 不要自动生成处理异常代码，不自动写 `try...catch`（`try ... catch` 由人工维护，已有的 `try catch` 不要删除）
- 纯函数优先：只写纯函数，绝对不要写 class
- 用箭头函数 `const funcName = () => {}`，不使用 `function` 关键字(生成器除外)；如可用 .bind 绑定参数，就避免定义函数
- 代码复用：注重复用，多提取小函数，坚决避免出现大量类似或复制粘贴的代码结构
- 对象访问：优先使用解构赋值提取需要的属性，避免内部反复使用点号访问深层和嵌套属性，并合并重复的可选链判断
- 函数参数不要用对象，不写 `{a,b,c}`，写 `a, b, c`；如可选参数多，用[[配置项的数字,配置项],[配置项的数字,配置项],..] 这种范式，配置项用数字常量定义
- 多值返回，用数组 `[a,b,c]`，不是 `{a,b,c}`，如返回值超过3个，用数字常量定义位置含义
- 不用要字符串表示状态，用数字常量定义状态
- 不用字符串模板(``)，用字符串拼接(+)
- for 循环，如需序号，用 `++i` 而不是 `i++`
- 不用 console.error 用 @3-/log/ERR.js
- 不用 console.warn 用 @3-/log/WARN.js

## 命名规范

- 命名追求极简。使用尽量短但有意义的命名，比如：用 `rm` 而不是 `remove`、`delete`、`del`。但，亦要避免走极端，比如:不要用单个字母 `m` 替代 `map`
- 函数命名尽量只用动词，可以用一个单词表达，就不要用两个单词。名词用文件命名体现，如果有需要在文件名中加入动词，请名词在前，动词在后。比如：是 `profileSet.js` 而不是 `setProfile.js`
- 变量名: 使用下划线风格 (snake_case)，例如 `user_auth_token`
- 函数名: 使用小写驼峰风格 (camelCase)，例如 `userData`
- 函数参数: 如是回调函数，用小写驼峰命名，如 `onChange`
- 模块级常量定义用大写下划线风格 `UPPER_SNAKE_CASE`
- 不写 `get` 这类没意义前缀，如: 写 `cookieByHeader`，而不是 `getCookie`
- 全局/模块级常量：使用大写下划线风格 (UPPER_SNAKE_CASE)，例如 `CODE_TO_ID`、`ID_TO_LANG`

## 模块化机制

- 导入：按需精准导入函数，禁止直接导入整个模块（避免 `import * as x` 或导入大对象）
- 导出：禁止导出对象。以函数、变量为单元导出，比如 `export const X=1, abc=()=>{};`,尽量合并用一个 const + 逗号来声明导出的内容,如果一个文件只有一个函数，用 `export default`
- 除非需要内部调用 export default 的函数，否则避免先声明常量再在文件末尾导出
- 路径解析：获取当前目录路径时，必须使用 `import.meta.dirname`

## 错误

- 避免用字符串错误，尽量用 const 声明 常量错误代码
- 如需要返回错误的数据信息，用 [错误码,错误信息,...] 这种方式，错误信息不是文本描述，而是数值之类的(比如[FILE_OVERSIZE, file_size, max_size])
-

## 尽量用兼容浏览器的 API

- 加解密：强制使用原生的 Web Crypto API
- 二进制数据：处理二进制时，尽量统一使用 `Uint8Array`

---

# Mermaid → SVG 项目规范

## 项目目标

在现有 `@webc.site/math` 项目基础上，实现一个**轻量、浏览器端、专注于 Mermaid → SVG 转换**的前端工具。用户可以在页面中输入 Mermaid 源文本，系统在浏览器端完成渲染，并展示 SVG 图像结果。

## 非目标

- 不自研 Mermaid Parser 或 layout engine
- 不使用服务端 Mermaid 转换
- 不引入数据库、队列、用户系统等后端基础设施
- 不进行与 Mermaid → SVG 无关的大规模重构
- 不删除上游项目的 MathML 库、plugin 集成、blog 内容
- 当前版本不做 SVG 下载、渲染历史、自动补全、AI 生成等

## Coding Agent 边界

### 允许

- 修改 `demo/` 目录下的页面代码（Pug、JS、Stylus）
- 在 `demo/webc/` 下新增 Mermaid 组件
- 修改 `demo/i18n/*.js` 添加 Mermaid 相关翻译 key
- 重写 `extract/` 目录为 Mermaid 测试抽取
- 在 `test/` 下新增 Mermaid YAML 测试和 test runner
- 修改 `demo/const/` 添加 Mermaid 示例数据
- 修改 `demo/svg/` 替换对比图表
- 修改 `vite.config.js` 添加 Mermaid 相关构建配置
- 新增 `workflow/reports/size-report.json` 和相关脚本
- 新增 `workflow/reports/i18n-report.json`
- 修改 `test.sh` 和 `sh/check.js` 以适配新测试
- 添加 `mermaid` npm 依赖（仅 devDependencies 或浏览器端加载）

### 禁止

- 不修改 `src/` 目录（上游 TeX → MathML 库）
- 不修改 `lib/` 目录（编译产物，由 `minify.js` 生成）
- 不修改 `../docs/mermaid-svg-spec.md`
- 不修改 `../docs/acceptance-criteria.md`
- 不修改 `../docs/mermaid-svg-architecture.md`
- 不修改 `references/**`（上游参考仓库）
- 不删除 `plugin/`、`blog/`、`readme/` 等上游项目资产
- 不删除 `test/case/*.yml`（MathML 测试，属于上游项目）
- 不删除 `demo/webc/Math.js`（上游组件）
- 不修改 `.github/workflows/npm.yml`（上游 CI）

## 受保护文件

以下文件不得修改（除非明确要求）：

- `src/**` — 上游 MathML 库
- `lib/**` — 编译产物
- `../docs/mermaid-svg-spec.md` — 项目规约
- `../docs/acceptance-criteria.md` — 验收标准
- `../docs/mermaid-svg-architecture.md` — 技术架构
- `references/**` — 参考仓库
- `plugin/**` — markdown 插件集成
- `blog/**` — 博客内容

## 依赖策略

- 运行时依赖：**零**（目标与上游一致，保持轻量）
- `mermaid` 包通过浏览器端加载或 devDependencies 引入
- 不引入大型运行时依赖（不用 chart.js、d3 等）
- CSS 主题来自 `beautiful-mermaid`，需记录来源和版本
- 不使用 `import * as x`，按需精准导入

## 测试策略

- `test/*.yml` — Mermaid YAML 测试文件（由 `extract/run.js` 生成）
- `test/case/*.yml` — 上游 MathML 测试（保持不动）
- `test/schema.yml` — YAML 测试 schema
- `test.sh` — 主测试流程：check → oxfmt → minify → oxlint → bun test
- 测试运行器：`bun test`
- 新增 Mermaid 测试不应破坏现有 MathML 测试
- 所有最终纳入执行的 YAML 测试必须通过

## Repo 清理策略

- 不主动删除文件。将疑似可移除的文件记录在 `docs/init/remove-candidates.md`
- 保守清理优先，不确定的保留
- 清理决策需经过人工确认

## Human Gate 策略

以下决策节点需要人工介入：

1. Spec / 验收标准确认
2. 测试抽取范围确认
3. `extract/run.js` 重写方案确认
4. demo 页面从 Math 改为 Mermaid 的改动范围确认
5. i18n 新增 key 列表和 fallback 策略确认
6. `beautiful-mermaid` 对比口径确认
7. Cloudflare Pages 部署方式确认
8. 最终 diff 确认

以下不需要人工介入：

- 单任务执行和局部代码修改
- 测试失败后的自动重试修复
- build 重跑
- 文档更新

## 项目结构速览

```
demo/            → Web Demo (Pug + JS + Stylus) — Mermaid 集成主战场
  i18n/          → 75 种语言翻译文件 — 需新增 Mermaid key
  webc/          → Web Components — 需新增 Mermaid 组件
  svg/           → SVG 资源 — 需替换对比图
  const/         → 静态数据 — 需新增 Mermaid 示例
src/             → 上游 TeX → MathML 库 — 不动
lib/             → 编译产物 — 不动
extract/         → 测试抽取 — 需重写为 Mermaid
test/            → 测试 — 需新增 Mermaid 测试
test/case/       → MathML 测试 — 保持不动
sh/              → 脚本 — 需适度扩展
plugin/          → markdown 插件 — 不动
blog/            → 博客 — 不动
workflow/        → 自动化 workflow — 不动
references/   → 参考仓库 (maid, beautiful-mermaid, mermaid) — 不动
../docs/         → 项目规约文档 — 不动
```
