# Workflow Loop Execution Order

本文档是 Mermaid to SVG 项目工作流 loop 的规范执行顺序。`package.json` 中的
`agent:*` scripts 是可执行入口；本文件记录这些入口之间的依赖关系和暂停点。

## Canonical Order

按下面顺序执行：

| Step | Loop | Command | State file | Main output gate |
|---|---|---|---|---|
| 1 | Init Loop | `pnpm run agent:init` | `workflow/state/init-loop.state.json` | `docs/init-loop-report.md` |
| 2 | Render Loop | `pnpm run agent:render` | `workflow/state/render-loop.state.json` | `workflow/reports/render-capabilities.json` |
| 3 | SVG Output Loop | `pnpm run agent:svg-output` | `workflow/state/svg-output-loop.state.json` | `workflow/reports/svg-output-compatibility.json` |
| 4 | Web Demo Loop | `pnpm run agent:web-demo` | `workflow/state/web-demo-loop.state.json` | `workflow/reports/web-demo-report.json` |
| 5 | Theme Loop | `pnpm run agent:theme` | `workflow/state/theme-loop.state.json` | `workflow/reports/theme-css-report.json` |
| 6 | Size Loop | `pnpm run agent:size` | `workflow/state/size-loop.state.json` | `workflow/reports/size-report.json` |
| 7 | I18N Loop | `pnpm run agent:i18n` | `workflow/state/i18n-loop.state.json` | `workflow/reports/i18n-report.json` |
| 8 | Deploy Loop | `pnpm run agent:deploy` | `workflow/state/deploy-loop.state.json` | `workflow/reports/deployment-report.json` |
| 9 | Final Audit Loop | `pnpm run agent:final-audit` | `workflow/state/final-audit-loop.state.json` | `workflow/reports/final-report.md` |

## Dependency Chain

```text
init
  -> render
  -> svg-output
  -> web-demo
  -> theme
  -> size
  -> i18n
  -> deploy
  -> final-audit
```

## Preconditions

- Run commands from the `mermaid2svg/` project root.
- `ZHIPU_API_KEY` must be available through `.env` or the environment.
- Reference repositories must remain under `references/` inside the project root.
- `opencode.jsonc` must keep `permission.external_directory["*"] = "deny"` for headless loop runs.
- `workflow/human-gate-decisions.md` is the approved Human Gate decision source for all remaining loops.
- Do not skip a loop unless the skipped loop's required output gate already exists and has been reviewed.

## Pause Points

Pause for human review when a loop writes `status: "needs_human"` or `status: "failed"` in its
state file. Inspect, in this order:

1. `workflow/state/<loop>.state.json`
2. `workflow/runs/<loop>/<phase>.failure.json`
3. `workflow/runs/<loop>/<phase>.status.json`
4. `workflow/runs/<loop>/<phase>.messages.json`
5. `workflow/runs/<loop>/<phase>.child.*.messages.json`

Do not resume by deleting state. Fix the cause, then rerun the same `agent:*` command; the loop
runner skips completed phases and continues from the first incomplete phase.

## Existing Supporting References

- `package.json`: executable `agent:*` script names.
- `workflow/human-gate-decisions.md`: approved Human Gate decisions.
- `workflow/loops/remaining/README.md`: short order for the six post-SVG-output loops.
- `docs/init-loop-report.md`: init-loop report and downstream human-gate context.
