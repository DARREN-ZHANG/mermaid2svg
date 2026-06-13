import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const WEB_DEMO_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "web-demo-loop",
  title: "Web Demo Loop",
  stateFile: "workflow/state/web-demo-loop.state.json",
  logDir: "workflow/runs/web-demo",
  reportDir: "workflow/reports",
  docsDir: "docs/web-demo",
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
  requiredInputs: [
    "src/render/mermaid-to-svg.js",
    "src/render/normalize-svg.js",
    "workflow/reports/svg-output-compatibility.json",
  ],
  requiredFinalArtifacts: [
    "demo",
    "workflow/reports/web-demo-report.json",
    "docs/web-demo-loop-report.md",
  ],
  blockedPatterns: ["database", "queue", "server API", "Cloudflare deployment"],
  forbiddenScope: "theme switching, size comparison, i18n, or deployment",
};

export const WEB_DEMO_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description: "Verify renderer and SVG output artifacts before demo work.",
    maxAttempts: 1,
    promptFile: "workflow/loops/web-demo/prompts/01-preflight.md",
    requiredArtifacts: [],
  },
  {
    id: "plan",
    kind: "opencode",
    description: "Plan the demo page integration using existing math.webc.site design material.",
    maxAttempts: 2,
    promptFile: "workflow/loops/web-demo/prompts/02-plan.md",
    requiredArtifacts: ["docs/web-demo/web-demo-plan.md"],
  },
  {
    id: "implementation",
    kind: "opencode",
    description: "Implement the input, preview, examples, and demo report artifacts.",
    maxAttempts: 2,
    promptFile: "workflow/loops/web-demo/prompts/03-implementation.md",
    requiredArtifacts: ["demo", "workflow/reports/web-demo-report.json"],
  },
  {
    id: "verification",
    kind: "opencode",
    description: "Verify local demo behavior and document evidence.",
    maxAttempts: 2,
    promptFile: "workflow/loops/web-demo/prompts/04-verification.md",
    requiredArtifacts: ["workflow/reports/web-demo-report.json"],
  },
  {
    id: "final-report",
    kind: "opencode",
    description: "Write the web demo loop report.",
    maxAttempts: 2,
    promptFile: "workflow/loops/web-demo/prompts/05-final-report.md",
    requiredArtifacts: ["docs/web-demo-loop-report.md"],
  },
];
