#!/usr/bin/env bash
set -euo pipefail

sha="${1:?Usage: same-app-preview.sh <commit> [seconds to wait]}"
wait="${2:-1200}"
candidates=50

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

same_app() {
  git diff --quiet "$1" "$sha" 2>/dev/null ||
    VERCEL_ENV=preview VERCEL_GIT_PREVIOUS_SHA="$1" VERCEL_GIT_COMMIT_SHA="$sha" \
      bash tools/vercel/ignore-build.sh >/dev/null 2>&1
}

find_preview() {
  local url candidate
  url=$(preview_url "$sha")
  if [ -n "$url" ]; then
    echo "Testing the preview of $sha: $url" >&2
    echo "$url"
    return 0
  fi
  for candidate in $(gh api "repos/$GITHUB_REPOSITORY/deployments?environment=Preview&per_page=$candidates" --jq '.[].sha' | awk '!seen[$0]++'); do
    if [ "$candidate" = "$sha" ] || ! same_app "$candidate"; then
      continue
    fi
    url=$(preview_url "$candidate")
    if [ -n "$url" ]; then
      echo "Vercel skipped the preview of $sha. Testing the preview of $candidate, which runs the same app and the same e2e tests: $url" >&2
      echo "$url"
      return 0
    fi
  done
  return 1
}

deadline=$((SECONDS + wait))
found_deadline=
while :; do
  state=$(gh api "repos/$GITHUB_REPOSITORY/commits/$sha/status" --jq '.statuses[] | select(.context == "Vercel") | .state')
  case "$state" in
    failure | error)
      echo "::error::The Vercel deployment of $sha failed. Fix the build, or redeploy it in Vercel, then run this job again." >&2
      exit 1
      ;;
    success)
      if find_preview; then
        exit 0
      fi
      found_deadline=${found_deadline:-$((SECONDS + 120))}
      if [ "$SECONDS" -ge "$found_deadline" ]; then
        echo "::error::Vercel is done with $sha, but none of the last $candidates previews runs its app. Redeploy the preview of $sha in Vercel, then run this job again." >&2
        exit 1
      fi
      echo "Vercel is done with $sha. Waiting for its preview to be listed" >&2
      ;;
    *)
      echo "Waiting for the Vercel deployment of $sha (${state:-no status yet})" >&2
      ;;
  esac
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::error::Vercel did not finish the deployment of $sha in $wait seconds. Redeploy it in Vercel, then run this job again." >&2
    exit 1
  fi
  sleep 15
done
