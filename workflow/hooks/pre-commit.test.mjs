import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");

test("pre-commit hook uses installed node tooling instead of bun-only commands", () => {
  const hook = read(".husky/pre-commit");

  assert.doesNotMatch(hook, /\bbun\b/);
  assert.doesNotMatch(hook, /(^|\s)\.\/test\.sh(\s|$)/);
  assert.doesNotMatch(hook, /git add -u/);
  assert.match(hook, /pnpm exec lint-staged/);
  assert.match(hook, /node --test workflow\/loops\/init\/init-loop\.test\.mjs/);
  assert.match(hook, /workflow\/loops\/render\/render-loop\.test\.mjs/);
  assert.match(hook, /workflow\/loops\/svg-output\/svg-output-loop\.test\.mjs/);
});

test("lint-staged commands do not require bun", () => {
  const pkg = JSON.parse(read("package.json"));

  for (const [pattern, command] of Object.entries(pkg["lint-staged"])) {
    assert.doesNotMatch(command, /\bbun\b/, pattern);
    assert.match(command, /^node sh\/hook\/.+\.js$/, pattern);
  }
});
