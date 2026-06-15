# Mermaid to SVG 规约

## 1. 项目目标

在现有项目代码基础上，实现一个**轻量、浏览器端、专注于 Mermaid → SVG 转换**的前端工具。

项目开发过程中可以参考并复用 `math.webc.site` 项目的结构、视觉素材、设计风格、国际化机制与部署方式，但本项目的目标并不依赖其原有业务功能。

用户可以在页面中输入 Mermaid 源文本，系统在浏览器端完成渲染，并展示 SVG 图像结果。

项目还需要完成以下配套交付：

- 从指定开源库中抽取可用 Mermaid 测试样例
- 将抽取测试生成到 `test/*.yml`
- 保证所有抽取测试可以跑通
- 页面展示多种 Mermaid 图表示例
- 页面支持 Beautiful Mermaid CSS 样式切换
- 页面展示与 `beautiful-mermaid` 的 JS 体积 / gzip 体积对比 SVG 柱状图，并明确该对比仅作为性能 proxy，不作为运行时 benchmark
- 页面支持与 `math.webc.site` 一致的七十多种语言国际化，并提供 `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json`
- 项目可部署到 Cloudflare Pages

项目原则：

- 小而精干
- 浏览器端转换
- 尽可能复用已有项目结构与素材
- 不做不必要的后端、数据库、队列或复杂基础设施
- 不自研 Mermaid Parser 或 Mermaid layout engine

---

## 2. 项目结构与参考要求

本项目开发过程中可参考以下代码库：

```text
https://github.com/webc-site/math
```

说明：

- 该项目仅作为结构、视觉素材、国际化机制和部署方式的参考来源
- fork 与基础工程准备工作已由人工完成，不属于本规约实现任务的一部分；但最终报告应记录 fork repo URL、upstream repo URL 和 baseline commit，作为原始 fork 要求的交付证据
- 不要求实现或保留原项目业务功能
- Mermaid → SVG 功能应集成到当前项目结构中
- 应优先参考和复用 `demo` 目录下的网站代码
- 应尽可能保持与 `math.webc.site` 一致的视觉风格和交互风格
- 不应为了本任务大规模重构与 Mermaid → SVG 无关的项目结构

---

## 3. 测试抽取要求

项目必须从以下三个开源库中抽取可用 Mermaid 测试样例：

```text
https://github.com/probelabs/maid
https://github.com/lukilabs/beautiful-mermaid
https://github.com/mermaid-js/mermaid
```

如果这三个仓库已经被 clone 到本地 `references/` 目录，则抽取脚本应优先读取本地代码。

### 3.1 抽取脚本位置

抽取脚本必须放置在：

```text
./extract/run.js
```

该脚本负责：

- 扫描指定参考仓库
- 识别 Mermaid 示例、fixtures、文档代码块、测试用例或其他可复用 Mermaid 输入
- 过滤不可用、不稳定、依赖外部上下文或明显不适合当前项目测试的样例
- 生成 YAML 测试文件
- 记录跳过样例的原因

### 3.2 测试文件位置

生成的测试文件必须放置在：

```text
test/*.yml
```

每条测试至少应包含：

- 测试 ID
- 来源仓库
- 来源文件路径
- Mermaid diagram type
- Mermaid 源文本
- 预期行为
- 是否应成功渲染
- 跳过原因，仅用于被过滤或暂不纳入执行的样例

### 3.3 可用测试定义

“可用测试”指满足以下条件的 Mermaid 样例：

- 可以被当前项目的 Mermaid 渲染流程稳定执行
- 不依赖外部图片、远程资源、特殊运行环境或人工上下文
- 不需要服务端 Mermaid 渲染
- 不需要自研 Mermaid Parser
- 不属于明显损坏、不完整或仅作为文档片段存在的输入
- 可以被自动化测试稳定验证

抽取脚本不应为了扩大数量而保留无法稳定运行的样例。

### 3.4 测试必须跑通

所有最终写入 `test/*.yml` 并标记为应执行的测试，都必须能够跑通。

不得通过以下方式制造通过结果：

- 删除失败测试但不记录原因
- 将失败测试无理由标记为 skip
- 修改 Mermaid 输入使其脱离原始样例含义
- 绕过真实渲染流程
- 用静态 SVG 或截图替代 Mermaid 渲染结果


### 3.5 测试抽取报告

抽取脚本必须生成测试抽取报告：

```text
extract/report.json
```

该报告至少应包含：

- 每个来源仓库的扫描文件数量
- 每个来源仓库的候选 Mermaid 样例数量
- 每个来源仓库最终接受的测试数量
- 每个来源仓库跳过的样例数量
- 按 diagram type 聚合的 accepted / skipped 数量
- 跳过原因聚合统计
- 每条被跳过样例的来源路径和跳过原因

若某个来源仓库最终没有 accepted 测试，必须在报告中说明原因，不能静默为 0。

建议报告结构：

```json
{
  "sources": {
    "probelabs/maid": {
      "scannedFiles": 0,
      "candidates": 0,
      "accepted": 0,
      "skipped": 0
    },
    "lukilabs/beautiful-mermaid": {
      "scannedFiles": 0,
      "candidates": 0,
      "accepted": 0,
      "skipped": 0
    },
    "mermaid-js/mermaid": {
      "scannedFiles": 0,
      "candidates": 0,
      "accepted": 0,
      "skipped": 0
    }
  },
  "byDiagramType": {},
  "skipReasons": {}
}
```

### 3.6 YAML 测试 Schema

项目必须固化 YAML 测试 schema：

```text
test/schema.yml
```

或在 workflow 目录中提供等价 schema：

```text
workflow/test-schema.yml
```

每个 `test/*.yml` 文件必须先通过 schema 校验，再进入渲染测试。

推荐 schema 结构：

```yaml
id: string
source:
  repo: string
  path: string
  url: string | null
diagram:
  type: string
  title: string | null
input:
  mermaid: string
expect:
  render: true
  svg:
    root: true
    viewBox: true
    containsText: []
skip:
  enabled: false
  reason: null
```

Schema 的目的不是扩大测试复杂度，而是让抽取脚本、测试 runner 和验收 gate 使用同一份机器可读定义。

---

## 4. Mermaid → SVG 转换要求

Mermaid → SVG 转换能力必须基于 Mermaid 官方浏览器端渲染能力实现。

要求：

- 使用 Mermaid 官方浏览器端渲染能力作为解析与渲染引擎
- 不自研 Mermaid Parser
- 不自研 Mermaid layout engine
- 不使用服务端 Mermaid 转换
- 不接入第三方在线 Mermaid 转换服务
- 不用截图、canvas、静态图片冒充 Mermaid 渲染结果
- 最终展示结果应为 SVG

### 4.1 输入能力

页面必须提供 Mermaid 源文本输入区域。

输入区域应支持：

- 多行 Mermaid 文本
- 编辑 Mermaid 内容
- 清空输入
- 粘贴来自文档或测试样例的 Mermaid 源文本

### 4.2 渲染能力

当用户输入合法 Mermaid 内容时：

- 系统应在浏览器端调用 Mermaid 渲染能力
- 将 Mermaid 源文本转换为 SVG
- 在页面中展示 SVG 图像
- 输入变化后，图像结果应随之更新

### 4.3 错误处理

当输入为空时：

- 不执行渲染
- 不输出 SVG
- 页面不崩溃
- 显示空状态提示

当输入为非法 Mermaid 语法时：

- 页面不崩溃
- 不输出错误 SVG
- 显示可见错误提示
- 用户修改为合法输入后可以恢复渲染

当输入暂时无法渲染或当前版本无法支持时：

- 不应导致页面崩溃
- 应显示清晰提示
- 不应伪造成功结果

---

## 5. 支持范围策略

当前项目不通过手写完整 Mermaid Parser 来定义支持范围。

支持范围应由以下两部分共同决定：

1. Mermaid 官方浏览器端渲染能力
2. 从指定参考仓库抽取并跑通的可用测试集

因此，本项目不应在实现中设置过窄的人工 diagram type allowlist，除非该 allowlist 是为了明确过滤已知不可稳定运行或当前版本暂不支持的类型，并且原因被记录。

页面示例应优先展示来自可用测试集或高度相似的 Mermaid 类型。

推荐优先展示的图表类型包括但不限于：

- `flowchart` / `graph`
- `sequenceDiagram`
- `classDiagram`
- `stateDiagram-v2`
- `erDiagram`
- `pie`

最终展示哪些类型，应结合抽取测试结果和实际可跑通情况确定。

---

## 6. 页面功能要求

页面必须支持以下核心功能：

### 6.1 输入 Mermaid 并查看生成图

页面应包含：

- Mermaid 输入区
- SVG 预览区
- 错误提示区或状态提示区

用户应能够完成以下流程：

```text
输入 Mermaid 源文本 → 浏览器端渲染 → 查看 SVG 图像
```

### 6.2 展示不同类型 Mermaid 图片

页面必须展示多个不同类型的 Mermaid 示例图。

要求：

- 示例图应体现不同 diagram type
- 示例图应通过 Mermaid → SVG 渲染流程生成
- 不应使用静态截图替代
- 示例应短小、稳定、可读
- 示例应优先来自抽取测试集或与抽取测试集高度一致

### 6.3 页面不是临时调试工具

页面应具备可提交 demo 的完成度：

- 有清晰标题
- 有简洁说明
- 有输入区域
- 有预览区域
- 有示例区域
- 有主题切换控件
- 有体积 / 性能对比图
- 有多语言支持
- 页面布局清楚，不应表现为临时开发调试页面

---

## 7. 设计风格要求

页面应尽可能复用 `math.webc.site` 的设计风格。

主要参考来源：

```text
项目 GitHub 代码库中的 demo 目录
```

要求：

- 尽可能复用原项目已有布局、样式、组件和设计语言
- 页面整体视觉风格应与 `math.webc.site` 保持一致
- 按钮、卡片、间距、字体、色彩、响应式布局应尽量贴近原站
- 不应另起一个完全不同视觉风格的独立 demo 页面

---

## 8. Beautiful Mermaid CSS 主题切换要求

页面必须支持使用 `beautiful-mermaid` 的 CSS 切换 Mermaid 图样式。

要求：

- 页面提供明显的主题切换按钮或控件
- 用户可以主动切换 Mermaid 图样式
- 主题切换应影响 Mermaid SVG 的视觉样式
- 主题切换后图仍应正常显示
- 主题切换失败时应保持页面稳定
- 不应因主题切换导致 Mermaid 渲染流程失效

主题切换能力应尽可能复用或参考 `beautiful-mermaid` 的 CSS 样式机制。


### 8.1 CSS 来源与版本固定

`beautiful-mermaid` CSS 主题来源必须可追溯。

要求：

- 记录 CSS 来源 URL、包名或仓库路径
- 记录使用的版本、commit 或 CDN URL
- 若运行时依赖 CDN，应提供本地 fallback 或说明不可用时的降级行为
- 默认主题不应依赖外部 CDN 才能显示
- 主题切换只影响 Mermaid SVG 的视觉样式，不应改变核心渲染流程

---

## 9. 体积与性能对比图要求

页面必须包含一个 SVG 柱状图，用于展示本项目与 `beautiful-mermaid` 的尺寸和性能对比。

### 9.1 图表形式

要求：

- 对比图必须是 SVG
- 必须是柱状图
- 不使用 PNG、JPEG 或 canvas 替代
- 图表应有标题、图例、单位和说明

### 9.2 对比对象

对比范围限定为：

1. `beautiful-mermaid` 在 CDN 上的 JS 文件大小
2. 本项目代码在打包、gzip 压缩后的大小

不得将以下内容混入主要对比口径：

- 未 gzip 的源码体积
- 整个网站所有资源体积
- unrelated vendor chunk
- 图片、字体、无关 CSS 等非目标内容
- 没有说明来源的估算值

### 9.3 性能表述边界

本项目中的“性能对比”仅以 JS 文件体积和 gzip 后 JS 体积作为 proxy。当前版本不设置运行时性能 benchmark gate。

要求：

- 页面应说明对比口径
- 不应声称做了运行时性能 benchmark；若未来确实加入 runtime benchmark，必须另起独立 spec 和验收项，不影响当前版本验收
- 不应夸大对比结论
- 图表说明应清楚区分“文件体积”与“运行时性能”


### 9.4 Size Report

体积对比数据必须由脚本生成，并写入：

```text
workflow/reports/size-report.json
```

报告至少包含：

```json
{
  "beautifulMermaid": {
    "url": "",
    "version": "",
    "rawBytes": 0,
    "gzipBytes": 0
  },
  "ours": {
    "entry": "",
    "rawBytes": 0,
    "gzipBytes": 0
  }
}
```

要求：

- `beautiful-mermaid` 的 CDN JS URL 必须固定并记录版本
- 本项目对比对象必须指向实际 build 输出中的目标 JS 产物
- 页面 SVG 柱状图展示的数据必须与该 report 一致
- 不允许手写或估算数据替代脚本生成结果

---

## 10. 国际化要求

页面必须支持与 `math.webc.site` 一样的七十多种语言国际化能力。

要求：

- 复用或对齐原项目已有国际化机制
- 新增页面文案必须进入国际化系统
- 不应只支持英文或中文
- 不应在页面中大量硬编码不可翻译文案
- 语言列表应与原项目保持一致或尽可能一致
- 多语言页面应保持核心功能可用

新增文案至少包括：

- 页面标题
- 页面说明
- Mermaid 输入区标签
- SVG 预览区标签
- 示例区域标题
- 错误提示
- 空状态提示
- 暂不可渲染提示
- 主题切换按钮
- 对比图标题
- 对比图图例
- 对比图单位说明
- 操作说明


### 10.1 语言列表与翻译 Key 报告

项目必须生成或维护国际化覆盖报告：

```text
docs/i18n-language-map.md
```

或等价机器可读报告：

```text
workflow/reports/i18n-report.json
```

报告至少包含：

- 从原项目读取或对齐的语言列表
- Mermaid 页面新增 translation keys
- 每个 locale 是否存在对应 key
- fallback 策略
- 抽查语言的页面访问路径或验证方式

验收口径：

- 语言列表应与原项目一致或尽可能一致
- 新增 Mermaid 页面文案必须在所有 locale 中存在 key
- 翻译内容可以优先使用 fallback，但不能缺少 key
- 不允许在页面中大量硬编码不可翻译文案

---

## 11. Cloudflare Pages 部署要求

项目必须能够部署到 Cloudflare Pages。

要求：

- Cloudflare Pages 能够完成项目构建
- 构建命令清晰
- 输出目录清晰
- 不依赖 Cloudflare Pages 不支持的服务端运行能力
- 部署后页面可通过公网 URL 访问
- 部署版本具备本地版本的核心功能

部署后的页面必须支持：

- Mermaid 输入
- SVG 预览
- 多类型 Mermaid 示例展示
- Beautiful Mermaid CSS 主题切换
- SVG 柱状对比图
- 国际化能力

---

## 12. 技术边界

必须遵守以下技术边界：

- 使用 Mermaid 官方浏览器端渲染能力
- 不自研 Mermaid Parser
- 不自研 Mermaid layout engine
- 不使用服务端 Mermaid 转换
- 不接入第三方在线 Mermaid 转换服务
- 不新增与核心目标无关的后端 API
- 不引入数据库
- 不引入队列系统
- 不引入云存储
- 不引入用户账户系统
- 不引入多用户协作能力
- 不进行与 Mermaid → SVG 无关的大规模重构
- 不引入与核心目标无关的大型依赖
- 优先复用现有项目结构
- 优先复用现有 UI 与页面布局
- 保持代码路径清晰
- 保持实现最小化

允许的轻量逻辑包括：

- Mermaid diagram type 轻量检测
- 错误状态分类
- 测试抽取与过滤
- YAML 测试数据生成
- gzip 体积统计
- SVG 柱状图生成或渲染
- 主题状态切换
- 国际化文案接入

---

## 13. 测试与自动验收要求

项目应提供可运行的测试流程，用于验证 `test/*.yml` 中的抽取测试。

要求：

- 测试命令应能被本地执行
- 测试命令应能被 CI 或自动化流程调用
- 所有最终纳入执行的 YAML 测试必须通过
- 测试应验证 Mermaid 输入可以被当前渲染流程处理
- 测试不应绕过真实核心渲染逻辑
- 测试失败时应暴露真实错误

自动验收至少应覆盖：

- 抽取脚本可执行
- `test/*.yml` 可生成
- YAML 文件可解析
- 所有执行测试可通过
- 页面可构建
- 页面核心功能可运行
- Cloudflare Pages 部署配置合理

---

## 14. 非目标范围

以下内容不属于当前版本目标：

- SVG 下载
- SVG 文件保存
- 渲染历史记录
- 用户登录
- 云端保存
- 多用户协作
- Mermaid 自动补全
- Mermaid 智能修复
- AI 生成 Mermaid
- 运行时性能 benchmark，除非后续明确加入
- 自研 Mermaid 语法解析器
- 自研 Mermaid layout engine
- 服务端 Mermaid 渲染服务

说明：

- SVG 下载可以作为后续阶段任务记录。
- 当前版本重点是测试抽取、浏览器端渲染、页面展示、主题切换、对比图、国际化和 Cloudflare Pages 部署。

---

## 15. AI 辅助开发要求

本项目应记录 AI 辅助开发过程。

要求：

- 说明使用 AI 辅助开发的方式
- 说明 Codex、opencode、orchestrator 或其他 agent 的职责边界
- 说明哪些决策由 human in the loop 完成
- 说明 agent 不应绕过本规约与验收标准
- 不要求公开完整 prompt 或全部执行日志，但应能解释整体 workflow

建议记录在：

```text
docs/dev-workflow.md
```

---

## 16. 最终交付物

项目完成时，应至少包含以下交付物：

```text
extract/run.js
extract/report.json
test/*.yml
test/schema.yml 或 workflow/test-schema.yml
docs/mermaid-svg-spec.md
docs/acceptance-criteria.md
docs/dev-workflow.md
docs/i18n-language-map.md 或 workflow/reports/i18n-report.json
workflow/reports/size-report.json
README.md
Cloudflare Pages 部署配置或说明
```

页面交付应包含：

- Mermaid 输入区
- SVG 预览区
- 多类型 Mermaid 示例展示
- Beautiful Mermaid CSS 主题切换按钮
- 与 `beautiful-mermaid` 的 SVG 柱状对比图
- 国际化文案支持
- 与 `math.webc.site` 风格一致的页面设计

---

## 17. 完成定义

当前版本满足以下条件时，可视为完成：

- `extract/run.js` 存在且可执行
- 从三个指定仓库抽取出可用 Mermaid 测试
- `test/*.yml` 成功生成
- `test/schema.yml` 或 `workflow/test-schema.yml` 存在，且测试文件先经过 schema 校验
- `extract/report.json` 存在，且记录每个来源仓库的 scanned / candidate / accepted / skipped 统计与跳过原因
- 所有最终纳入执行的抽取测试可以跑通
- 页面可以输入 Mermaid 并查看 SVG 图
- 页面可以展示多个类型的 Mermaid 示例图
- 页面风格尽可能复用 `math.webc.site` / `demo` 目录设计
- 页面包含与 `beautiful-mermaid` 的 SVG 柱状对比图
- 对比图使用正确的 JS 体积 / gzip 体积口径，且页面数据与 `workflow/reports/size-report.json` 一致
- 页面支持 `beautiful-mermaid` CSS 主题切换
- 页面支持与 `math.webc.site` 一致的七十多种语言国际化，并提供 `docs/i18n-language-map.md` 或 `workflow/reports/i18n-report.json`
- 项目可以部署到 Cloudflare Pages
- 部署后的页面核心功能可用
- 项目包含 `docs/dev-workflow.md`，记录 AI 辅助开发流程、Codex / OpenCode / Orchestrator 分工、自动循环设计、人工 review 节点和验收 gate
- 实现保持小而精干，没有明显过度工程化

如出现以下情况，应暂停自动推进并进行人工确认：

- 无法判断哪些抽取测试属于可用测试
- 抽取测试与当前渲染能力冲突
- Cloudflare Pages 部署要求与实现方案冲突
- 国际化范围难以对齐原项目
- `beautiful-mermaid` 对比口径不清楚
- 需要通过删除测试、绕过测试或扩大架构范围才能继续推进
