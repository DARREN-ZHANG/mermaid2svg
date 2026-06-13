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
  assert.match(hook, /workflow\/loops\/remaining\/remaining-loops\.test\.mjs/);
});

test("lint-staged commands do not require bun", () => {
  const pkg = JSON.parse(read("package.json"));

  for (const [pattern, command] of Object.entries(pkg["lint-staged"])) {
    assert.doesNotMatch(command, /\bbun\b/, pattern);
    assert.match(command, /^node sh\/hook\/.+\.js$/, pattern);
  }
});

test("npm test checks formatting without rewriting tracked files", () => {
  const script = read("test.sh");

  assert.match(script, /bun x oxfmt --check '!lib\/\*\*'/);
  assert.doesNotMatch(script, /\bbun x oxfmt\s*$/m);
  assert.doesNotMatch(script, /\bbun x oxfmt --write\b/);
});

test("package scripts expose separate deploy demo and library build entries", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.build, "bun demo/build.js");
  assert.equal(pkg.scripts["build:lib"], "bun minify.js");
  assert.equal(pkg.scripts.extract, "node extract/run.js");
});
