import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { INIT_LOOP_CONFIG, INIT_LOOP_PHASES } from "./init-loop.config";
import { createBaselineSnapshot } from "./lib/git";
import { evaluateHumanGate } from "./lib/human-gates";
import { runOpenCodePhase } from "./lib/opencode-runner";
import { writeLoopSummary, writeNeedsHuman, writePhaseFailure } from "./lib/report";
import { runShell } from "./lib/shell";
import { incrementAttempt, loadState, markPhaseComplete, saveState } from "./lib/state";
import type { BaselineSnapshot, PhaseDefinition, ValidationResult } from "./lib/types";
import { validatePhase } from "./lib/validators";

async function main() {
  await mkdir(INIT_LOOP_CONFIG.logDir, { recursive: true });
  await mkdir(INIT_LOOP_CONFIG.snapshotDir, { recursive: true });
  await mkdir("docs/init", { recursive: true });
  await mkdir("test", { recursive: true });

  let state = await loadState(INIT_LOOP_CONFIG.stateFile, INIT_LOOP_CONFIG.loopName);
  const baseline = createBaselineSnapshot();
  await writeFile(
    path.join(INIT_LOOP_CONFIG.snapshotDir, "baseline.json"),
    JSON.stringify(baseline, null, 2),
    "utf8"
  );

  for (const phase of INIT_LOOP_PHASES) {
    if (state.completedPhases.includes(phase.id)) continue;

    const maxAttempts = phase.maxAttempts ?? INIT_LOOP_CONFIG.maxPhaseAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      state = incrementAttempt(state, phase.id);
      await saveState(INIT_LOOP_CONFIG.stateFile, state);

      console.log(`\n=== Init Loop Phase: ${phase.id} / attempt ${attempt} ===`);

      if (phase.kind === "shell") {
        await runPreflightPhase(phase);
      } else {
        if (!phase.promptFile) throw new Error(`Missing promptFile for phase ${phase.id}`);
        await runOpenCodePhase({
          phaseId: phase.id,
          promptFile: phase.promptFile,
          logDir: INIT_LOOP_CONFIG.logDir
        });
      }

      const humanGate = await evaluateHumanGate(phase);
      if (humanGate.blocked) {
        await writeNeedsHuman(INIT_LOOP_CONFIG.logDir, phase, humanGate);
        state.status = "needs_human";
        state.blockedReason = humanGate.reason;
        await saveState(INIT_LOOP_CONFIG.stateFile, state);
        console.error(`Human gate triggered during ${phase.id}. See ${INIT_LOOP_CONFIG.logDir}/needs-human.md`);
        process.exit(2);
      }

      const validation = await validatePhaseWithPreflight(phase, baseline);
      if (validation.ok) {
        state = markPhaseComplete(state, phase.id);
        await saveState(INIT_LOOP_CONFIG.stateFile, state);
        console.log(`Phase passed: ${phase.id}`);
        break;
      }

      await writePhaseFailure(INIT_LOOP_CONFIG.logDir, phase, attempt, validation);
      console.warn(`Phase failed validation: ${phase.id}`);
      for (const error of validation.errors) console.warn(`- ${error}`);

      if (attempt === maxAttempts) {
        state.status = "needs_human";
        state.blockedReason = `Phase ${phase.id} failed after ${attempt} attempts`;
        await saveState(INIT_LOOP_CONFIG.stateFile, state);
        console.error(`Phase failed after max attempts: ${phase.id}`);
        process.exit(1);
      }
    }
  }

  state.status = "completed";
  state.currentPhase = null;
  state.finishedAt = new Date().toISOString();
  await saveState(INIT_LOOP_CONFIG.stateFile, state);
  await writeLoopSummary(INIT_LOOP_CONFIG.logDir);
  console.log("Init Loop completed. Repo should be ready for formal task decomposition.");
}

async function runPreflightPhase(_phase: PhaseDefinition) {
  await mkdir("docs/init", { recursive: true });
  await mkdir("test", { recursive: true });
  await mkdir(INIT_LOOP_CONFIG.logDir, { recursive: true });

  await appendCommandLog(`# preflight ${new Date().toISOString()}`);

  for (const repo of INIT_LOOP_CONFIG.referenceRepos) {
    if (!existsSync(repo.dir)) throw new Error(`Missing local reference repo: ${repo.dir}. Expected ${repo.url}`);
  }

  const tree = await runShell("find . -maxdepth 3 -type f | sort | sed 's#^./##' | head -1000", {
    logFile: path.join(INIT_LOOP_CONFIG.logDir, "preflight.tree.log")
  });
  await writeFile(path.join(INIT_LOOP_CONFIG.snapshotDir, "initial-tree.txt"), tree.stdout, "utf8");
}

async function appendCommandLog(line: string) {
  await mkdir(INIT_LOOP_CONFIG.logDir, { recursive: true });
  const file = path.join(INIT_LOOP_CONFIG.logDir, "commands.log");
  await writeFile(file, `${line}\n`, { flag: "a" });
}

async function validatePhaseWithPreflight(
  phase: PhaseDefinition,
  baseline: BaselineSnapshot
): Promise<ValidationResult> {
  if (phase.id === "preflight") {
    const errors: string[] = [];
    for (const repo of INIT_LOOP_CONFIG.referenceRepos) {
      if (!existsSync(repo.dir)) errors.push(`Missing reference repo: ${repo.dir}`);
    }
    for (const doc of INIT_LOOP_CONFIG.canonicalDocs) {
      if (!existsSync(doc)) errors.push(`Missing canonical doc: ${doc}`);
    }
    return { ok: errors.length === 0, errors, warnings: [] };
  }
  return await validatePhase(phase, baseline);
}

main().catch(async (error) => {
  console.error(error);
  const state = await loadState(INIT_LOOP_CONFIG.stateFile, INIT_LOOP_CONFIG.loopName);
  state.status = "failed";
  state.blockedReason = (error as Error).message;
  state.finishedAt = new Date().toISOString();
  await saveState(INIT_LOOP_CONFIG.stateFile, state);
  process.exit(1);
});
