#!/usr/bin/env bash
# Builds a release: the server's sources, its production dependencies and the built page, in one
# tarball that runs with nothing installed but Node. GitHub Actions builds one on every deploy;
# `tools/ops/pack.sh out.tgz` builds one here (from the working tree, uncommitted changes included).
set -euo pipefail

out=$(realpath -m "${1:?usage: pack.sh out.tgz [name]}")
root=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
name=${2:-$(date -u +%Y%m%d-%H%M%S)-$(git -C "$root" rev-parse --short HEAD)}
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

# The working tree as git sees it: tracked and new files, nothing ignored (no node_modules, no dist).
(cd "$root" && git ls-files -z -co --exclude-standard | tar --null -T - -cf -) | tar -x -C "$stage"
cd "$stage"
pnpm install --frozen-lockfile --prefer-offline --reporter=silent
pnpm --filter @idle-clash/web build >/dev/null
# Only what the server runs: its own production dependencies and the packages it imports.
rm -rf node_modules apps/*/node_modules packages/*/node_modules tools/node_modules
pnpm install --prod --frozen-lockfile --prefer-offline --reporter=silent --filter '@idle-clash/server...'

printf '{"name":"%s","commit":"%s","builtAt":"%s"}\n' "$name" "$(git -C "$root" rev-parse HEAD)" \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >RELEASE.json
paths=(RELEASE.json package.json pnpm-workspace.yaml .nvmrc node_modules apps/web/dist tools/ops
  apps/server/package.json apps/server/src apps/server/migrations apps/server/node_modules
  packages/kernel/migrations)
for p in content contracts features kernel; do
  paths+=("packages/$p/package.json" "packages/$p/src" "packages/$p/node_modules")
done
tar -czf "$out" --exclude='tools/ops/tests' "${paths[@]}"
echo "$name"
