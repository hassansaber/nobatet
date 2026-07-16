#!/usr/bin/env bash
set -euo pipefail

echo "[liara_pre_build] running database migrations..."
npm run migrate
echo "[liara_pre_build] migrations done."
