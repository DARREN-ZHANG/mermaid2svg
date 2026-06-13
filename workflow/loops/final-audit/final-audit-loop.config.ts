import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const FINAL_AUDIT_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "final-audit-loop",
  title: "Final Acceptance Audit Loop",
  stateFile: "workflow/state/final-audit-loop.state.json",
  logDir: "workflow/runs/final-audit",
  reportDir: "workflow/reports",
  docsDir: "docs/final-audit",
  maxPhaseAttempts: 1,
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
    "workflow/reports/deployment-report.json",
    "workflow/reports/i18n-report.json",
    "workflow/reports/size-report.json",
  ],
  requiredFinalArtifacts: [
    "workflow/reports/final-report.md",
    "workflow/reports/final-acceptance-checklist.json",
    "docs/dev-workflow.md",
  ],
  blockedPatterns: ["new feature implementation", "unverified claim"],
  forbiddenScope: "new feature implementation",
};

export const FINAL_AUDIT_LOOP_PHASES: PhaseDefinition[] = [
  {
    id: "preflight",
    kind: "shell",
    description: "Verify all prior loop reports exist before final audit.",
    maxAttempts: 1,
    promptFile: "workflow/loops/final-audit/prompts/01-preflight.md",
    requiredArtifacts: [],
  },
  {
    id: "plan",
    kind: "opencode",
    description: "Plan deterministic final acceptance checklist coverage.",
    maxAttempts: 1,
    promptFile: "workflow/loops/final-audit/prompts/02-plan.md",
    requiredArtifacts: ["docs/final-audit/final-audit-plan.md"],
  },
  {
    id: "implementation",
    kind: "opencode",
    description: "Generate final acceptance checklist and dev workflow documentation.",
    maxAttempts: 1,
    promptFile: "workflow/loops/final-audit/prompts/03-implementation.md",
    requiredArtifacts: ["workflow/reports/final-acceptance-checklist.json", "docs/dev-workflow.md"],
  },
  {
    id: "verification",
    kind: "opencode",
    description: "Verify every acceptance criterion maps to an artifact or explicit open item.",
    maxAttempts: 1,
    promptFile: "workflow/loops/final-audit/prompts/04-verification.md",
    requiredArtifacts: ["workflow/reports/final-acceptance-checklist.json"],
  },
  {
    id: "final-report",
    kind: "opencode",
    description: "Write final project acceptance report.",
    maxAttempts: 1,
    promptFile: "workflow/loops/final-audit/prompts/05-final-report.md",
    requiredArtifacts: ["workflow/reports/final-report.md"],
  },
];
