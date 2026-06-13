import type { PhaseDefinition } from "./lib/types";

export const INIT_LOOP_CONFIG = {
  loopName: "init-loop",
  stateFile: "workflow/state/init-loop.state.json",
  logDir: "workflow/runs/init",
  snapshotDir: "workflow/runs/init/snapshots",
  maxPhaseAttempts: 2,
  referenceRepos: [
    {
      name: "maid",
      url: "https://github.com/probelabs/maid.git",
      dir: "references/maid"
    },
    {
      name: "beautiful-mermaid",
      url: "https://github.com/lukilabs/beautiful-mermaid.git",
      dir: "references/beautiful-mermaid"
    },
    {
      name: "mermaid",
      url: "https://github.com/mermaid-js/mermaid.git",
      dir: "references/mermaid"
    }
  ],
  canonicalDocs: [
    "../docs/mermaid-svg-spec.md",
    "../docs/acceptance-criteria.md",
    "../docs/mermaid-svg-architecture.md"
  ],
  protectedPaths: [
    "../docs/mermaid-svg-spec.md",
    "../docs/acceptance-criteria.md",
    "../docs/mermaid-svg-architecture.md",
    "references/**",
    ".git/**",
    ".env",
    ".env.*"
  ],
  protectedAssetPatterns: [
    "public/**",
    "demo/public/**",
    "demo/assets/**",
    "assets/**",
    "static/**"
  ],
  dangerousCommandPatterns: [
    "git push",
    "npm publish",
    "pnpm publish",
    "yarn publish",
    "wrangler deploy",
    "vercel deploy",
    "netlify deploy",
    "cloudflare pages deploy",
    "rm -rf /",
    "rm -rf ~",
    "sudo rm"
  ],
  forbiddenRuntimeDependencies: [
    "mermaid",
    "beautiful-mermaid",
    "@mermaid-js/mermaid-cli",
    "puppeteer",
    "playwright",
    "dagre",
    "elkjs",
    "cytoscape",
    "d3"
  ],
  deletionThreshold: 80,
  requiredFinalArtifacts: [
    "AGENTS.md",
    "docs/init/project-inventory.md",
    "docs/init/preserve-list.md",
    "docs/init/remove-candidates.md",
    "docs/init/cleanup-plan.md",
    "docs/init/cleanup-risk.md",
    "docs/init/reference-inventory.md",
    "docs/init/test-candidates.json",
    "extract/run.js",
    "extract/report.json",
    "test/schema.yml",
    "docs/test-inventory.md",
    "docs/spec-update-proposal.md",
    "docs/acceptance-update-proposal.md",
    "docs/init/verification.md",
    "docs/init-loop-report.md"
  ]
} as const;

export const INIT_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description: "Create directories, snapshots, and verify local parent reference repos.",
    maxAttempts: 1,
    promptFile: null,
    requiredArtifacts: []
  },
  {
    id: "project-cognition",
    kind: "opencode",
    description: "Build project cognition without making destructive changes.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/01-project-cognition.md",
    requiredArtifacts: [
      "AGENTS.md",
      "docs/init/project-inventory.md",
      "docs/init/preserve-list.md",
      "docs/init/remove-candidates.md"
    ]
  },
  {
    id: "repo-cleanup-plan",
    kind: "opencode",
    description: "Create a cleanup plan that separates keep/remove/defer/human_gate items.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/02-repo-cleanup-plan.md",
    requiredArtifacts: [
      "docs/init/cleanup-plan.md",
      "docs/init/cleanup-risk.md"
    ]
  },
  {
    id: "repo-cleanup-execute",
    kind: "opencode",
    description: "Execute only non-human-gate cleanup from the approved cleanup plan.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/03-repo-cleanup-execute.md",
    requiredArtifacts: [
      "docs/init/cleanup-execution.md"
    ]
  },
  {
    id: "reference-mining",
    kind: "opencode",
    description: "Read reference repos and produce structured Mermaid test candidates.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/04-reference-mining.md",
    requiredArtifacts: [
      "docs/init/reference-inventory.md",
      "docs/init/test-candidates.json"
    ]
  },
  {
    id: "test-extraction",
    kind: "opencode",
    description: "Generate minimal YAML tests from test-candidates.json.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/05-test-extraction.md",
    requiredArtifacts: [
      "extract/run.js",
      "extract/report.json",
      "test/schema.yml",
      "docs/test-inventory.md",
      "test"
    ]
  },
  {
    id: "spec-feedback",
    kind: "opencode",
    description: "Write spec/acceptance update proposals without modifying canonical docs.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/06-spec-feedback.md",
    requiredArtifacts: [
      "docs/spec-update-proposal.md",
      "docs/acceptance-update-proposal.md"
    ]
  },
  {
    id: "verification",
    kind: "opencode",
    description: "Run available verification commands and record honest results.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/07-verification.md",
    requiredArtifacts: [
      "docs/init/verification.md"
    ]
  },
  {
    id: "final-report",
    kind: "opencode",
    description: "Produce the final init loop report.",
    maxAttempts: 2,
    promptFile: "workflow/loops/init/prompts/08-final-report.md",
    requiredArtifacts: [
      "docs/init-loop-report.md"
    ]
  }
];
