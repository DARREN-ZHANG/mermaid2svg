import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { DEPLOY_LOOP_CONFIG } from "../deploy-loop.config.ts";

const VALIDATOR_SURFACE = ["workflow/reports/deployment-report.json", "docs/deploy-loop-report.md"];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(DEPLOY_LOOP_CONFIG, phase);
}
