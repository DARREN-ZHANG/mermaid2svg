# SVG Output Loop

`svg-output-loop` is the third workflow loop after `render-loop`.

Its job is to make the renderer output stable and embeddable:

```text
Mermaid renderer SVG -> normalized SVG -> compatibility tests -> compatibility report
```

The loop does not implement demo UI, theme switching, size comparison, i18n, or deployment. Those belong to later loops.

## Run

```bash
pnpm run agent:svg-output
```

The command requires `ZHIPU_API_KEY` because OpenCode uses the pinned `zhipuai-coding-plan/glm-5.1` model.

## Required Inputs

- `src/render/mermaid-to-svg.js`
- `test/render-yml.test.mjs`
- `workflow/reports/render-capabilities.json`
- parent canonical docs under `../docs/`

## Required Outputs

- `src/render/normalize-svg.js`
- `test/svg-output.test.mjs`
- `workflow/reports/svg-output-compatibility.json`
- `docs/svg-output/svg-output-plan.md`
- `docs/svg-output/svg-output-validation.md`
- `docs/svg-output-loop-report.md`
