import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const DEPLOY_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "deploy-loop",
  title: "Deploy Loop",
  stateFile: "workflow/state/deploy-loop.state.json",
  logDir: "workflow/runs/deploy",
  reportDir: "workflow/reports",
  docsDir: "docs/deploy",
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
    "workflow/reports/i18n-report.json",
    "workflow/reports/size-report.json",
    "demo",
  ],
  requiredFinalArtifacts: ["workflow/reports/deployment-report.json", "docs/deploy-loop-report.md"],
  blockedPatterns: ["database", "queue", "server runtime", "new feature implementation"],
  forbiddenScope: "final acceptance sign-off",
};

export const DEPLOY_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description: "Verify demo, i18n, and size artifacts before deployment work.",
    maxAttempts: 1,
    promptFile: "workflow/loops/deploy/prompts/01-preflight.md",
    requiredArtifacts: [],
  },
  {
    id: "plan",
    kind: "opencode",
    description: "Plan Cloudflare Pages build configuration and deployment evidence.",
    maxAttempts: 2,
    promptFile: "workflow/loops/deploy/prompts/02-plan.md",
    requiredArtifacts: ["docs/deploy/deploy-plan.md"],
  },
  {
    id: "implementation",
    kind: "opencode",
    description: "Implement Cloudflare Pages configuration and deployment report artifacts.",
    maxAttempts: 2,
    promptFile: "workflow/loops/deploy/prompts/03-implementation.md",
    requiredArtifacts: ["workflow/reports/deployment-report.json"],
  },
  {
    id: "verification",
    kind: "opencode",
    description: "Verify build command, output directory, and deployment readiness.",
    maxAttempts: 2,
    promptFile: "workflow/loops/deploy/prompts/04-verification.md",
    requiredArtifacts: ["workflow/reports/deployment-report.json"],
  },
  {
    id: "final-report",
    kind: "opencode",
    description: "Write the deploy loop report.",
    maxAttempts: 2,
    promptFile: "workflow/loops/deploy/prompts/05-final-report.md",
    requiredArtifacts: ["docs/deploy-loop-report.md"],
  },
];
