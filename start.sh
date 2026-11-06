#!/usr/bin/env bash
# See the Kognivo site on this computer: ./start.sh  (then it opens http://localhost:3000)
# Needs Node 20.9 or newer. Ctrl+C stops it.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci --no-audit --no-fund
# rebuild when any source file is newer than the last build
if [ ! -f .next/BUILD_ID ] || [ -n "$(find app components lib public -newer .next/BUILD_ID -print -quit)" ]; then npm run build; fi
( sleep 2; xdg-open http://localhost:3000 >/dev/null 2>&1 || open http://localhost:3000 >/dev/null 2>&1 || true ) &
exec npm start
