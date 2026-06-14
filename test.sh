#!/usr/bin/env bash

set -e
DIR=$(cd "$(dirname "$0")" && pwd)
cd "$DIR"
set -x

./sh/check.js
bun x oxfmt --check '!lib/**'
bun minify.js
bun x oxlint
bun test test/render-yml.test.mjs
bun test test/svg-output.test.mjs
bun test test/render-speed.test.mjs
bun test test/compare.test.js --only-failures
