import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { I18N_LOOP_CONFIG, I18N_LOOP_PHASES } from "./i18n-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(I18N_LOOP_CONFIG, I18N_LOOP_PHASES, validateRemainingLoopPhase).catch(async (error) => {
  console.error(error);
  process.exit(1);
});
