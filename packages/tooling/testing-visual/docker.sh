#!/usr/bin/env bash
set -euo pipefail

project=$PWD
root=$project
until [ -f "$root/pnpm-workspace.yaml" ]; do
  if [ "$root" = / ]; then
    echo "Run visual-docker from a package of the workspace" >&2
    exit 1
  fi
  root=$(dirname "$root")
done
cd "$root"

version=$(sed -n -E 's/^  playwright@([0-9.]+):$/\1/p' pnpm-lock.yaml | head -n 1)
image="mcr.microsoft.com/playwright:v${version}-noble"

exec docker run --rm --ipc=host \
  --user "$(id -u):$(id -g)" \
  -e CI=true \
  -e HOME=/tmp \
  -v "$root":/work \
  -w "/work/${project#"$root"/}" \
  "$image" \
  node /work/node_modules/vitest/vitest.mjs run --config vitest.visual.config.ts "$@"
