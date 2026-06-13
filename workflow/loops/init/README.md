# Init Loop

This loop initializes the Mermaid to SVG project from the current `math.webc.site` fork.

## Purpose

The init loop does two bounded jobs:

- clean the repository by removing math-specific implementation while preserving project structure, frontend design assets, i18n scaffolding, and deployment shape
- create the repeatable Mermaid test extraction path required by the spec: `extract/run.js`, `extract/report.json`, `test/schema.yml`, and `test/*.yml`

It does not implement the Mermaid renderer, demo, theme switcher, size report, i18n migration, or deployment. Those belong in later workflow loops.

## Layout

```txt
workflow/
  loops/
    init/
      init-loop.ts
      init-loop.config.ts
      lib/
      prompts/
      README.md
  state/
    init-loop.state.json
  runs/
    init/
```

The loop reads canonical planning documents from the parent workspace:

```txt
../docs/mermaid-svg-spec.md
../docs/acceptance-criteria.md
../docs/mermaid-svg-architecture.md
```

It reads reference repositories from:

```txt
references/maid
references/beautiful-mermaid
references/mermaid
```

Preflight fails if those references are missing. It does not clone or mutate them.

## Run

```bash
npm run agent:init
```

Optional OpenCode model override:

```bash
OPENCODE_MODEL_PROVIDER=openai OPENCODE_MODEL_ID=gpt-5.1-codex npm run agent:init
```

## Human Gates

The loop stops if it detects risky actions such as canonical doc mutation, reference mutation, protected asset deletion, forbidden runtime dependency additions, dangerous deploy/publish/push commands, or excessive deletion.
