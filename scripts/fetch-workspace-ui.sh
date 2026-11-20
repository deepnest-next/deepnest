#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
#
# Install the workspace UI (deepnest-next/workspace-ui) release pinned in workspace-ui.lock
# into workspace/ui/dist (the Electron workspace window). Bun is NOT needed.
#
#   bash scripts/fetch-workspace-ui.sh                       # download + verify the pinned release
#   WORKSPACE_UI_DIST=../workspace-ui/dist/electron bash scripts/fetch-workspace-ui.sh
#                                                  # dev: use a local build instead
#
# Download uses `gh` when it is logged in, otherwise curl with $GITHUB_TOKEN (CI).
set -euo pipefail

TARGET=electron
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/workspace/ui/dist"
# shellcheck source=/dev/null
source "$ROOT/workspace-ui.lock"
VERSION="$WORKSPACE_UI_VERSION"
SHA_VAR="WORKSPACE_UI_SHA256_${TARGET}"
EXPECTED="${!SHA_VAR}"
ASSET="workspace-ui-${TARGET}-${VERSION}.tar.gz"
REPO=deepnest-next/workspace-ui

rm -rf "$OUT" && mkdir -p "$OUT"

if [[ -n "${WORKSPACE_UI_DIST:-}" ]]; then
  cp -R "$WORKSPACE_UI_DIST"/. "$OUT"/
  echo "workspace-ui: copied local build from $WORKSPACE_UI_DIST"
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh release download "v$VERSION" --repo "$REPO" --pattern "$ASSET" --dir "$TMP"
elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
  api="https://api.github.com/repos/$REPO/releases/tags/v$VERSION"
  id="$(curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" "$api" |
    python3 -c "import sys,json; print([a['id'] for a in json.load(sys.stdin)['assets'] if a['name']=='$ASSET'][0])")"
  curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/octet-stream" \
    "https://api.github.com/repos/$REPO/releases/assets/$id" -o "$TMP/$ASSET"
else
  echo "workspace-ui: need 'gh auth login' or GITHUB_TOKEN to download $ASSET" >&2
  exit 1
fi

ACTUAL="$(sha256sum "$TMP/$ASSET" | cut -d' ' -f1)"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "workspace-ui: checksum mismatch for $ASSET (expected $EXPECTED, got $ACTUAL)" >&2
  exit 1
fi
tar -xzf "$TMP/$ASSET" -C "$OUT"
echo "workspace-ui: installed $ASSET into ${OUT#"$ROOT"/}"
