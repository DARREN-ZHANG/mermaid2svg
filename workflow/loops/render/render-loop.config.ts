import type { PhaseDefinition } from "../init/lib/types.ts";

export const RENDER_LOOP_CONFIG = {
  loopName: "render-loop",
  stateFile: "workflow/state/render-loop.state.json",
  logDir: "workflow/runs/render",
  reportDir: "workflow/reports",
  docsDir: "docs/render",
  maxPhaseAttempts: 2,
  canonicalDocs: [
    "../docs/mermaid-svg-spec.md",
    "../docs/acceptance-criteria.md",
    "../docs/mermaid-svg-architecture.md"
  ],
  canonicalDocFallbacks: [
    "../../../docs/mermaid-svg-spec.md",
    "../../../docs/acceptance-criteria.md",
    "../../../docs/mermaid-svg-architecture.md"
  ],
  extractionInputs: [
    "test/schema.yml",
    "test/*.yml",
    "extract/report.json"
  ],
  rendererArtifacts: [
    "src/render/mermaid-to-svg.js",
    "test/render-yml.test.mjs",
    "workflow/reports/render-capabilities.json"
  ],
  requiredFinalArtifacts: [
    "src/render/mermaid-to-svg.js",
    "test/render-yml.test.mjs",
    "workflow/reports/render-capabilities.json",
    "docs/render/render-validation.md",
    "docs/render-loop-report.md"
  ],
  // Rejected inside runtime renderer source only. Playwright is allowed as a test harness
  // by workflow/human-gate-decisions.md.
  blockedRenderPatterns: [
    "puppeteer",
    "playwright",
    "@mermaid-js/mermaid-cli",
    "screenshot",
    "canvas",
    "html2canvas",
    "toDataURL",
    "remote mermaid service"
  ]
} as const;

export const RENDER_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description: "Verify extracted YAML tests and canonical docs exist before renderer work starts.",
    maxAttempts: 1,
    promptFile: "workflow/loops/render/prompts/01-preflight.md",
    requiredArtifacts: []
  },
  {
    id: "renderer-plan",
    kind: "opencode",
    description: "Create the narrow renderer implementation plan without touching UI or deployment.",
    maxAttempts: 2,
    promptFile: "workflow/loops/render/prompts/02-renderer-plan.md",
    requiredArtifacts: [
      "docs/render/renderer-plan.md"
    ]
  },
  {
    id: "renderer-implementation",
    kind: "opencode",
    description: "Implement the official Mermaid browser API wrapper and structural SVG result contract.",
    maxAttempts: 2,
    promptFile: "workflow/loops/render/prompts/03-renderer-implementation.md",
    requiredArtifacts: [
      "src/render/mermaid-to-svg.js"
    ]
  },
  {
    id: "render-test-runner",
    kind: "opencode",
    description: "Implement YAML schema validation and render tests for generated Mermaid cases.",
    maxAttempts: 2,
    promptFile: "workflow/loops/render/prompts/04-render-test-runner.md",
    requiredArtifacts: [
      "test/render-yml.test.mjs",
      "workflow/reports/render-capabilities.json"
    ]
  },
  {
    id: "validation",
    kind: "opencode",
    description: "Run render tests, record capability matrix, and document unsupported cases.",
    maxAttempts: 2,
    promptFile: "workflow/loops/render/prompts/05-validation.md",
    requiredArtifacts: [
      "docs/render/render-validation.md",
      "workflow/reports/render-capabilities.json"
    ]
  },
  {
    id: "final-report",
    kind: "opencode",
    description: "Write final render-loop report from machine-readable artifacts.",
    maxAttempts: 2,
    promptFile: "workflow/loops/render/prompts/06-final-report.md",
    requiredArtifacts: [
      "docs/render-loop-report.md"
    ]
  }
];
