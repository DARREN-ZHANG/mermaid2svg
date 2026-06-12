import { existsSync, readFileSync } from "node:fs";
import { hashFile, listFilesRecursive } from "./fs-utils";
import { runShell } from "./shell";
import type { BaselineSnapshot, PackageSnapshot } from "./types";

export async function ensureGitBranch(branchName: string, logFile: string) {
  const status = await runShell("git status --short", { logFile });
  if (status.code !== 0) return status;

  const current = await runShell("git branch --show-current");
  const currentBranch = current.stdout.trim();
  if (currentBranch === branchName) return status;

  const exists = await runShell(`git rev-parse --verify ${branchName}`);
  if (exists.code === 0) {
    return await runShell(`git checkout ${branchName}`, { logFile });
  }

  return await runShell(`git checkout -b ${branchName}`, { logFile });
}

export async function gitStatusShort(): Promise<string> {
  const result = await runShell("git status --short");
  return result.stdout.trim();
}

export async function gitDiffNameStatus(): Promise<string[]> {
  const result = await runShell("git diff --name-status");
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function gitDiffStat(): Promise<string> {
  const result = await runShell("git diff --stat");
  return result.stdout.trim();
}

export async function getChangedFiles(): Promise<string[]> {
  const result = await runShell("git diff --name-only");
  return result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function getDeletedFiles(): Promise<string[]> {
  const lines = await gitDiffNameStatus();
  return lines
    .filter((line) => line.startsWith("D\t"))
    .map((line) => line.replace(/^D\t/, ""));
}

export function createBaselineSnapshot(): BaselineSnapshot {
  return {
    packageJson: readPackageSnapshot(),
    specHash: hashFile("../docs/mermaid-svg-spec.md"),
    acceptanceHash: hashFile("../docs/acceptance-criteria.md"),
    architectureHash: hashFile("../docs/mermaid-svg-architecture.md"),
    fileList: listFilesRecursive(".")
  };
}

export function readPackageSnapshot(): PackageSnapshot | null {
  if (!existsSync("package.json")) return null;
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
  return {
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    optionalDependencies: pkg.optionalDependencies ?? {}
  };
}
