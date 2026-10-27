#!/usr/bin/env bash
# Builds with the mock switched off and fails if any mock-only string survives.
set -euo pipefail

out=$(mktemp -d)
trap 'rm -rf "$out"' EXIT

VITE_USE_MOCK=false VITE_DEMO_PIN=000999 VITE_API_BASE_URL=https://api.example.invalid \
  bunx vite build --outDir "$out" --emptyOutDir --logLevel warn

status=0
for needle in 000999 kline.mock.lockout '9440 7841 2222 3115' '568-2-81740-9'; do
  if grep -rlF --include='*.js' -- "$needle" "$out"; then
    echo "FOUND in real-backend bundle: $needle" >&2
    status=1
  fi
done
[ "$status" -eq 0 ] && echo 'real-backend bundle is free of mock fixtures'
exit "$status"
