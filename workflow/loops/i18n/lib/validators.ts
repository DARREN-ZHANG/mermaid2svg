import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { I18N_LOOP_CONFIG } from "../i18n-loop.config.ts";

const VALIDATOR_SURFACE = [
  "workflow/reports/i18n-report.json",
  "docs/i18n-language-map.md",
  "docs/i18n-loop-report.md",
];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(I18N_LOOP_CONFIG, phase);
}
