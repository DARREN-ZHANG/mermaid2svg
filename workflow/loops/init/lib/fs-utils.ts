import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

export function exists(filePath: string): boolean {
  return existsSync(filePath);
}

export function isDirectory(filePath: string): boolean {
  return existsSync(filePath) && lstatSync(filePath).isDirectory();
}

export function hashFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  const buffer = readFileSync(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

export function readJson<T = unknown>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function listFilesRecursive(root: string): string[] {
  if (!existsSync(root)) return [];
  const result: string[] = [];

  function walk(current: string) {
    const stat = lstatSync(current);
    if (stat.isDirectory()) {
      const basename = path.basename(current);
      if (["node_modules", ".git", "dist", "build", ".next", ".turbo"].includes(basename)) {
        return;
      }
      for (const child of readdirSync(current)) {
        walk(path.join(current, child));
      }
      return;
    }
    result.push(path.relative(process.cwd(), current));
  }

  walk(root);
  return result.sort();
}

export function simpleGlobMatch(filePath: string, pattern: string): boolean {
  const normalize = (input: string) => input.replace(/\\/g, "/");
  const file = normalize(filePath);
  const pat = normalize(pattern);

  if (pat.endsWith("/**")) {
    return file === pat.slice(0, -3) || file.startsWith(pat.slice(0, -3) + "/");
  }
  if (pat.includes("*")) {
    const escaped = pat
      .split("*")
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    return new RegExp(`^${escaped}$`).test(file);
  }
  return file === pat;
}
