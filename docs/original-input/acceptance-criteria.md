# Mermaid to SVG Acceptance Criteria

## 1. 文档目的

本文档定义 Mermaid → SVG 项目的验收标准。

本项目不是单纯实现一个 Mermaid 预览页面，而是需要完成以下交付：

- 从指定开源库中抽取可用 Mermaid 测试样例
- 生成可运行的 YAML 测试文件
- 实现浏览器端 Mermaid → SVG 展示页面
- 展示多类型 Mermaid 示例图
- 复用 `math.webc.site` 的设计风格
- 支持 Beautiful Mermaid CSS 主题切换
- 展示与 `beautiful-mermaid` 的 JS 体积 / gzip 体积对比 SVG 柱状图，并明确该对比仅作为性能 proxy
- 部署到 Cloudflare Pages
- 支持与 `math.webc.site` 一致的多语言国际化能力
- 记录 AI 辅助开发 workflow，明确 Codex / OpenCode / Orchestrator 分工

本文件作为项目实现、自动化测试和人工验收的共同依据。

---

## 2. 原始需求覆盖

项目必须覆盖以下原始要求：

1. 从以下仓库抽取可用测试：

   - `https://github.com/probelabs/maid`
   - `https://github.com/lukilabs/beautiful-mermaid`
   - `https://github.com/mermaid-js/mermaid`

2. 抽取脚本放置在：

   ```text
   ./extract/run.js
   ```

3. 生成的测试文件放置在：

   ```text
   test/*.yml
   ```

4. 所有抽取生成的测试必须能跑通。

5. 网页必须部署到 Cloudflare Pages。

6. 页面应尽可能复用 `math.webc.site` 的设计风格，项目 GitHub 代码库 `demo` 文件夹下的网站代码应作为主要设计参考。

7. 页面必须支持：

   - 输入 Mermaid
   - 查看生成图
   - 展示不同类型的 Mermaid 图片

8. 页面必须包含与 `beautiful-mermaid` 的尺寸和性能对比 SVG 柱状图。

9. 尺寸对比范围限定为：

   - `beautiful-mermaid` 在 CDN 上的 JS 文件
   - 本项目代码在打包、gzip 压缩后的大小

10. 页面必须支持使用 `beautiful-mermaid` 的 CSS 切换样式，并提供主题切换按钮。

11. 页面必须支持与 `https://math.webc.site` 一样的七十多种语言国际化。

12. 项目必须记录 AI 辅助开发方式，说明自动化开发循环、Codex / OpenCode / Orchestrator 分工、人工 review 节点和验收 gate。

---

## 3. 测试抽取验收

### AC-EXTRACT-001：抽取脚本位置正确

验收标准：

- 项目中必须存在：

  ```text
  ./extract/run.js
  ```

- 该脚本负责从指定参考仓库中抽取可用 Mermaid 测试样例。

- 脚本应可以通过 Node.js 命令执行。

- 脚本不应依赖人工复制粘贴测试内容。

验收方式：

- 检查文件是否存在。
- 执行抽取脚本。
- 确认脚本可以完成测试抽取流程。

---

### AC-EXTRACT-002：抽取来源正确

验收标准：

抽取脚本必须以以下三个仓库为测试来源：

- `probelabs/maid`
- `lukilabs/beautiful-mermaid`
- `mermaid-js/mermaid`

若仓库已被 clone 到本地 `references/` 目录，应优先从本地源码读取。

验收方式：

- 检查抽取脚本的输入路径或配置。
- 确认抽取来源包含上述三个项目。
- 确认不是从无关项目或手写样例中伪造测试集。

---

### AC-EXTRACT-003：生成 YAML 测试文件

验收标准：

- 抽取后的测试文件必须生成到：

  ```text
  test/*.yml
  ```

- 每个 YAML 测试文件应包含足够信息用于自动测试。

- 每条测试至少应包含：

  - 测试 ID
  - 来源仓库
  - Mermaid diagram type
  - Mermaid 源文本
  - 预期行为

验收方式：

- 执行抽取脚本。
- 检查 `test/` 目录下是否生成 `.yml` 文件。
- 检查 YAML 是否可解析。
- 检查字段是否足够支撑测试执行。

---

### AC-EXTRACT-004：只抽取可用测试

验收标准：

- 生成的测试应是当前项目能够执行的 Mermaid 渲染测试。
- 抽取脚本应过滤明显不可用、依赖外部上下文、过度复杂或无法稳定运行的样例。
- 不应把无法跑通的样例写入最终 `test/*.yml`。
- 若某些样例被跳过，应记录跳过原因。

验收方式：

- 检查抽取脚本的过滤逻辑。
- 检查抽取报告或日志。
- 确认最终生成的测试集可以稳定执行。

---

### AC-EXTRACT-005：所有抽取测试必须跑通

验收标准：

- 所有由 `./extract/run.js` 生成的 `test/*.yml` 测试必须能跑通。
- 测试失败时，不能通过删除失败测试来掩盖问题，除非该测试被明确判定为不可用，并记录原因。
- 测试执行应可被 CI 调用。

验收方式：

- 执行测试命令。
- 确认所有 `test/*.yml` 对应测试通过。
- 检查失败测试是否被正确处理。

---


### AC-EXTRACT-006：生成测试抽取报告

验收标准：

- 抽取脚本必须生成：

  ```text
  extract/report.json
  ```

- 报告必须按来源仓库记录：

  - scanned files
  - candidate Mermaid samples
  - accepted tests
  - skipped samples

- 报告必须按 diagram type 聚合 accepted / skipped 数量。
- 报告必须记录 skip reasons。
- 若某个来源仓库 accepted 数量为 0，必须说明原因。
- 不允许静默忽略某个来源仓库。

验收方式：

- 执行 `./extract/run.js`。
- 检查 `extract/report.json` 是否存在且可解析。
- 检查三个指定来源仓库是否均出现在报告中。
- 检查每个来源仓库是否有 scanned / candidate / accepted / skipped 统计。
- 检查 skip reasons 是否可追溯到具体来源路径或样例。

---

### AC-EXTRACT-007：YAML 测试 Schema 固化

验收标准：

- 项目必须提供以下二选一的测试 schema 文件：

  ```text
  test/schema.yml
  ```

  或：

  ```text
  workflow/test-schema.yml
  ```

- 每个 `test/*.yml` 必须先通过 schema 校验，再进入 Mermaid 渲染测试。
- Schema 至少应覆盖：

  - test id
  - source repo
  - source path
  - diagram type
  - Mermaid source text
  - expected render behavior
  - SVG structural expectations
  - skip flag and skip reason

验收方式：

- 检查 schema 文件是否存在。
- 执行测试命令。
- 确认测试 runner 会先校验 YAML schema。
- 故意构造缺字段 YAML 时，测试 runner 应在 schema 校验阶段失败。

---

## 4. Mermaid → SVG 页面功能验收

### AC-UI-001：页面可输入 Mermaid

验收标准：

- 页面提供 Mermaid 源文本输入区域。
- 用户可以输入、编辑、清空 Mermaid 内容。
- 输入区域应适合粘贴多行 Mermaid 文本。
- 输入非法内容时页面不崩溃。

验收方式：

- 打开页面。
- 输入多行 Mermaid 文本。
- 修改、清空输入。
- 确认页面保持可交互。

---

### AC-UI-002：页面可查看生成图

验收标准：

- 用户输入合法 Mermaid 后，页面应生成并展示图像。
- 展示结果应基于 SVG。
- 不允许用截图、canvas 或静态图片冒充 Mermaid 渲染结果。
- 生成结果应随输入变化而更新。

验收方式：

- 输入合法 Mermaid。
- 检查页面中是否出现 SVG 结果。
- 修改 Mermaid 内容。
- 确认 SVG 结果更新。

---

### AC-UI-003：展示不同类型 Mermaid 图片

验收标准：

- 页面应展示不同 Mermaid diagram type 的示例图。
- 示例图应来自项目支持范围或抽取测试集中稳定可用的类型。
- 示例展示应帮助用户理解该工具支持哪些 Mermaid 图。
- 示例图不应只是静态截图，而应体现 Mermaid → SVG 渲染能力。

验收方式：

- 打开页面。
- 检查是否存在多个类型的 Mermaid 示例。
- 确认示例可以正常显示为 SVG。

---

### AC-UI-004：错误状态稳定

验收标准：

- 空输入时页面不崩溃。
- 非法 Mermaid 语法时页面不崩溃。
- 暂不支持或不可渲染的样例应给出清晰提示。
- 从错误输入切换回合法输入后，页面应恢复正常渲染。

验收方式：

- 输入空内容。
- 输入非法 Mermaid。
- 再输入合法 Mermaid。
- 确认页面状态正确切换。

---

## 5. 设计风格验收

### AC-DESIGN-001：复用 math.webc.site 设计风格

验收标准：

- 页面视觉风格应尽可能复用 `math.webc.site`。
- 应参考项目 GitHub 代码库中 `demo` 文件夹的网站代码。
- 布局、字体、间距、按钮、卡片、色彩等应与原网站风格保持一致。
- 不应另起一个完全不同风格的独立 demo 页面。

验收方式：

- 对比当前页面与 `math.webc.site` / `demo` 目录实现。
- 人工 review 页面风格一致性。
- 检查是否复用了已有样式或组件。

---

### AC-DESIGN-002：页面是可提交的 demo

验收标准：

- 页面应具备清晰的产品入口。
- 用户无需阅读代码即可理解如何输入 Mermaid 并查看图。
- 示例、输入区、预览区、主题切换和对比图应布局清晰。
- 页面不应表现为临时调试工具。

验收方式：

- 人工打开页面 review。
- 检查页面是否适合作为笔试题提交成果。

---

## 6. Cloudflare Pages 部署验收

### AC-DEPLOY-001：可部署到 Cloudflare Pages

验收标准：

- 项目应能被 Cloudflare Pages 构建和部署。
- 构建命令、输出目录和环境要求应明确。
- 不依赖 Cloudflare Pages 不支持的服务端运行能力。
- 部署后页面可以通过公网 URL 访问。

验收方式：

- 在 Cloudflare Pages 中完成构建部署。
- 打开部署后的页面。
- 确认核心功能可用。

---

### AC-DEPLOY-002：部署版本功能完整

验收标准：

部署后的页面必须支持：

- Mermaid 输入
- SVG 预览
- 多类型示例展示
- 主题切换
- 尺寸 / 性能对比 SVG 柱状图
- 国际化切换或多语言访问能力

验收方式：

- 在 Cloudflare Pages 部署环境中逐项测试。
- 不只在本地环境验收。

---

## 7. Beautiful Mermaid 对比图验收

### AC-COMPARE-001：页面包含 SVG 柱状图

验收标准：

- 页面必须包含一个 SVG 柱状图，用于展示与 `beautiful-mermaid` 的 JS 体积 / gzip 体积对比。该图可以作为性能 proxy，但不能等同于运行时 benchmark。
- 柱状图本身应为 SVG。
- 不应使用 PNG、JPEG 或 canvas 替代该柱状图。

验收方式：

- 打开页面。
- 检查 DOM 中存在对应 SVG 柱状图。
- 人工确认图表可读。

---

### AC-COMPARE-002：体积对比口径正确

验收标准：

体积对比只比较以下四项：

- `beautiful-mermaid` 在 CDN 上的 JS 文件原始大小
- `beautiful-mermaid` 在 CDN 上的 JS 文件 gzip 大小
- 本项目代码打包后的目标 JS 文件原始大小
- 本项目代码打包后的目标 JS 文件 gzip 大小

不得将以下内容混入主要对比口径：

- 未 gzip 的源码体积
- 整个网站所有资源体积
- unrelated vendor chunk
- 图片、字体、CSS 等非本项对比目标

验收方式：

- 检查对比数据来源说明。
- 检查构建产物 gzip 统计方式。
- 检查 `beautiful-mermaid` CDN JS 大小获取方式。

---

### AC-COMPARE-003：性能对比说明清晰

验收标准：

- 页面应说明性能对比的口径。
- 若性能只以体积作为 proxy，应明确说明。
- 当前版本不设置运行时性能 benchmark gate。
- 不应声称做了运行时性能 benchmark；若后续确实加入 runtime benchmark，必须另起独立 spec 和验收项。
- 图表标题、单位和说明必须清晰。

验收方式：

- 人工 review 页面说明。
- 检查是否存在夸大或不准确的性能表述。

---


### AC-COMPARE-004：Size Report 可追溯

验收标准：

- 项目必须生成：

  ```text
  workflow/reports/size-report.json
  ```

- 报告必须记录：

  - `beautiful-mermaid` CDN JS URL
  - `beautiful-mermaid` 版本、commit 或可追溯来源
  - `beautiful-mermaid` raw bytes
  - `beautiful-mermaid` gzip bytes
  - 本项目对比 JS entry 或 build artifact 路径
  - 本项目 raw bytes
  - 本项目 gzip bytes

- 页面 SVG 柱状图展示的数据必须与该 report 一致。
- 不允许手写、估算或混入无关 bundle 数据。

验收方式：

- 执行 size report 生成命令。
- 检查 `workflow/reports/size-report.json` 是否存在且可解析。
- 对照页面 SVG 柱状图数据。
- 检查 CDN URL 和本项目 build artifact 是否可追溯。

---

## 8. Beautiful Mermaid CSS 主题验收

### AC-THEME-001：支持 Beautiful Mermaid CSS 样式

验收标准：

- 页面必须支持使用 `beautiful-mermaid` 的 CSS 进行 Mermaid 图样式切换。
- 主题切换应影响 Mermaid SVG 的视觉样式。
- 主题切换不应破坏 Mermaid 渲染能力。

验收方式：

- 打开页面。
- 渲染 Mermaid 图。
- 切换主题。
- 确认 SVG 样式发生变化且图仍可正常显示。

---

### AC-THEME-002：页面提供主题切换按钮

验收标准：

- 页面必须提供明显的主题切换按钮或控件。
- 用户可以在页面上主动切换样式。
- 切换行为应即时或在重新渲染后生效。
- 切换失败时应给出合理反馈或保持当前主题。

验收方式：

- 点击主题切换按钮。
- 检查 Mermaid 图样式变化。
- 检查页面是否仍然稳定。

---


---

### AC-THEME-003：Beautiful Mermaid CSS 来源可追溯

验收标准：

- 项目必须记录 `beautiful-mermaid` CSS 的来源 URL、包版本、commit 或本地文件路径。
- 若运行时依赖 CDN，应说明 fallback 或降级行为。
- 默认主题不应依赖外部 CDN 才能正常显示。
- CSS 主题切换不应修改 Mermaid 核心渲染流程。

验收方式：

- 检查主题 CSS 接入代码。
- 检查文档或 report 中的 CSS 来源说明。
- 断开外部 CDN 或模拟加载失败，确认页面保持可用或有合理降级。


## 9. 国际化验收

### AC-I18N-001：支持七十多种语言

验收标准：

- 项目必须支持与 `https://math.webc.site` 一样的七十多种语言国际化。
- 语言支持范围应复用或对齐原项目已有的 i18n 机制。
- Mermaid 页面新增文案必须进入国际化系统。
- 不应只支持英文或中文两个语言。

验收方式：

- 检查 i18n 配置。
- 检查语言列表。
- 检查 Mermaid 页面新增文案是否有对应翻译键。
- 人工抽查多个语言页面。

---

### AC-I18N-002：新增页面文案完整国际化

验收标准：

以下内容必须支持国际化：

- 页面标题
- Mermaid 输入区标签
- SVG 预览区标签
- 示例图区域标题
- 错误提示
- 暂不支持提示
- 主题切换按钮
- 对比图标题、图例、单位说明
- 部署页面中可见的操作说明

验收方式：

- 切换不同语言。
- 检查页面是否仍有未翻译的硬编码文案。
- 检查 fallback 是否合理。

---


---

### AC-I18N-003：语言列表与翻译 Key 报告

验收标准：

- 项目必须提供以下二选一的国际化覆盖报告：

  ```text
  docs/i18n-language-map.md
  ```

  或：

  ```text
  workflow/reports/i18n-report.json
  ```

- 报告必须包含：

  - 从原项目读取或对齐的语言列表
  - Mermaid 页面新增 translation keys
  - 每个 locale 是否存在对应 key
  - fallback 策略
  - 至少若干代表性语言的人工或自动抽查结果

- 新增 Mermaid 页面文案必须在所有 locale 中存在 key。
- 翻译内容可以使用 fallback，但不能缺失 key。

验收方式：

- 检查 i18n report。
- 对照原项目语言列表。
- 检查新增 Mermaid 页面文案 key。
- 抽查多个语言页面，确认页面功能不受语言切换影响。


## 10. 构建与自动验收

### AC-BUILD-001：项目可安装、启动、构建

验收标准：

- 项目依赖可以安装。
- 本地开发服务可以启动。
- 项目可以完成生产构建。
- 构建过程不应出现阻断性 TypeScript、lint、Next.js 或打包错误。

验收方式：

- 执行 install。
- 执行 dev。
- 执行 build。
- 检查命令退出状态。

---

### AC-BUILD-002：测试命令可运行

验收标准：

- 项目应提供可运行的测试命令。
- 测试命令应覆盖由 `test/*.yml` 定义的抽取测试。
- 测试命令应能在本地和 CI 环境中运行。
- 所有抽取测试必须通过。

验收方式：

- 执行测试命令。
- 确认所有 YAML 测试通过。

---

## 11. 技术边界验收

### AC-TECH-001：保持小而精干

验收标准：

- 不进行与 Mermaid → SVG 任务无关的大规模重构。
- 不新增数据库、队列、用户系统、云存储等非必要能力。
- 不为了完成任务另起一个完全独立项目。
- 不引入与核心目标无关的大型依赖。

验收方式：

- 检查新增依赖。
- 检查改动文件。
- 人工 review 实现范围。

---

### AC-TECH-002：核心渲染路径清晰

验收标准：

- Mermaid 输入、类型判断、渲染、SVG 展示、错误处理路径应清晰。
- 不应隐藏在难以 review 的复杂抽象中。
- 不应依赖不可复现的外部服务完成核心转换。

验收方式：

- 人工 review 核心实现文件。
- 检查数据流是否清晰。

---


## 12. AI 辅助开发 Workflow 验收

### AC-WORKFLOW-001：Dev Workflow 文档存在

验收标准：

- 项目必须包含：

  ```text
  docs/dev-workflow.md
  ```

- 文档必须说明：

  - Codex 的任务拆解职责
  - OpenCode 的执行与局部验证职责
  - Orchestrator 的 deterministic 调度职责
  - 自动化执行 loop
  - retry / blocked / manual review 规则
  - final acceptance gate

验收方式：

- 检查 `docs/dev-workflow.md` 是否存在。
- 检查文档是否覆盖上述内容。

---

### AC-WORKFLOW-002：Orchestrator 不直接调用 LLM

验收标准：

- Orchestrator 只能依据机器可读结果做决策。
- Orchestrator 判断依据包括 exit code、测试报告、build 报告、size report、deployment 状态和 acceptance checklist。
- Orchestrator 不应把自然语言判断作为 task pass 的依据。

验收方式：

- Review workflow 文档和 orchestrator 设计。
- 检查 task 状态转换规则。

---

### AC-WORKFLOW-003：人工 Review 节点明确

验收标准：

- Dev workflow 必须明确哪些节点需要人工 review。
- 至少包括：spec / acceptance criteria 确认、测试抽取范围确认、任务 DAG 确认、核心接入点确认、size 对比口径确认、i18n 范围确认和 final diff 确认。
- 单任务执行、普通测试失败修复、局部 retry 不应依赖人工介入。

验收方式：

- 检查 `docs/dev-workflow.md`。
- 检查人工 review 节点是否清晰。

---

## 13. 最终完成定义

项目只有在同时满足以下条件时，才可视为完成：

- `./extract/run.js` 存在且可执行
- 从三个指定仓库抽取出可用 Mermaid 测试
- `test/*.yml` 成功生成
- `test/schema.yml` 或 `workflow/test-schema.yml` 存在，且测试文件先经过 schema 校验
- `extract/report.json` 存在，且记录每个来源仓库的 scanned / candidate / accepted / skipped 统计与跳过原因
- 所有抽取测试可以跑通
- 页面可以输入 Mermaid 并查看 SVG 图
- 页面展示多个类型的 Mermaid 示例图
- 页面风格尽可能复用 `math.webc.site` / `demo` 目录设计
- 页面包含与 `beautiful-mermaid` 的 SVG 柱状对比图
- 对比图使用正确的 JS 体积 / gzip 体积口径，且页面数据与 `workflow/reports/size-report.json` 一致
- 页面支持 `beautiful-mermaid` CSS 主题切换
- 页面支持与 `math.webc.site` 一致的七十多种语言国际化，并提供 `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json`
- 项目可以部署到 Cloudflare Pages
- 部署后的公网页面核心功能可用
- `docs/dev-workflow.md` 存在，并记录 AI 辅助开发 workflow、Codex / OpenCode / Orchestrator 分工、自动循环设计、人工 review 节点和验收 gate
- 实现保持小而精干，没有明显过度工程化

若出现以下情况，应暂停自动推进并进行人工确认：

- 无法判断哪些测试属于“可用测试”
- 抽取测试与当前渲染能力冲突
- Cloudflare Pages 部署要求与实现方案冲突
- 国际化范围难以对齐原项目
- `beautiful-mermaid` 对比口径不清楚
- i18n 语言列表或 fallback 策略无法与原项目对齐
- 需要通过删除测试、绕过测试或扩大架构范围才能继续推进
