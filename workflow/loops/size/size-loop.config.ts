import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const SIZE_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "size-loop",
  title: "Size Loop",
  stateFile: "workflow/state/size-loop.state.json",
  logDir: "workflow/runs/size",
  reportDir: "workflow/reports",
  docsDir: "docs/size",
  maxPhaseAttempts: 2,
  canonicalDocs: ["../docs/mermaid-svg-spec.md", "../docs/acceptance-criteria.md", "../docs/mermaid-svg-architecture.md"],
  canonicalDocFallbacks: ["../../../docs/mermaid-svg-spec.md", "../../../docs/acceptance-criteria.md", "../../../docs/mermaid-svg-architecture.md"],
  requiredInputs: ["workflow/reports/theme-css-report.json", "demo"],
  requiredFinalArtifacts: ["workflow/reports/size-report.json", "docs/size-loop-report.md"],
  blockedPatterns: ["runtime benchmark", "estimated size", "manual size data"],
  forbiddenScope: "i18n or deployment"
};

export const SIZE_LOOP_PHASES: PhaseDefinition[] = [
  { id: "preflight", kind: "shell", description: "Verify themed demo artifacts before size work.", maxAttempts: 1, promptFile: "workflow/loops/size/prompts/01-preflight.md", requiredArtifacts: [] },
  { id: "plan", kind: "opencode", description: "Plan generated size report and SVG bar chart integration.", maxAttempts: 2, promptFile: "workflow/loops/size/prompts/02-plan.md", requiredArtifacts: ["docs/size/size-plan.md"] },
  { id: "implementation", kind: "opencode", description: "Implement generated size report and demo chart wiring.", maxAttempts: 2, promptFile: "workflow/loops/size/prompts/03-implementation.md", requiredArtifacts: ["workflow/reports/size-report.json"] },
  { id: "verification", kind: "opencode", description: "Verify size report values are generated from real artifacts.", maxAttempts: 2, promptFile: "workflow/loops/size/prompts/04-verification.md", requiredArtifacts: ["workflow/reports/size-report.json"] },
  { id: "final-report", kind: "opencode", description: "Write the size loop report.", maxAttempts: 2, promptFile: "workflow/loops/size/prompts/05-final-report.md", requiredArtifacts: ["docs/size-loop-report.md"] }
];
