import type { PhaseDefinition } from "../init/lib/types.ts";
import type { RemainingLoopConfig } from "../remaining/lib/types.ts";

export const THEME_LOOP_CONFIG: RemainingLoopConfig = {
  loopName: "theme-loop",
  title: "Theme Loop",
  stateFile: "workflow/state/theme-loop.state.json",
  logDir: "workflow/runs/theme",
  reportDir: "workflow/reports",
  docsDir: "docs/theme",
  maxPhaseAttempts: 2,
  canonicalDocs: ["../docs/mermaid-svg-spec.md", "../docs/acceptance-criteria.md", "../docs/mermaid-svg-architecture.md"],
  canonicalDocFallbacks: ["../../../docs/mermaid-svg-spec.md", "../../../docs/acceptance-criteria.md", "../../../docs/mermaid-svg-architecture.md"],
  requiredInputs: ["workflow/reports/web-demo-report.json", "src/render/normalize-svg.js"],
  requiredFinalArtifacts: ["workflow/reports/theme-css-report.json", "docs/theme-loop-report.md"],
  blockedPatterns: ["runtime benchmark", "Cloudflare deployment", "database", "queue"],
  forbiddenScope: "size comparison, i18n, or deployment"
};

export const THEME_LOOP_PHASES: PhaseDefinition[] = [
  { id: "preflight", kind: "shell", description: "Verify the demo loop report and renderer output are present.", maxAttempts: 1, promptFile: "workflow/loops/theme/prompts/01-preflight.md", requiredArtifacts: [] },
  { id: "plan", kind: "opencode", description: "Plan Beautiful Mermaid CSS theme integration and source tracking.", maxAttempts: 2, promptFile: "workflow/loops/theme/prompts/02-plan.md", requiredArtifacts: ["docs/theme/theme-plan.md"] },
  { id: "implementation", kind: "opencode", description: "Implement theme switching and theme source report artifacts.", maxAttempts: 2, promptFile: "workflow/loops/theme/prompts/03-implementation.md", requiredArtifacts: ["workflow/reports/theme-css-report.json"] },
  { id: "verification", kind: "opencode", description: "Verify theme switching changes SVG styling without changing render semantics.", maxAttempts: 2, promptFile: "workflow/loops/theme/prompts/04-verification.md", requiredArtifacts: ["workflow/reports/theme-css-report.json"] },
  { id: "final-report", kind: "opencode", description: "Write the theme loop report.", maxAttempts: 2, promptFile: "workflow/loops/theme/prompts/05-final-report.md", requiredArtifacts: ["docs/theme-loop-report.md"] }
];
