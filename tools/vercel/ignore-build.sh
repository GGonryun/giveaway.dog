#!/usr/bin/env bash
set -uo pipefail

build() {
  echo "Build: $1"
  exit 1
}

skip() {
  echo "Skip the build: $1"
  exit 0
}

if [ "${VERCEL_ENV:-}" != "preview" ]; then
  build "this is not a preview deployment"
fi

previous="${VERCEL_GIT_PREVIOUS_SHA:-}"
current="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
if [ -z "$previous" ]; then
  build "this branch has no previous deployment"
fi

if ! git cat-file -e "${previous}^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=1 origin "$previous" 2>/dev/null ||
    build "the commit of the previous deployment ($previous) is not in the clone"
fi

if ! changed=$(git diff --name-only "$previous" "$current"); then
  build "git cannot compare $previous with $current"
fi
if [ -z "$changed" ]; then
  build "no file changed since $previous"
fi

unused='^[^/]+\.md$|^docs/|^\.github/|^\.claude/|(^|/)__tests__/|(^|/)__snapshots__/|(^|/)__screenshots__/|\.test\.[cm]?[jt]sx?$|(^|/)vitest(\.visual)?\.config\.ts$'
used=$(grep -Ev "$unused" <<<"$changed")
if [ -n "$used" ]; then
  echo "Files that need a new preview since $previous:"
  head -n 20 <<<"$used"
  build "a changed file can change the app or its end-to-end tests"
fi

skip "since $previous, only documentation, CI files and tests changed"
