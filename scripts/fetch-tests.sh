#!/bin/sh

# Fetches the water management journey tests co-located in grants-config-water-management
# (test/grants-ui), along with the GAS schema they validate against, at the
# latest config release tag. Mirrors how grants-ui resolves WATER_MANAGEMENT_TAG in
# tools/docker-compose-smoke-test.sh. Set WATER_TAG to pin a release.

set -e

REPO="DEFRA/grants-config-water-management"
DEST=".water-management-config"

# On CDP, outbound traffic to GitHub must go via the egress proxy. Scoped to
# these curl calls so the browser's route to grants-ui is unaffected.
PROXY="${CDP_HTTPS_PROXY:-$CDP_HTTP_PROXY}"

fetch() {
  if [ -n "$PROXY" ]; then
    curl -sSfL --ssl-no-revoke --proxy "$PROXY" "$@"
  else
    curl -sSfL --ssl-no-revoke "$@"
  fi
}

if [ -z "$WATER_MANAGEMENT_TAG" ]; then
  TAGS=$(fetch "https://api.github.com/repos/$REPO/tags") || {
    echo "Error: Could not fetch water tags from GitHub"
    exit 1
  }
  WATER_MANAGEMENT_TAG=$(printf '%s' "$TAGS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d)[0]?.name ?? '')}catch{}})")
fi

if [ -z "$WATER_MANAGEMENT_TAG" ]; then
  echo "Error: Could not fetch water management tag"
  exit 1
fi

echo "Using water management journey tests at version $WATER_MANAGEMENT_TAG"
ARCHIVE="$(mktemp)"
fetch "https://codeload.github.com/$REPO/tar.gz/refs/tags/$WATER_MANAGEMENT_TAG" -o "$ARCHIVE" || {
  echo "Error: Could not download grants-config-water-management $WATER_MANAGEMENT_TAG"
  rm -f "$ARCHIVE"
  exit 1
}
rm -rf "$DEST"
mkdir -p "$DEST"
tar -xzf "$ARCHIVE" --strip-components=1 -C "$DEST"
rm -f "$ARCHIVE"
echo "Saved to $DEST"
