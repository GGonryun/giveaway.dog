#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo 'Usage: publish-badges.sh <commit message> <command> [args...]' >&2
  echo 'The command runs with the badges folder as its last argument.' >&2
  exit 1
fi

message=$1
shift
dir="$RUNNER_TEMP/badges"
retries=3

for attempt in $(seq 0 "$retries"); do
  rm -rf "$dir"
  git init --quiet --initial-branch badges "$dir"
  git -C "$dir" remote add origin "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
  if git -C "$dir" ls-remote --exit-code --heads origin badges > /dev/null; then
    git -C "$dir" fetch --quiet origin badges
    git -C "$dir" checkout --quiet -B badges FETCH_HEAD
  fi
  "$@" "$dir"
  rm -f "$dir/coverage.svg" "$dir/property-coverage.svg"
  echo '{ "git": { "deploymentEnabled": false } }' > "$dir/vercel.json"
  git -C "$dir" add --all
  git -C "$dir" -c user.name='github-actions[bot]' \
    -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
    commit --quiet --message "$message"
  if git -C "$dir" push --quiet origin badges; then
    exit 0
  fi
  if [ "$attempt" -lt "$retries" ]; then
    echo "::warning::The push to badges was refused. Fetching the branch again ($((attempt + 1)) of $retries)."
  fi
done

echo "::error::The push to badges was refused $((retries + 1)) times."
exit 1
