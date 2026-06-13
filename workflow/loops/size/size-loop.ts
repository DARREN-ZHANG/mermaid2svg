import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { SIZE_LOOP_CONFIG, SIZE_LOOP_PHASES } from "./size-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(SIZE_LOOP_CONFIG, SIZE_LOOP_PHASES, validateRemainingLoopPhase).catch(async (error) => {
  console.error(error);
  process.exit(1);
});
