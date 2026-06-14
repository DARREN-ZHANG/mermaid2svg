import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { SVG_OUTPUT_LOOP_CONFIG } from "../svg-output-loop.config.ts";
import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";

const RENDERER_ENTRY = "demo/render/mermaid-to-svg.js";
const RENDER_TEST_RUNNER = "test/render-yml.test.mjs";
const RENDER_CAPABILITIES_REPORT = "workflow/reports/render-capabilities.json";

export function validateSvgOutputPhase(
  phase: Pick<PhaseDefinition, "id" | "requiredArtifacts">,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const artifact of phase.requiredArtifacts) {
    if (!existsSync(artifact))
      errors.push(`Missing required artifact for ${phase.id}: ${artifact}`);
  }

  if (phase.id === "preflight") {
    errors.push(...validateCanonicalDocsExist());
    errors.push(...validateRenderInputs());
  }

  if (
    [
      "compatibility-plan",
      "normalizer-implementation",
      "compatibility-tests",
      "validation",
      "final-report",
    ].includes(phase.id)
  ) {
    errors.push(...validateRenderInputs());
  }

  if (
    ["normalizer-implementation", "compatibility-tests", "validation", "final-report"].includes(
      phase.id,
    )
  ) {
    errors.push(...validateNormalizerEntry());
  }

  if (["compatibility-tests", "validation", "final-report"].includes(phase.id)) {
    errors.push(...validateCompatibilityTests());
    errors.push(...validateCompatibilityReport());
  }

  if (phase.id === "final-report") {
    for (const artifact of SVG_OUTPUT_LOOP_CONFIG.requiredFinalArtifacts) {
      if (!existsSync(artifact)) errors.push(`Missing final required artifact: ${artifact}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateCanonicalDocsExist(): string[] {
  const errors: string[] = [];
  for (const doc of SVG_OUTPUT_LOOP_CONFIG.canonicalDocs) {
    if (existsSync(doc)) continue;
    const basename = path.basename(doc);
    const fallback = SVG_OUTPUT_LOOP_CONFIG.canonicalDocFallbacks.find(
      (candidate) => path.basename(candidate) === basename,
    );
    if (!fallback || !existsSync(fallback)) errors.push(`Missing canonical doc: ${doc}`);
  }
  return errors;
}

function validateRenderInputs(): string[] {
  const errors: string[] = [];
  for (const file of [RENDERER_ENTRY, RENDER_TEST_RUNNER, RENDER_CAPABILITIES_REPORT]) {
    if (!existsSync(file)) errors.push(`Missing render-loop input: ${file}`);
  }
  errors.push(...validateRenderCapabilities());
  return errors;
}

function validateRenderCapabilities(): string[] {
  const file = RENDER_CAPABILITIES_REPORT;
  if (!existsSync(file)) return [];
  try {
    const report = JSON.parse(readFileSync(file, "utf8"));
    const errors: string[] = [];
    if (!Array.isArray(report.supported)) errors.push(`${file} must include supported array.`);
    if (!Array.isArray(report.unsupported)) errors.push(`${file} must include unsupported array.`);
    if (!report.summary || typeof report.summary !== "object")
      errors.push(`${file} must include summary object.`);
    return errors;
  } catch (error) {
    return [`Invalid render capabilities report: ${(error as Error).message}`];
  }
}

function validateNormalizerEntry(): string[] {
  const file = "demo/render/normalize-svg.js";
  if (!existsSync(file)) return [`Missing SVG output normalizer: ${file}`];
  const source = readFileSync(file, "utf8");
  const errors: string[] = [];
  for (const required of ["viewBox", "svg", "script", "deterministic"]) {
    if (!source.includes(required))
      errors.push(`${file} missing required SVG compatibility concern: ${required}`);
  }
  if (!/export\s+/.test(source)) errors.push(`${file} must export the SVG normalization API.`);
  for (const pattern of SVG_OUTPUT_LOOP_CONFIG.blockedSvgOutputPatterns) {
    if (source.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push(`${file} contains blocked SVG output path: ${pattern}`);
    }
  }
  return errors;
}

function validateCompatibilityTests(): string[] {
  const file = "test/svg-output.test.mjs";
  if (!existsSync(file)) return [`Missing SVG output compatibility tests: ${file}`];
  const source = readFileSync(file, "utf8");
  const errors: string[] = [];
  for (const required of ["normalize-svg", "viewBox", "deterministic", "runtime JS", "script"]) {
    if (!source.includes(required))
      errors.push(`${file} missing required assertion reference: ${required}`);
  }
  return errors;
}

function validateCompatibilityReport(): string[] {
  const file = "workflow/reports/svg-output-compatibility.json";
  if (!existsSync(file)) return [`Missing SVG output compatibility report: ${file}`];
  try {
    const report = JSON.parse(readFileSync(file, "utf8"));
    const errors: string[] = [];
    if (!report.summary || typeof report.summary !== "object")
      errors.push(`${file} must include summary object.`);
    if (!Array.isArray(report.checkedRules))
      errors.push(`${file} must include checkedRules array.`);
    if (!Array.isArray(report.failures)) errors.push(`${file} must include failures array.`);
    if (!report.summary.deterministic)
      errors.push(`${file} summary must record deterministic SVG output status.`);
    return errors;
  } catch (error) {
    return [`Invalid SVG output compatibility report: ${(error as Error).message}`];
  }
}
