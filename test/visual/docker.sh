#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

version=$(sed -n -E 's/^  playwright@([0-9.]+):$/\1/p' pnpm-lock.yaml | head -n 1)
image="mcr.microsoft.com/playwright:v${version}-noble"

exec docker run --rm --ipc=host \
  --user "$(id -u):$(id -g)" \
  -e CI=true \
  -e HOME=/tmp \
  -v "$PWD":/work \
  -w /work \
  "$image" \
  node node_modules/vitest/vitest.mjs run --config vitest.visual.config.ts "$@"
