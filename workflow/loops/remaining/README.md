# Remaining Workflow Loops

The remaining loops should be executed after `init-loop`, `render-loop`, and `svg-output-loop`.

## Order

```bash
pnpm run agent:web-demo
pnpm run agent:theme
pnpm run agent:size
pnpm run agent:i18n
pnpm run agent:deploy
pnpm run agent:final-audit
```

Each command uses the pinned OpenCode model in `opencode.jsonc`:

```text
zhipuai-coding-plan/glm-5.1
```

`ZHIPU_API_KEY` must be available in the environment.

## Loop Boundaries

- `web-demo-loop`: builds the usable demo page from renderer and SVG output artifacts.
- `theme-loop`: adds Beautiful Mermaid CSS theme switching and source traceability.
- `size-loop`: generates `workflow/reports/size-report.json` and connects the SVG comparison chart to generated data.
- `i18n-loop`: aligns demo copy with the multi-language system and writes i18n coverage reports.
- `deploy-loop`: prepares Cloudflare Pages build/deploy artifacts and deployment evidence.
- `final-audit-loop`: checks final acceptance against canonical specs and reports unresolved gaps.

The shared runner and validator live under `workflow/loops/remaining/lib/`; loop-specific configs live beside each loop entrypoint.
