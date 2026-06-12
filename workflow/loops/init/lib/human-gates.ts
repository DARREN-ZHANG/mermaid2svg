import { existsSync, readFileSync } from "node:fs";
import { INIT_LOOP_CONFIG } from "../init-loop.config";
import { simpleGlobMatch } from "./fs-utils";
import { getChangedFiles, getDeletedFiles } from "./git";
import type { HumanGateResult, PhaseDefinition } from "./types";

export async function evaluateHumanGate(phase: PhaseDefinition): Promise<HumanGateResult> {
  const details: string[] = [];
  const changed = await getChangedFiles();
  const deleted = await getDeletedFiles();

  for (const file of changed) {
    if (
      file === "../docs/mermaid-svg-spec.md" ||
      file === "../docs/acceptance-criteria.md" ||
      file === "../docs/mermaid-svg-architecture.md"
    ) {
      details.push(`Canonical requirement file changed: ${file}`);
    }
    if (file.startsWith("../references/")) {
      details.push(`Reference repository was modified: ${file}`);
    }
  }

  if (deleted.length > INIT_LOOP_CONFIG.deletionThreshold) {
    details.push(`Deleted file count ${deleted.length} exceeds threshold ${INIT_LOOP_CONFIG.deletionThreshold}.`);
  }

  for (const deletedPath of deleted) {
    for (const protectedAsset of INIT_LOOP_CONFIG.protectedAssetPatterns) {
      if (simpleGlobMatch(deletedPath, protectedAsset)) {
        details.push(`Deleted protected asset/design path: ${deletedPath}`);
      }
    }
  }

  const packageRisk = detectRuntimeDependencyRisk();
  details.push(...packageRisk);

  const commandRisk = detectDangerousCommandLogRisk();
  details.push(...commandRisk);

  const exclusionRisk = detectPermanentExclusionRisk();
  details.push(...exclusionRisk);

  return {
    blocked: details.length > 0,
    reason: details.length > 0 ? `Human gate triggered during phase ${phase.id}` : null,
    details
  };
}

function detectRuntimeDependencyRisk(): string[] {
  const risks: string[] = [];
  if (!existsSync("package.json")) return risks;
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
  };
  for (const dep of Object.keys(pkg.dependencies ?? {})) {
    if (INIT_LOOP_CONFIG.forbiddenRuntimeDependencies.includes(dep)) {
      risks.push(`Forbidden runtime dependency present in dependencies: ${dep}`);
    }
  }
  return risks;
}

function detectDangerousCommandLogRisk(): string[] {
  const risks: string[] = [];
  const logFile = "workflow/runs/init/commands.log";
  if (!existsSync(logFile)) return risks;
  const raw = readFileSync(logFile, "utf8");
  for (const pattern of INIT_LOOP_CONFIG.dangerousCommandPatterns) {
    if (raw.includes(pattern)) risks.push(`Dangerous command pattern found in command log: ${pattern}`);
  }
  return risks;
}

function detectPermanentExclusionRisk(): string[] {
  const risks: string[] = [];
  const knownRiskFiles = [
    "test/exclusions.yml",
    "test/exclusions.yaml",
    "docs/init/test-exclusions.md"
  ];
  for (const file of knownRiskFiles) {
    if (existsSync(file)) {
      risks.push(`Potential permanent upstream-test exclusion file created: ${file}`);
    }
  }
  return risks;
}
