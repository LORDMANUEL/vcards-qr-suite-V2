#!/usr/bin/env bash
set -euo pipefail
# Read-only quality preflight. No SSH, migrations or writes to the DB.
echo "VCards consolidated release preflight"
git rev-parse --show-toplevel
git rev-parse HEAD
git status --short
node --version
npm --version
npm run typecheck
npm test
npm run lint
npm run build
echo "Local checks completed; staging/QR printer/role tests remain required."
