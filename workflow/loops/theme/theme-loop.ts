import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { THEME_LOOP_CONFIG, THEME_LOOP_PHASES } from "./theme-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(THEME_LOOP_CONFIG, THEME_LOOP_PHASES, validateRemainingLoopPhase).catch(
  async (error) => {
    console.error(error);
    process.exit(1);
  },
);
