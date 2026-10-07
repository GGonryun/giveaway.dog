#!/usr/bin/env bash
set -euo pipefail

sha="${1:?Usage: same-app-preview.sh <commit>}"
limit=50

preview_url() {
  local statuses url
  for statuses in $(gh api "repos/$GITHUB_REPOSITORY/deployments?sha=$1&environment=Preview" --jq '.[].statuses_url'); do
    url=$(gh api "$statuses" --jq 'map(select(.state == "success"))[0].environment_url // empty')
    if [ -n "$url" ]; then
      echo "$url"
      return
    fi
  done
}

for commit in $(git rev-list --max-count="$limit" "$sha"); do
  url=$(preview_url "$commit")
  if [ -z "$url" ]; then
    continue
  fi
  if git diff --quiet "$commit" "$sha" ||
    VERCEL_ENV=preview VERCEL_GIT_PREVIOUS_SHA="$commit" VERCEL_GIT_COMMIT_SHA="$sha" \
      bash tools/vercel/ignore-build.sh >&2; then
    echo "The preview of $commit runs the same app as $sha: $url" >&2
    echo "$url"
    exit 0
  fi
  echo "::error::The last preview before $sha is the one of $commit, and the app changed since. Redeploy the preview of $sha in Vercel." >&2
  exit 1
done

echo "::error::No preview deployment among the last $limit commits up to $sha. Redeploy the preview of $sha in Vercel." >&2
exit 1
