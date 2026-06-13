import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { runOpenCodePhase } from "../init/lib/opencode-runner.ts";
import { writePhaseFailure } from "../init/lib/report.ts";
import { runShell } from "../init/lib/shell.ts";
import { incrementAttempt, loadState, markPhaseComplete, saveState } from "../init/lib/state.ts";
import type { PhaseDefinition, ValidationResult } from "../init/lib/types.ts";
import { SVG_OUTPUT_LOOP_CONFIG, SVG_OUTPUT_LOOP_PHASES } from "./svg-output-loop.config.ts";
import { validateCanonicalDocsExist, validateSvgOutputPhase } from "./lib/validators.ts";

async function main() {
  await mkdir(SVG_OUTPUT_LOOP_CONFIG.logDir, { recursive: true });
  await mkdir(SVG_OUTPUT_LOOP_CONFIG.reportDir, { recursive: true });
  await mkdir(SVG_OUTPUT_LOOP_CONFIG.docsDir, { recursive: true });

  let state = await loadState(SVG_OUTPUT_LOOP_CONFIG.stateFile, SVG_OUTPUT_LOOP_CONFIG.loopName);

  for (const phase of SVG_OUTPUT_LOOP_PHASES) {
    if (state.completedPhases.includes(phase.id)) continue;

    const maxAttempts = phase.maxAttempts ?? SVG_OUTPUT_LOOP_CONFIG.maxPhaseAttempts;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      state = incrementAttempt(state, phase.id);
      await saveState(SVG_OUTPUT_LOOP_CONFIG.stateFile, state);

      console.log(`\n=== SVG Output Loop Phase: ${phase.id} / attempt ${attempt} ===`);

      if (phase.kind === "shell") {
        await runPreflightPhase(phase);
      } else {
        if (!phase.promptFile) throw new Error(`Missing promptFile for phase ${phase.id}`);
        await runOpenCodePhase({
          phaseId: phase.id,
          promptFile: phase.promptFile,
          logDir: SVG_OUTPUT_LOOP_CONFIG.logDir,
          loopTitle: "SVG Output Loop",
        });
      }

      const validation = await validatePhaseWithPreflight(phase);
      if (validation.ok) {
        state = markPhaseComplete(state, phase.id);
        await saveState(SVG_OUTPUT_LOOP_CONFIG.stateFile, state);
        console.log(`Phase passed: ${phase.id}`);
        break;
      }

      await writePhaseFailure(SVG_OUTPUT_LOOP_CONFIG.logDir, phase, attempt, validation);
      console.warn(`Phase failed validation: ${phase.id}`);
      for (const error of validation.errors) console.warn(`- ${error}`);

      if (attempt === maxAttempts) {
        state.status = "needs_human";
        state.blockedReason = `Phase ${phase.id} failed after ${attempt} attempts`;
        await saveState(SVG_OUTPUT_LOOP_CONFIG.stateFile, state);
        process.exit(1);
      }
    }
  }

  state.status = "completed";
  state.currentPhase = null;
  state.finishedAt = new Date().toISOString();
  await saveState(SVG_OUTPUT_LOOP_CONFIG.stateFile, state);
  await writeSvgOutputLoopSummary();
  console.log(
    "SVG Output Loop completed. Stable SVG output compatibility artifacts should be ready for demo work.",
  );
}

async function runPreflightPhase(_phase: PhaseDefinition) {
  await appendCommandLog(`# preflight ${new Date().toISOString()}`);
  const docErrors = validateCanonicalDocsExist();
  if (docErrors.length > 0) throw new Error(docErrors.join("\n"));

  for (const file of SVG_OUTPUT_LOOP_CONFIG.renderInputs) {
    if (!existsSync(file)) throw new Error(`Missing svg-output-loop input: ${file}`);
  }

  const tree = await runShell(
    "find src test workflow/loops/svg-output workflow/reports -maxdepth 3 -type f | sort",
    {
      logFile: path.join(SVG_OUTPUT_LOOP_CONFIG.logDir, "preflight.tree.log"),
    },
  );
  await writeFile(
    path.join(SVG_OUTPUT_LOOP_CONFIG.logDir, "preflight.files.txt"),
    tree.stdout,
    "utf8",
  );
}

async function validatePhaseWithPreflight(phase: PhaseDefinition): Promise<ValidationResult> {
  return validateSvgOutputPhase(phase);
}

async function appendCommandLog(line: string) {
  await mkdir(SVG_OUTPUT_LOOP_CONFIG.logDir, { recursive: true });
  const file = path.join(SVG_OUTPUT_LOOP_CONFIG.logDir, "commands.log");
  await writeFile(file, `${line}\n`, { flag: "a" });
}

async function writeSvgOutputLoopSummary() {
  const status = await runShell("git status --short");
  const stat = await runShell("git diff --stat");
  await writeFile(
    path.join(SVG_OUTPUT_LOOP_CONFIG.logDir, "loop-summary.md"),
    [
      "# SVG Output Loop Summary",
      "",
      "## Git status",
      "```",
      status.stdout.trim() || "clean",
      "```",
      "",
      "## Git diff stat",
      "```",
      stat.stdout.trim() || "no diff",
      "```",
    ].join("\n"),
    "utf8",
  );
}

main().catch(async (error) => {
  console.error(error);
  const state = await loadState(SVG_OUTPUT_LOOP_CONFIG.stateFile, SVG_OUTPUT_LOOP_CONFIG.loopName);
  state.status = "failed";
  state.blockedReason = (error as Error).message;
  state.finishedAt = new Date().toISOString();
  await saveState(SVG_OUTPUT_LOOP_CONFIG.stateFile, state);
  process.exit(1);
});
