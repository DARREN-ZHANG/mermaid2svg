import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const I18N_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "i18n-loop",
  title: "I18N Loop",
  stateFile: "workflow/state/i18n-loop.state.json",
  logDir: "workflow/runs/i18n",
  reportDir: "workflow/reports",
  docsDir: "docs/i18n",
  maxPhaseAttempts: 2,
  canonicalDocs: ["../docs/mermaid-svg-spec.md", "../docs/acceptance-criteria.md", "../docs/mermaid-svg-architecture.md"],
  canonicalDocFallbacks: ["../../../docs/mermaid-svg-spec.md", "../../../docs/acceptance-criteria.md", "../../../docs/mermaid-svg-architecture.md"],
  requiredInputs: ["workflow/reports/size-report.json", "demo"],
  requiredFinalArtifacts: ["workflow/reports/i18n-report.json", "docs/i18n-language-map.md", "docs/i18n-loop-report.md"],
  blockedPatterns: ["Cloudflare deployment", "hardcoded English-only copy"],
  forbiddenScope: "deployment"
};

export const I18N_LOOP_PHASES: PhaseDefinition[] = [
  { id: "preflight", kind: "shell", description: "Verify demo and size artifacts before i18n work.", maxAttempts: 1, promptFile: "workflow/loops/i18n/prompts/01-preflight.md", requiredArtifacts: [] },
  { id: "plan", kind: "opencode", description: "Plan locale alignment with math.webc.site language coverage.", maxAttempts: 2, promptFile: "workflow/loops/i18n/prompts/02-plan.md", requiredArtifacts: ["docs/i18n/i18n-plan.md"] },
  { id: "implementation", kind: "opencode", description: "Implement i18n keys and language coverage report.", maxAttempts: 2, promptFile: "workflow/loops/i18n/prompts/03-implementation.md", requiredArtifacts: ["workflow/reports/i18n-report.json", "docs/i18n-language-map.md"] },
  { id: "verification", kind: "opencode", description: "Verify generated i18n report and representative locale paths.", maxAttempts: 2, promptFile: "workflow/loops/i18n/prompts/04-verification.md", requiredArtifacts: ["workflow/reports/i18n-report.json"] },
  { id: "final-report", kind: "opencode", description: "Write the i18n loop report.", maxAttempts: 2, promptFile: "workflow/loops/i18n/prompts/05-final-report.md", requiredArtifacts: ["docs/i18n-loop-report.md"] }
];
