import { existsSync } from "node:fs";
import path from "node:path";
import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import type { RemainingLoopConfig } from "./types.ts";

export function validateRemainingPhase(
  config: RemainingLoopConfig,
  phase: Pick<PhaseDefinition, "id" | "requiredArtifacts">,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const artifact of phase.requiredArtifacts) {
    if (!existsSync(artifact))
      errors.push(`Missing required artifact for ${phase.id}: ${artifact}`);
  }

  if (phase.id === "preflight") {
    errors.push(...validateCanonicalDocsExist(config));
    errors.push(...validateRequiredInputs(config));
  }

  if (["plan", "implementation", "verification", "final-report"].includes(phase.id)) {
    errors.push(...validateRequiredInputs(config));
  }

  if (phase.id === "final-report") {
    for (const artifact of config.requiredFinalArtifacts) {
      if (!existsSync(artifact)) errors.push(`Missing final required artifact: ${artifact}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateCanonicalDocsExist(config: RemainingLoopConfig): string[] {
  const errors: string[] = [];
  for (const doc of config.canonicalDocs) {
    if (existsSync(doc)) continue;
    const basename = path.basename(doc);
    const fallback = config.canonicalDocFallbacks.find(
      (candidate) => path.basename(candidate) === basename,
    );
    if (!fallback || !existsSync(fallback)) errors.push(`Missing canonical doc: ${doc}`);
  }
  return errors;
}

function validateRequiredInputs(config: RemainingLoopConfig): string[] {
  const errors: string[] = [];
  for (const file of config.requiredInputs) {
    if (!existsSync(file)) errors.push(`Missing ${config.loopName} input: ${file}`);
  }
  return errors;
}
