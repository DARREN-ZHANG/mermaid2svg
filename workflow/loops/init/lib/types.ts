export type PhaseKind = "shell" | "opencode";

export type PhaseDefinition = {
  id: string;
  kind: PhaseKind;
  description: string;
  maxAttempts: number;
  promptFile: string | null;
  requiredArtifacts: string[];
};

export type LoopStatus =
  | "pending"
  | "running"
  | "needs_human"
  | "failed"
  | "completed";

export type LoopState = {
  loop: string;
  status: LoopStatus;
  currentPhase: string | null;
  attempts: Record<string, number>;
  completedPhases: string[];
  blockedReason: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export type HumanGateResult = {
  blocked: boolean;
  reason: string | null;
  details: string[];
};

export type ShellResult = {
  command: string;
  code: number | null;
  stdout: string;
  stderr: string;
};

export type PackageSnapshot = {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
};

export type BaselineSnapshot = {
  packageJson: PackageSnapshot | null;
  specHash: string | null;
  acceptanceHash: string | null;
  architectureHash: string | null;
  fileList: string[];
};
