# Render Loop

`render-loop` is the second workflow loop after `init-loop`.

Its job is to let OpenCode implement and validate the first real Mermaid source to SVG closure:

```text
test/*.yml -> official Mermaid browser render API -> SVG string -> structural assertions
```

The loop does not implement UI, theme switching, size reports, i18n, or deployment. Those belong to later loops.

## Run

```bash
pnpm run agent:render
```

The command requires `ZHIPU_API_KEY` because OpenCode uses the pinned `zhipuai-coding-plan/glm-5.1` model.

## Required Inputs

- `test/schema.yml`
- `test/*.yml`
- `extract/report.json`
- parent canonical docs under `../docs/`

## Required Outputs

- `src/render/mermaid-to-svg.js`
- `test/render-yml.test.mjs`
- `workflow/reports/render-capabilities.json`
- `docs/render/render-validation.md`
- `docs/render-loop-report.md`
