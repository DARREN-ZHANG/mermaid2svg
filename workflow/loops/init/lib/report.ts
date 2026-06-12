import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { gitDiffStat, gitStatusShort } from "./git";
import type { HumanGateResult, PhaseDefinition, ValidationResult } from "./types";

export async function writePhaseFailure(
  logDir: string,
  phase: PhaseDefinition,
  attempt: number,
  validation: ValidationResult
) {
  await mkdir(logDir, { recursive: true });
  await writeFile(
    path.join(logDir, `${phase.id}.attempt-${attempt}.failure.md`),
    [
      `# Phase Failure: ${phase.id}`,
      "",
      `Attempt: ${attempt}`,
      "",
      "## Errors",
      ...validation.errors.map((item) => `- ${item}`),
      "",
      "## Warnings",
      ...validation.warnings.map((item) => `- ${item}`)
    ].join("\n"),
    "utf8"
  );
}

export async function writeNeedsHuman(
  logDir: string,
  phase: PhaseDefinition,
  gate: HumanGateResult
) {
  await mkdir(logDir, { recursive: true });
  await writeFile(
    path.join(logDir, "needs-human.md"),
    [
      "# Init Loop Needs Human Review",
      "",
      `Phase: ${phase.id}`,
      "",
      `Reason: ${gate.reason ?? "Unknown"}`,
      "",
      "## Details",
      ...gate.details.map((item) => `- ${item}`),
      "",
      "## What to do",
      "Review the diff and either revert/adjust the risky change or explicitly update the orchestrator policy if this action is acceptable."
    ].join("\n"),
    "utf8"
  );
}

export async function writeLoopSummary(logDir: string) {
  await mkdir(logDir, { recursive: true });
  const status = await gitStatusShort();
  const stat = await gitDiffStat();
  await writeFile(
    path.join(logDir, "loop-summary.md"),
    [
      "# Init Loop Summary",
      "",
      "## Git status",
      "```",
      status || "clean",
      "```",
      "",
      "## Git diff stat",
      "```",
      stat || "no diff",
      "```"
    ].join("\n"),
    "utf8"
  );
}
