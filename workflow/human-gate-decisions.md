# Human Gate Decisions

本文档记录已确认的 Human Gate 决策。后续 loop 应按这些决策连续执行，不再因同一问题暂停等待人工确认。

## Status

All seven init-loop Human Gates are approved with the decisions below.

## HG-1: MVP Diagram Boundary

Accepted MVP scope:

- `flowchart`
- `sequenceDiagram`
- `classDiagram`
- `stateDiagram-v2`
- `erDiagram`
- `pie`
- `gantt`
- `xychart-beta`

`journey`, `gitGraph`, `mindmap`, `timeline`, and other uncertain or edge diagram types are out of MVP. They may be promoted later only with render-loop evidence.

## HG-2: Initial Test Quota

The current 18 generated YAML tests are accepted as the initial gate.

Render Loop may expand the suite after it has evidence from the real renderer, but expansion must be based on measured stability rather than quota pressure.

## HG-3: Browser Test Harness

Playwright is allowed as a real-browser test harness.

Allowed:

- Add Playwright as a dev/test dependency if needed.
- Run tests in a real browser context.
- Call the project Mermaid-to-SVG wrapper from the page context.
- Assert on returned SVG strings and SVG DOM structure.
- Store screenshots only as failure diagnostics or manual UI review artifacts.

Required primary assertions:

- SVG string/DOM contains an `<svg>` root.
- SVG has a usable `viewBox`.
- Output is deterministic for equivalent input.
- Error results are explicit and structured.
- Unsafe runtime JavaScript is absent or removed by the SVG output layer.

Forbidden:

- Do not use Playwright or Puppeteer as the renderer implementation.
- Do not use screenshots, image snapshots, canvas, pixel data, or `toDataURL` as the main pass/fail oracle.
- Do not generate conversion output from screenshots or canvas.
- Do not use `@mermaid-js/mermaid-cli`.
- Do not use server rendering or online conversion services.

`happy-dom` or `linkedom` may be used only for lightweight unit tests. They are not the final render gate.

## HG-4: beautiful-mermaid Comparison Scope

Use the local `references/beautiful-mermaid` repository as the traceable source. Pin the exact commit or local revision in generated reports.

Theme and size loops should record:

- source path or URL
- commit or package version
- raw byte count
- gzip byte count
- local fallback behavior when runtime CDN is unavailable

Default theme behavior must not require an external CDN.

## HG-5: I18N Scope

Keep the existing 75-locale structure.

All Mermaid demo keys must exist in every locale file. English fallback text is acceptable for languages without translated Mermaid-specific copy, but missing keys are not acceptable.

## HG-6: Cloudflare Pages Deployment

Deploy Loop may create or update Cloudflare Pages configuration.

Deployment reports must record:

- build command
- output directory
- required environment variables
- whether redirects or SPA fallback are needed
- local build result

Do not add server runtime, database, queue, or unsupported Cloudflare Pages dependencies.

## HG-7: extract/run.js Expansion

Do not rewrite the extraction system before Render Loop.

Keep the current 18 accepted tests as the baseline. `skippedSamples` may remain source-path-and-reason focused for the initial run. Source URLs and expanded skipped sample metadata may be added after render evidence exists.

## Cleanup Deferrals

The following cleanup decisions are deferred until after Final Audit:

- `.env`
- `.opencode/` and `opencode.jsonc`
- `workflow/loops/init/`
- `conf`
- `docs/superpowers/plans/`
- `workflow/hooks/pre-commit.test.mjs`
- package dependency cleanup

Do not let these deferred cleanup items block the remaining loop sequence.
