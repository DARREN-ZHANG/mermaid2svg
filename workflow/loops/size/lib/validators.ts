import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { SIZE_LOOP_CONFIG } from "../size-loop.config.ts";

const VALIDATOR_SURFACE = ["workflow/reports/size-report.json", "docs/size-loop-report.md"];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(SIZE_LOOP_CONFIG, phase);
}
