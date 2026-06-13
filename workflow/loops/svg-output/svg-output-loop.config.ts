import type { PhaseDefinition } from "../init/lib/types.ts";

export const SVG_OUTPUT_LOOP_CONFIG = {
  loopName: "svg-output-loop",
  stateFile: "workflow/state/svg-output-loop.state.json",
  logDir: "workflow/runs/svg-output",
  reportDir: "workflow/reports",
  docsDir: "docs/svg-output",
  maxPhaseAttempts: 2,
  canonicalDocs: [
    "../docs/mermaid-svg-spec.md",
    "../docs/acceptance-criteria.md",
    "../docs/mermaid-svg-architecture.md",
  ],
  canonicalDocFallbacks: [
    "../../../docs/mermaid-svg-spec.md",
    "../../../docs/acceptance-criteria.md",
    "../../../docs/mermaid-svg-architecture.md",
  ],
  renderInputs: [
    "src/render/mermaid-to-svg.js",
    "test/render-yml.test.mjs",
    "workflow/reports/render-capabilities.json",
  ],
  svgOutputArtifacts: [
    "src/render/normalize-svg.js",
    "test/svg-output.test.mjs",
    "workflow/reports/svg-output-compatibility.json",
  ],
  requiredFinalArtifacts: [
    "src/render/mermaid-to-svg.js",
    "src/render/normalize-svg.js",
    "test/render-yml.test.mjs",
    "test/svg-output.test.mjs",
    "workflow/reports/render-capabilities.json",
    "workflow/reports/svg-output-compatibility.json",
    "docs/svg-output/svg-output-plan.md",
    "docs/svg-output/svg-output-validation.md",
    "docs/svg-output-loop-report.md",
  ],
  // Rejected inside runtime SVG output source only. Playwright is allowed as a test
  // harness by workflow/human-gate-decisions.md.
  blockedSvgOutputPatterns: [
    "puppeteer",
    "playwright",
    "@mermaid-js/mermaid-cli",
    "screenshot",
    "canvas",
    "html2canvas",
    "toDataURL",
    "remote mermaid service",
  ],
} as const;

export const SVG_OUTPUT_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description:
      "Verify render-loop artifacts and canonical docs exist before SVG output compatibility work starts.",
    maxAttempts: 1,
    promptFile: "workflow/loops/svg-output/prompts/01-preflight.md",
    requiredArtifacts: [],
  },
  {
    id: "compatibility-plan",
    kind: "opencode",
    description:
      "Plan the SVG output compatibility contract without changing UI, theme, size, i18n, or deployment code.",
    maxAttempts: 2,
    promptFile: "workflow/loops/svg-output/prompts/02-compatibility-plan.md",
    requiredArtifacts: ["docs/svg-output/svg-output-plan.md"],
  },
  {
    id: "normalizer-implementation",
    kind: "opencode",
    description:
      "Implement general SVG output normalization and a stable result contract around the renderer output.",
    maxAttempts: 2,
    promptFile: "workflow/loops/svg-output/prompts/03-normalizer-implementation.md",
    requiredArtifacts: ["src/render/normalize-svg.js"],
  },
  {
    id: "compatibility-tests",
    kind: "opencode",
    description:
      "Add SVG output compatibility tests for structure, stability, unsafe content removal, and error result shape.",
    maxAttempts: 2,
    promptFile: "workflow/loops/svg-output/prompts/04-compatibility-tests.md",
    requiredArtifacts: [
      "test/svg-output.test.mjs",
      "workflow/reports/svg-output-compatibility.json",
    ],
  },
  {
    id: "validation",
    kind: "opencode",
    description:
      "Run render and SVG output tests, then record machine-readable compatibility results.",
    maxAttempts: 2,
    promptFile: "workflow/loops/svg-output/prompts/05-validation.md",
    requiredArtifacts: [
      "docs/svg-output/svg-output-validation.md",
      "workflow/reports/svg-output-compatibility.json",
    ],
  },
  {
    id: "final-report",
    kind: "opencode",
    description:
      "Write the final SVG output loop report from deterministic artifacts and verification output.",
    maxAttempts: 2,
    promptFile: "workflow/loops/svg-output/prompts/06-final-report.md",
    requiredArtifacts: ["docs/svg-output-loop-report.md"],
  },
];
