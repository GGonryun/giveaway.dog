ARG NODE_VERSION
FROM node:${NODE_VERSION}-bookworm-slim

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates git openssl zstd \
  && rm -rf /var/lib/apt/lists/* \
  && git config --system --add safe.directory '*' \
  && npm install --global pnpm@10 \
  && npm cache clean --force

COPY workspace/ /opt/ci/workspace/

WORKDIR /opt/ci/workspace

RUN pnpm install --frozen-lockfile \
  && rm -rf "$(pnpm store path)" /root/.cache \
  && awk '/^importers:/ { found = 1; next } /^[^ ]/ { found = 0 } found && /^  [^ ]/ { sub(/^  /, ""); sub(/:$/, ""); print }' pnpm-lock.yaml > /opt/ci/importers \
  && find . -path '*/node_modules' -prune -o -type f -print0 | xargs -0 rm -f \
  && find . -type d -empty -not -path '*/node_modules/*' -delete

WORKDIR /
