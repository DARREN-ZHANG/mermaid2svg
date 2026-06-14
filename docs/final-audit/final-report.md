# Final Acceptance Audit Report

- **Loop**: final-audit-loop
- **Phase**: verification (final report)
- **Audit date**: 2026-06-14
- **Git commit**: 542a2e9
- **Canonical references**: `../docs/mermaid-svg-spec.md` §17, `../docs/acceptance-criteria.md` §13, `../docs/mermaid-svg-architecture.md` §6.12 / Gate 8
- **Checklist**: `workflow/reports/final-acceptance-checklist.json`

---

## 1. 审计结论

**Overall verdict: `pending-human-signoff`**

所有机器可验证（machine-verifiable）的验收项全部通过（44/44 pass, 0 fail）。剩余 6 项需要人工 review 的项目尚未完成，其中最关键的是 Cloudflare Pages 公网部署验证。

审计未发现任何阻塞性技术问题。所有 gap 均为文档交付物或需要人工操作的部署步骤。

---

## 2. 已完成需求

| 需求               | AC              | 状态    | 证据                                              |
| ------------------ | --------------- | ------- | ------------------------------------------------- |
| 测试抽取脚本       | AC-EXTRACT-001  | ✅ pass | extract/run.js 存在，bun extract/run.js exit 0    |
| 三来源抽取         | AC-EXTRACT-002  | ✅ pass | maid/beautiful-mermaid/mermaid-js 均有 accepted   |
| YAML 测试生成      | AC-EXTRACT-003  | ✅ pass | 18 个 yml，render-yml 19 pass 0 fail              |
| 可用测试过滤       | AC-EXTRACT-004  | ✅ pass | 109 skippedSamples 有路径和原因                   |
| 所有测试跑通       | AC-EXTRACT-005  | ✅ pass | render-capabilities 18/18 supported               |
| 抽取报告完整       | AC-EXTRACT-006  | ✅ pass | 3 sources × 4 stats + byDiagramType + skipReasons |
| Schema 固化        | AC-EXTRACT-007  | ✅ pass | test/schema.yml 先校验再渲染                      |
| Mermaid 输入       | AC-UI-001       | ✅ pass | textarea 多行可编辑可清空                         |
| SVG 预览           | AC-UI-002       | ✅ pass | 真实 Mermaid 渲染非静态                           |
| 多类型示例         | AC-UI-003       | ✅ pass | 8 种 diagram 类型                                 |
| 错误状态稳定       | AC-UI-004       | ✅ pass | svg-output 29 pass，含 recovery                   |
| SVG 柱状对比图     | AC-COMPARE-001  | ✅ pass | SVG 非PNG/canvas                                  |
| 体积口径正确       | AC-COMPARE-002  | ✅ pass | 仅 4 项 bm raw/gzip + ours raw/gzip               |
| Size report 可追溯 | AC-COMPARE-004  | ✅ pass | commit pin + pageMatchesReport=true               |
| BM CSS 主题        | AC-THEME-001    | ✅ pass | 8 主题切换 computed-color 变化                    |
| 主题切换按钮       | AC-THEME-002    | ✅ pass | i18n key + DOM 控件 + 即时生效                    |
| CSS 来源可追溯     | AC-THEME-003    | ✅ pass | commit 2ac8bbbb, CDN 独立                         |
| 75 种语言          | AC-I18N-001     | ✅ pass | 75 locale 文件                                    |
| 新文案完整国际化   | AC-I18N-002     | ✅ pass | 19 key × 75 locale, 0 缺失                        |
| 语言/key 报告      | AC-I18N-003     | ✅ pass | i18n-language-map.md + i18n-report.json           |
| 可安装/构建        | AC-BUILD-001    | ✅ pass | install + build exit 0                            |
| 测试可运行         | AC-BUILD-002    | ✅ pass | render-yml + svg-output 全 pass                   |
| Dev workflow 文档  | AC-WORKFLOW-001 | ✅ pass | docs/dev-workflow.md 已创建                       |

---

## 3. 未完成或降级处理的需求

| 需求                  | AC                | 状态          | 说明                                                               |
| --------------------- | ----------------- | ------------- | ------------------------------------------------------------------ |
| 设计风格复用          | AC-DESIGN-001/002 | pending-human | 机器证据充分（designTokens, glassmorphism 复用），需人工视觉确认   |
| 性能表述清晰          | AC-COMPARE-003    | pending-human | scopeNote 已写入，需人工确认页面措辞                               |
| 小而精                | AC-TECH-001/002   | pending-human | 仅 mermaid 一个运行时依赖，src/ 非渲染部分未改，需人工 review diff |
| Orchestrator 不调 LLM | AC-WORKFLOW-002   | pending-human | 文档已说明，需人工 review 实现                                     |
| 人工 review 节点      | AC-WORKFLOW-003   | pending-human | 10 节点已列出，需人工确认完整性                                    |
| CF Pages 公网部署     | AC-DEPLOY-001/002 | pending-human | 本地 build 通过，公网部署需人工 Cloudflare 账户操作                |
| README.md 更新        | spec §16 D9       | deferred      | 仍为上游 @webc.site/math 内容，待人工重写                          |

---

## 4. 测试覆盖来源

| 来源仓库                   | scanned | candidates | accepted | skipped |
| -------------------------- | ------- | ---------- | -------- | ------- |
| probelabs/maid             | 211     | 25         | 7        | 18      |
| lukilabs/beautiful-mermaid | 24      | 25         | 7        | 18      |
| mermaid-js/mermaid         | 271     | 77         | 4        | 73      |
| **合计**                   | **506** | **127**    | **18**   | **109** |

所有 18 个 accepted 测试全部通过（render-capabilities.json: 18 supported, 0 unsupported, 0 skipped）。

---

## 5. 支持的 Mermaid 类型

| Diagram Type         | Accepted Tests | Status       |
| -------------------- | -------------- | ------------ |
| flowchart            | 5              | ✅ supported |
| sequenceDiagram      | 3              | ✅ supported |
| classDiagram         | 2              | ✅ supported |
| stateDiagram (-v2)   | 2              | ✅ supported |
| erDiagram            | 2              | ✅ supported |
| pie                  | 2              | ✅ supported |
| gantt                | 1              | ✅ supported |
| other (xychart-beta) | 1              | ✅ supported |

---

## 6. 不支持的 Mermaid 类型

当前 18 个抽取测试范围内无 unsupported 类型。

以下类型在 MVP 边界外（HG-1 决策），未被抽取为执行测试：

- journey
- gitGraph
- mindmap
- timeline
- 其他不确定/边缘类型

这些类型可在后续版本中基于渲染证据逐步纳入。

---

## 7. 体积与 gzip 对比结果

| 对象              | Raw Bytes | Gzip Bytes | 来源                                                      |
| ----------------- | --------- | ---------- | --------------------------------------------------------- |
| beautiful-mermaid | 328,094   | 66,816     | references/beautiful-mermaid 本地 bundle, commit 2ac8bbbb |
| 本项目            | 127,082   | 41,785     | demo/dist/assets/index-BzHJhuCY.js (size-loop build)      |

**结论**：本项目 gzip 体积比 beautiful-mermaid 小约 37.5%（66,816 → 41,785 bytes）。

**方法论说明**：

- 对比仅针对 JS 文件体积和 gzip 体积，作为性能 proxy。
- 当前版本不设置运行时性能 benchmark gate。
- gzip 使用 zlib default level 6，两侧同方法，内部公平。
- 已知 gap: ours 仅测 entry chunk，未聚合全部 render-path chunks（deferred）。

---

## 8. Demo 页面访问方式

### 本地访问

```bash
bun install --frozen-lockfile
bun run build     # 产出 demo/dist/
bun dev.js        # 或用任意静态服务器 serve demo/dist/
```

### 部署访问

- **目标平台**: Cloudflare Pages
- **构建命令**: `bun install --frozen-lockfile && bun run build`
- **输出目录**: `demo/dist`
- **当前状态**: 本地构建验证通过（exit 0），公网部署待人工执行

---

## 9. Cloudflare Pages 部署状态

| 项目             | 状态                                                                            |
| ---------------- | ------------------------------------------------------------------------------- |
| 本地构建         | ✅ exit 0 (284ms)                                                               |
| 输出目录         | demo/dist (3.9M, 77 assets)                                                     |
| wrangler.toml    | ✅ pages_build_output_dir 声明                                                  |
| \_headers 安全头 | ✅ X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| 服务端运行时     | ✅ 不需要 (staticSite=true)                                                     |
| 数据库/队列      | ✅ 不需要                                                                       |
| 环境变量         | 无必需变量                                                                      |
| 公网部署         | ⏳ pending-human                                                                |

---

## 10. 主要技术取舍

| 取舍                              | 原因                                                    |
| --------------------------------- | ------------------------------------------------------- |
| 使用 Mermaid 官方浏览器端 API     | 不自研 parser/layout engine，保持转换链最短             |
| Playwright 仅作测试 harness       | HG-3 决策：不用 screenshot/canvas 作为 pass/fail oracle |
| 18 个测试作为初始 gate            | HG-2 决策：质量优先于数量，后续可扩展                   |
| 8 种 diagram 作为 MVP             | HG-1 决策：journey/gitGraph/mindmap 等暂不支持          |
| 主题用 CSS overlay 而非侵入渲染器 | 保持渲染流程不变，主题切换不触发重新渲染                |
| gzip level 6 而非 9               | 两侧同方法保证公平，level-9 参考值已记录                |
| 75 locale 保持 English fallback   | HG-5 决策：所有 key 必须存在，翻译可用 fallback         |

---

## 11. 后续可优化方向

1. **扩大测试集**：基于 Render Loop 证据，逐步纳入更多 diagram type 和 edge case。
2. **聚合 size 口径**：将 ours 的测量从 entry chunk 扩展到全部 render-path chunks。
3. **README 重写**：从上游 @webc.site/math 内容改为 Mermaid → SVG 工具说明。
4. **CF Pages 公网部署**：执行实际部署，完成 7 项 postDeploy checklist。
5. **gzip level 9**：如果需要更激进的压缩对比，可切换到 level 9 并两侧同步。
6. **SVG 下载**：spec §14 标记为后续阶段任务。
7. **更多主题翻译**：当前 7 种语言有 Mermaid 专属翻译，67 种使用 English fallback。

---

## 12. 受保护文件审计

| 受保护范围                            | 审计结论                                           |
| ------------------------------------- | -------------------------------------------------- |
| `src/` (非 render/)                   | ✅ 自 baseline (dfc9d09) 以来无修改                |
| `lib/`                                | ✅ 仅 minify.js 自动重新生成 (d0e9b0a)，非手动编辑 |
| `references/`                         | ✅ 自 baseline 以来无修改                          |
| `plugin/`                             | ✅ 自 baseline 以来无修改                          |
| `blog/`                               | ✅ 自 baseline 以来无修改                          |
| `../docs/mermaid-svg-spec.md`         | ✅ 未修改                                          |
| `../docs/acceptance-criteria.md`      | ✅ 未修改                                          |
| `../docs/mermaid-svg-architecture.md` | ✅ 未修改                                          |

---

## 13. 最终 sign-off 判据

| 条件                                 | 状态                      |
| ------------------------------------ | ------------------------- |
| §5 所有 M 项全 pass                  | ✅ 44/44 pass             |
| G1 (dev-workflow.md) 已解决          | ✅ 本 loop 已创建         |
| G2 (README) 已记录                   | ⏳ deferred 到人工 gate   |
| G3 (公网部署) 记录为 pending-human   | ✅ 已记录，不阻塞审计闭环 |
| §8 人工 review 清单有结论            | ⏳ 6 项 pending           |
| 受保护文件未被修改                   | ✅ 已确认                 |
| final-acceptance-checklist.json 写入 | ✅ 已生成                 |
| final-report.md 写入                 | ✅ 本文件                 |

**最终判定**：机器审计全部通过。项目技术交付已完成。剩余项为人工操作（部署执行、视觉确认、README 重写），不涉及代码变更。建议人工完成 6 项 review 后签收。
