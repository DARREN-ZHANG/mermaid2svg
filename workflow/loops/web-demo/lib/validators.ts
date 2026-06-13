import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { WEB_DEMO_LOOP_CONFIG } from "../web-demo-loop.config.ts";

const VALIDATOR_SURFACE = [
  "demo",
  "workflow/reports/web-demo-report.json",
  "docs/web-demo-loop-report.md",
];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(WEB_DEMO_LOOP_CONFIG, phase);
}
