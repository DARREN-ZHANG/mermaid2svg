import { runRemainingLoop } from "../remaining/lib/runner.ts";
import { FINAL_AUDIT_LOOP_CONFIG, FINAL_AUDIT_LOOP_PHASES } from "./final-audit-loop.config.ts";
import { validateRemainingLoopPhase } from "./lib/validators.ts";

runRemainingLoop(FINAL_AUDIT_LOOP_CONFIG, FINAL_AUDIT_LOOP_PHASES, validateRemainingLoopPhase).catch(async (error) => {
  console.error(error);
  process.exit(1);
});
