import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { DEPLOY_LOOP_CONFIG, DEPLOY_LOOP_PHASES } from "./deploy-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(DEPLOY_LOOP_CONFIG, DEPLOY_LOOP_PHASES, validateRemainingLoopPhase).catch(
  async (error) => {
    console.error(error);
    process.exit(1);
  },
);
