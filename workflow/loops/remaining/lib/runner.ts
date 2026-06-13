import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runOpenCodePhase } from "../../init/lib/opencode-runner.ts";
import { writePhaseFailure } from "../../init/lib/report.ts";
import { runShell } from "../../init/lib/shell.ts";
import { incrementAttempt, loadState, markPhaseComplete, saveState } from "../../init/lib/state.ts";
import type { PhaseDefinition, ValidationResult } from "../../init/lib/types.ts";
import { validateCanonicalDocsExist } from "./validators.ts";
import type { RemainingLoopConfig } from "./types.ts";

export async function runRemainingLoop(
  config: RemainingLoopConfig,
  phases: PhaseDefinition[],
  validatePhase: (phase: PhaseDefinition) => ValidationResult
) {
  await mkdir(config.logDir, { recursive: true });
  await mkdir(config.reportDir, { recursive: true });
  await mkdir(config.docsDir, { recursive: true });

  let state = await loadState(config.stateFile, config.loopName);

  for (const phase of phases) {
    if (state.completedPhases.includes(phase.id)) continue;

    const maxAttempts = phase.maxAttempts ?? config.maxPhaseAttempts;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      state = incrementAttempt(state, phase.id);
      await saveState(config.stateFile, state);

      console.log(`\n=== ${config.title}: ${phase.id} / attempt ${attempt} ===`);

      if (phase.kind === "shell") {
        await runPreflightPhase(config);
      } else {
        if (!phase.promptFile) throw new Error(`Missing promptFile for phase ${phase.id}`);
        await runOpenCodePhase({
          phaseId: phase.id,
          promptFile: phase.promptFile,
          logDir: config.logDir
        });
      }

      const validation = validatePhase(phase);
      if (validation.ok) {
        state = markPhaseComplete(state, phase.id);
        await saveState(config.stateFile, state);
        console.log(`Phase passed: ${phase.id}`);
        break;
      }

      await writePhaseFailure(config.logDir, phase, attempt, validation);
      console.warn(`Phase failed validation: ${phase.id}`);
      for (const error of validation.errors) console.warn(`- ${error}`);

      if (attempt === maxAttempts) {
        state.status = "needs_human";
        state.blockedReason = `Phase ${phase.id} failed after ${attempt} attempts`;
        await saveState(config.stateFile, state);
        process.exit(1);
      }
    }
  }

  state.status = "completed";
  state.currentPhase = null;
  state.finishedAt = new Date().toISOString();
  await saveState(config.stateFile, state);
  await writeLoopSummary(config);
  console.log(`${config.title} completed.`);
}

async function runPreflightPhase(config: RemainingLoopConfig) {
  const docErrors = validateCanonicalDocsExist(config);
  if (docErrors.length > 0) throw new Error(docErrors.join("\n"));

  const tree = await runShell("find workflow docs demo src test -maxdepth 3 -type f | sort", {
    logFile: path.join(config.logDir, "preflight.tree.log")
  });
  await writeFile(path.join(config.logDir, "preflight.files.txt"), tree.stdout, "utf8");
}

async function writeLoopSummary(config: RemainingLoopConfig) {
  const status = await runShell("git status --short");
  const stat = await runShell("git diff --stat");
  await writeFile(
    path.join(config.logDir, "loop-summary.md"),
    [
      `# ${config.title} Summary`,
      "",
      "## Git status",
      "```",
      status.stdout.trim() || "clean",
      "```",
      "",
      "## Git diff stat",
      "```",
      stat.stdout.trim() || "no diff",
      "```"
    ].join("\n"),
    "utf8"
  );
}
