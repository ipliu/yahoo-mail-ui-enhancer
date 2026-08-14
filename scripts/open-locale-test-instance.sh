#!/usr/bin/env sh

set -eu

locale_test_dir="${TMPDIR%/}/yahoo-mail-ui-enhancer-i18n"
chrome_app="/Applications/Google Chrome.app"

case "${1:-}" in
  en|zh-TW|ja) locale="$1" ;;
  *)
    echo "Usage: $0 {en|zh-TW|ja}" >&2
    exit 1
    ;;
esac

if [ ! -d "$chrome_app" ]; then
  echo "Google Chrome was not found at $chrome_app." >&2
  exit 1
fi

if [ -e "$locale_test_dir/SingletonLock" ] || [ -L "$locale_test_dir/SingletonLock" ]; then
  echo "The Locale Test Instance is still running. Open chrome://quit in that instance, wait for it to close, then retry." >&2
  exit 1
fi

mkdir -p "$locale_test_dir"

open -n "$chrome_app" --args \
  "--user-data-dir=$locale_test_dir" \
  --no-first-run \
  -AppleLanguages "($locale)"
