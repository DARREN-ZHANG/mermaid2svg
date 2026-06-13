import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { WEB_DEMO_LOOP_CONFIG, WEB_DEMO_LOOP_PHASES } from "./web-demo-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(WEB_DEMO_LOOP_CONFIG, WEB_DEMO_LOOP_PHASES, validateRemainingLoopPhase).catch(
  async (error) => {
    console.error(error);
    process.exit(1);
  },
);
