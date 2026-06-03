#!/usr/bin/env bash
# Run a full build and confirm that key output pages exist.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Building site..."
bundle exec jekyll build

echo "==> Checking output pages..."
pages=(
  _site/index.html
  _site/group/index.html
  _site/contact/index.html
  _site/publications/index.html
  _site/research/index.html
  _site/media/index.html
  _site/collaboration/index.html
  _site/assets/css/sulkowska.css
  _site/assets/js/sulkowska.js
)

ok=0
fail=0
for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    echo "  OK  $page"
    (( ok++ )) || true
  else
    echo "  MISSING  $page" >&2
    (( fail++ )) || true
  fi
done

echo "==> $ok OK, $fail missing"
[ "$fail" -eq 0 ]
