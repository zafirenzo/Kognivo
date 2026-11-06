#!/usr/bin/env bash
# See the Kognivo site on this computer: ./start.sh  (then it opens http://localhost:3000)
# Needs Node 20.9 or newer. Ctrl+C stops it.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci --no-audit --no-fund
# rebuild when any source file is newer than the last build
if [ ! -f .next/BUILD_ID ] || [ -n "$(find app components lib public -newer .next/BUILD_ID -print -quit)" ]; then npm run build; fi
# stop an older copy of this site that is still running, so the browser never sees a stale version
for pid in $(pgrep -f "next start|next-server" || true); do
  [ "$(readlink -f /proc/$pid/cwd 2>/dev/null)" = "$(pwd -P)" ] && kill "$pid" 2>/dev/null && echo "Stopped the older copy (pid $pid)." || true
done
sleep 1
if (exec 3<>/dev/tcp/127.0.0.1/3000) 2>/dev/null; then
  echo "Something else is using port 3000. Close it (Ctrl+C in its terminal) and run ./start.sh again."; exit 1
fi
( sleep 2; xdg-open http://localhost:3000 >/dev/null 2>&1 || open http://localhost:3000 >/dev/null 2>&1 || true ) &
exec npm start
