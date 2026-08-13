#!/usr/bin/env sh

set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
manifest_path="$project_dir/manifest.json"

if [ ! -f "$manifest_path" ]; then
  echo "manifest.json was not found in the project root." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || ! command -v zip >/dev/null 2>&1 || ! command -v unzip >/dev/null 2>&1; then
  echo "release.sh requires node, zip, and unzip." >&2
  exit 1
fi

version=$(node -e 'const fs = require("node:fs"); process.stdout.write(JSON.parse(fs.readFileSync(process.argv[1], "utf8")).version)' "$manifest_path")
archive_dir="$project_dir/dist"
archive_path="$archive_dir/yahoo-mail-ui-enhancer-$version.zip"

mkdir -p "$archive_dir"
rm -f "$archive_path"

cd "$project_dir"
zip -qr "$archive_path" . \
  -x '.git/*' \
  -x 'dist/*' \
  -x 'build/*' \
  -x 'node_modules/*' \
  -x 'coverage/*' \
  -x 'test/*' \
  -x 'tests/*' \
  -x '*.test.js' \
  -x '*.spec.js' \
  -x '*.map' \
  -x '.env' \
  -x '.env.*' \
  -x '*.key' \
  -x '*.pem' \
  -x '*.p12' \
  -x '*.pfx' \
  -x '*secret*' \
  -x '*credential*' \
  -x '.DS_Store'

if ! unzip -Z1 "$archive_path" | grep -qx 'manifest.json'; then
  echo "Release archive must contain manifest.json at its root." >&2
  exit 1
fi

if unzip -Z1 "$archive_path" | grep -E '(^|/)(\.git|test|tests)(/|$)|\.map$|(^|/)\.env(\.|$)|\.(key|pem|p12|pfx)$|secret|credential' >/dev/null; then
  echo "Release archive contains an excluded file." >&2
  exit 1
fi

echo "Created $archive_path"
