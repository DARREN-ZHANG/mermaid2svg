import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { LoopState } from "./types";

export function defaultState(loopName: string): LoopState {
  return {
    loop: loopName,
    status: "pending",
    currentPhase: null,
    attempts: {},
    completedPhases: [],
    blockedReason: null,
    startedAt: null,
    finishedAt: null,
  };
}

export async function loadState(stateFile: string, loopName: string): Promise<LoopState> {
  if (!existsSync(stateFile)) return defaultState(loopName);
  const raw = await readFile(stateFile, "utf8");
  return JSON.parse(raw) as LoopState;
}

export async function saveState(stateFile: string, state: LoopState): Promise<void> {
  await mkdir(path.dirname(stateFile), { recursive: true });
  await writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
}

export function markPhaseComplete(state: LoopState, phaseId: string): LoopState {
  return {
    ...state,
    currentPhase: null,
    completedPhases: [...new Set([...state.completedPhases, phaseId])],
  };
}

export function incrementAttempt(state: LoopState, phaseId: string): LoopState {
  return {
    ...state,
    currentPhase: phaseId,
    status: "running",
    blockedReason: null,
    finishedAt: null,
    attempts: {
      ...state.attempts,
      [phaseId]: (state.attempts[phaseId] ?? 0) + 1,
    },
    startedAt: state.startedAt ?? new Date().toISOString(),
  };
}
