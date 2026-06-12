import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { INIT_LOOP_CONFIG } from "../init-loop.config";
import { hashFile, simpleGlobMatch } from "./fs-utils";
import { getChangedFiles, readPackageSnapshot } from "./git";
import type { BaselineSnapshot, PhaseDefinition, ValidationResult } from "./types";

export async function validatePhase(
  phase: PhaseDefinition,
  baseline: BaselineSnapshot
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const artifact of phase.requiredArtifacts) {
    if (!existsSync(artifact)) {
      errors.push(`Missing required artifact for ${phase.id}: ${artifact}`);
    }
  }

  const protectedMutationErrors = await validateProtectedPathsUnchanged();
  errors.push(...protectedMutationErrors);
  errors.push(...validateCanonicalDocsUnchanged(baseline));

  const dependencyErrors = validateNoForbiddenRuntimeDependencies(baseline);
  errors.push(...dependencyErrors);

  if (phase.id === "reference-mining") {
    errors.push(...validateReferenceMiningArtifacts());
  }

  if (phase.id === "test-extraction") {
    const testResult = validateGeneratedYamlTests("test");
    errors.push(...testResult.errors);
    warnings.push(...testResult.warnings);
    errors.push(...validateExtractionArtifacts());
  }

  if (phase.id === "spec-feedback") {
    const currentSpecHash = hashFile("../docs/mermaid-svg-spec.md");
    const currentAcceptanceHash = hashFile("../docs/acceptance-criteria.md");
    if (baseline.specHash && currentSpecHash !== baseline.specHash) {
      errors.push("Canonical ../docs/mermaid-svg-spec.md was modified. Write proposals only.");
    }
    if (baseline.acceptanceHash && currentAcceptanceHash !== baseline.acceptanceHash) {
      errors.push("Canonical ../docs/acceptance-criteria.md was modified. Write proposals only.");
    }
  }

  if (phase.id === "final-report") {
    for (const artifact of INIT_LOOP_CONFIG.requiredFinalArtifacts) {
      if (!existsSync(artifact)) errors.push(`Missing final required artifact: ${artifact}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

async function validateProtectedPathsUnchanged(): Promise<string[]> {
  const errors: string[] = [];
  const changed = await getChangedFiles();
  for (const file of changed) {
    for (const protectedPattern of INIT_LOOP_CONFIG.protectedPaths) {
      if (
        protectedPattern === "../docs/mermaid-svg-spec.md" ||
        protectedPattern === "../docs/acceptance-criteria.md" ||
        protectedPattern === "../docs/mermaid-svg-architecture.md"
      ) {
        if (file === protectedPattern) {
          errors.push(`Protected canonical file changed: ${file}`);
        }
        continue;
      }
      if (simpleGlobMatch(file, protectedPattern)) {
        errors.push(`Protected path changed: ${file} matched ${protectedPattern}`);
      }
    }
  }
  return errors;
}

function validateCanonicalDocsUnchanged(baseline: BaselineSnapshot): string[] {
  const errors: string[] = [];
  const currentSpecHash = hashFile("../docs/mermaid-svg-spec.md"),
    currentAcceptanceHash = hashFile("../docs/acceptance-criteria.md"),
    currentArchitectureHash = hashFile("../docs/mermaid-svg-architecture.md");
  if (baseline.specHash && currentSpecHash !== baseline.specHash) {
    errors.push("Canonical ../docs/mermaid-svg-spec.md was modified.");
  }
  if (baseline.acceptanceHash && currentAcceptanceHash !== baseline.acceptanceHash) {
    errors.push("Canonical ../docs/acceptance-criteria.md was modified.");
  }
  if (baseline.architectureHash && currentArchitectureHash !== baseline.architectureHash) {
    errors.push("Canonical ../docs/mermaid-svg-architecture.md was modified.");
  }
  return errors;
}

function validateNoForbiddenRuntimeDependencies(baseline: BaselineSnapshot): string[] {
  const errors: string[] = [];
  const before = baseline.packageJson;
  const after = readPackageSnapshot();
  if (!after) return errors;

  const beforeDeps = before?.dependencies ?? {};
  for (const dep of Object.keys(after.dependencies)) {
    if (!beforeDeps[dep] && INIT_LOOP_CONFIG.forbiddenRuntimeDependencies.includes(dep)) {
      errors.push(`Forbidden runtime dependency added: ${dep}`);
    }
  }
  return errors;
}

function validateReferenceMiningArtifacts(): string[] {
  const errors: string[] = [];
  const candidatesPath = "docs/init/test-candidates.json";
  if (!existsSync(candidatesPath)) return [`Missing ${candidatesPath}`];

  try {
    const candidates = JSON.parse(readFileSync(candidatesPath, "utf8"));
    if (!Array.isArray(candidates)) {
      errors.push("docs/init/test-candidates.json must be a JSON array.");
      return errors;
    }
    if (candidates.length < 5) errors.push("Expected at least 5 test candidates.");
    if (!candidates.some((item) => item.classification === "minimal_core")) {
      errors.push("Expected at least one minimal_core test candidate.");
    }
    if (!candidates.some((item) => /flowchart|graph/i.test(String(item.type ?? item.input ?? "")))) {
      errors.push("Expected at least one flowchart/graph candidate.");
    }
  } catch (error) {
    errors.push(`Invalid JSON in ${candidatesPath}: ${(error as Error).message}`);
  }
  return errors;
}

function validateGeneratedYamlTests(dir: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(dir) || !lstatSync(dir).isDirectory()) {
    return { ok: false, errors: [`Missing generated test directory: ${dir}`], warnings };
  }

  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .filter((file) => file !== "schema.yml")
    .map((file) => path.join(dir, file));

  if (files.length < 5) {
    errors.push(`Expected at least 5 generated YAML tests, got ${files.length}.`);
  }

  let flowchartCount = 0;
  let sequenceCount = 0;
  let classOrStateCount = 0;

  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    const requiredFields = ["id:", "source:", "diagram:", "input:", "expect:", "skip:"];
    for (const field of requiredFields) {
      if (!raw.includes(field)) errors.push(`${file} missing field ${field}`);
    }
    if (!/root:\s*true/.test(raw)) {
      warnings.push(`${file} does not explicitly assert svg.root true.`);
    }
    if (/type:\s*(flowchart|graph)/i.test(raw) || /graph\s+(TD|LR|BT|RL)/.test(raw)) flowchartCount++;
    if (/sequenceDiagram/.test(raw)) sequenceCount++;
    if (/classDiagram|stateDiagram/.test(raw)) classOrStateCount++;
    if (/input:\s*\|\s*\n\s*($|expect:)/m.test(raw)) {
      errors.push(`${file} appears to have an empty input block.`);
    }
  }

  if (flowchartCount < 3) errors.push(`Expected at least 3 flowchart tests, got ${flowchartCount}.`);
  if (sequenceCount < 1) warnings.push("No sequenceDiagram test generated. Acceptable only if no candidate exists.");
  if (classOrStateCount < 1) warnings.push("No classDiagram/stateDiagram test generated. Acceptable only if no candidate exists.");

  return { ok: errors.length === 0, errors, warnings };
}

function validateExtractionArtifacts(): string[] {
  const errors: string[] = [];
  if (!existsSync("extract/run.js")) errors.push("Missing extract/run.js.");
  if (!existsSync("extract/report.json")) errors.push("Missing extract/report.json.");
  if (!existsSync("test/schema.yml")) errors.push("Missing test/schema.yml.");
  if (!existsSync("extract/report.json")) return errors;

  try {
    const report = JSON.parse(readFileSync("extract/report.json", "utf8"));
    const sources = report.sources ?? {};
    for (const repo of ["probelabs/maid", "lukilabs/beautiful-mermaid", "mermaid-js/mermaid"]) {
      if (!sources[repo]) errors.push(`extract/report.json missing source ${repo}.`);
    }
    if (!report.byDiagramType) errors.push("extract/report.json missing byDiagramType.");
    if (!report.skipReasons) errors.push("extract/report.json missing skipReasons.");
  } catch (error) {
    errors.push(`Invalid JSON in extract/report.json: ${(error as Error).message}`);
  }
  return errors;
}
