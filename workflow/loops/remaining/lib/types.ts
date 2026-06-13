import type { PhaseDefinition } from "../../init/lib/types.ts";

export type RemainingLoopConfig = {
  loopName: string;
  title: string;
  stateFile: string;
  logDir: string;
  reportDir: string;
  docsDir: string;
  maxPhaseAttempts: number;
  canonicalDocs: readonly string[];
  canonicalDocFallbacks: readonly string[];
  requiredInputs: readonly string[];
  requiredFinalArtifacts: readonly string[];
  blockedPatterns: readonly string[];
  forbiddenScope: string;
};

export type RemainingLoopDefinition = {
  config: RemainingLoopConfig;
  phases: PhaseDefinition[];
  validatePhase: (phase: PhaseDefinition) => import("../../init/lib/types.ts").ValidationResult;
};
