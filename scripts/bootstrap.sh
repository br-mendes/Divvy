#!/usr/bin/env bash
set -euo pipefail

echo "==> Install deps"
npm ci

echo "==> Verify structure/env"
npm run verify

echo "==> Build"
npm run build

echo " Bootstrap OK"
