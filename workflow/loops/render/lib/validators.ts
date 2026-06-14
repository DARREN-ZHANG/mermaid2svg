import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { RENDER_LOOP_CONFIG } from "../render-loop.config.ts";
import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";

export function validateRenderPhase(
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
    errors.push(...validateExtractionInputs());
  }

  if (
    ["renderer-implementation", "render-test-runner", "validation", "final-report"].includes(
      phase.id,
    )
  ) {
    errors.push(...validateRendererEntry());
  }

  if (["render-test-runner", "validation", "final-report"].includes(phase.id)) {
    errors.push(...validateRenderTestRunner());
    errors.push(...validateRenderCapabilities());
  }

  if (phase.id === "validation" || phase.id === "final-report") {
    errors.push(...validateExtractionInputs());
  }

  if (phase.id === "final-report") {
    for (const artifact of RENDER_LOOP_CONFIG.requiredFinalArtifacts) {
      if (!existsSync(artifact)) errors.push(`Missing final required artifact: ${artifact}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function validateCanonicalDocsExist(): string[] {
  const errors: string[] = [];
  for (const doc of RENDER_LOOP_CONFIG.canonicalDocs) {
    if (existsSync(doc)) continue;
    const basename = path.basename(doc);
    const fallback = RENDER_LOOP_CONFIG.canonicalDocFallbacks.find(
      (candidate) => path.basename(candidate) === basename,
    );
    if (!fallback || !existsSync(fallback)) errors.push(`Missing canonical doc: ${doc}`);
  }
  return errors;
}

export function validateExtractionInputs(): string[] {
  const errors: string[] = [];
  if (!existsSync("test/schema.yml")) errors.push("Missing test/schema.yml.");
  if (!existsSync("extract/report.json")) errors.push("Missing extract/report.json.");
  if (listYamlTests("test").length === 0)
    errors.push("Missing executable YAML tests matching test/*.yml.");
  errors.push(...validateExtractReport());
  return errors;
}

function validateExtractReport(): string[] {
  if (!existsSync("extract/report.json")) return [];
  const errors: string[] = [];
  try {
    const report = JSON.parse(readFileSync("extract/report.json", "utf8"));
    for (const repo of ["probelabs/maid", "lukilabs/beautiful-mermaid", "mermaid-js/mermaid"]) {
      if (!report.sources?.[repo]) errors.push(`extract/report.json missing source ${repo}.`);
    }
  } catch (error) {
    errors.push(`Invalid extract/report.json: ${(error as Error).message}`);
  }
  return errors;
}

function validateRendererEntry(): string[] {
  const file = "demo/render/mermaid-to-svg.js";
  if (!existsSync(file)) return [`Missing renderer entry: ${file}`];
  const source = readFileSync(file, "utf8");
  const errors: string[] = [];
  if (!/from\s+["']mermaid["']|import\(["']mermaid["']\)/.test(source)) {
    errors.push(`${file} must use the official Mermaid browser package.`);
  }
  if (!/render/.test(source)) {
    errors.push(`${file} must expose or call a Mermaid render path.`);
  }
  for (const pattern of RENDER_LOOP_CONFIG.blockedRenderPatterns) {
    if (source.toLowerCase().includes(pattern.toLowerCase())) {
      errors.push(`${file} contains blocked render path: ${pattern}`);
    }
  }
  return errors;
}

function validateRenderTestRunner(): string[] {
  const file = "test/render-yml.test.mjs";
  if (!existsSync(file)) return [`Missing render test runner: ${file}`];
  const source = readFileSync(file, "utf8");
  const errors: string[] = [];
  for (const required of ["test/schema.yml", "mermaid-to-svg", "viewBox", "<svg"]) {
    if (!source.includes(required))
      errors.push(`${file} missing required assertion reference: ${required}`);
  }
  return errors;
}

function validateRenderCapabilities(): string[] {
  const file = "workflow/reports/render-capabilities.json";
  if (!existsSync(file)) return [`Missing render capabilities report: ${file}`];
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

function listYamlTests(dir: string): string[] {
  if (!existsSync(dir) || !lstatSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .filter((file) => file !== "schema.yml")
    .map((file) => path.join(dir, file));
}
