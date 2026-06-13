import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ShellResult } from "./types";

export async function runShell(
  command: string,
  options: {
    cwd?: string;
    logFile?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
  } = {},
): Promise<ShellResult> {
  const cwd = options.cwd ?? process.cwd();
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;

  return await new Promise<ShellResult>((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, ...options.env },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGTERM");
        const result = {
          command,
          code: 124,
          stdout,
          stderr: `${stderr}\nCommand timed out after ${timeoutMs}ms.`,
        };
        void persistLog(options.logFile, result).finally(() => resolve(result));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const result = { command, code, stdout, stderr };
      void persistLog(options.logFile, result).finally(() => resolve(result));
    });
  });
}

async function persistLog(logFile: string | undefined, result: ShellResult) {
  if (!logFile) return;
  await mkdir(path.dirname(logFile), { recursive: true });
  await writeFile(
    logFile,
    [
      `$ ${result.command}`,
      `exit_code=${result.code}`,
      "",
      "--- stdout ---",
      result.stdout,
      "",
      "--- stderr ---",
      result.stderr,
    ].join("\n"),
    "utf8",
  );
}
