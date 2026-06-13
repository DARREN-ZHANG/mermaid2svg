import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateRemainingPhase } from "../../remaining/lib/validators.ts";
import { FINAL_AUDIT_LOOP_CONFIG } from "../final-audit-loop.config.ts";

const VALIDATOR_SURFACE = ["workflow/reports/final-report.md", "workflow/reports/final-acceptance-checklist.json", "docs/dev-workflow.md"];
void VALIDATOR_SURFACE;

export function validateRemainingLoopPhase(phase: PhaseDefinition): ValidationResult {
  return validateRemainingPhase(FINAL_AUDIT_LOOP_CONFIG, phase);
}
