import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { THEME_LOOP_CONFIG } from "../theme-loop.config.ts";

const VALIDATOR_SURFACE = ["workflow/reports/theme-css-report.json", "docs/theme-loop-report.md"];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(THEME_LOOP_CONFIG, phase);
}
