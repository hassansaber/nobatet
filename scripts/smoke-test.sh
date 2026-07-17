#!/usr/bin/env bash
# تست دود سراسری APIهای حیاتی
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"

echo "▶ health"
curl -sf "$BASE/api/health" | head -c 120
echo

echo "▶ public business demo"
curl -sf "$BASE/api/public/businesses/demo" | head -c 80
echo

echo "▶ public plans"
curl -sf "$BASE/api/public/plans" | head -c 80
echo

echo "▶ owner login"
curl -sf -c /tmp/smoke-own.txt -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"09120000001","password":"123456"}' | head -c 120
echo

echo "▶ business bookings"
curl -sf -b /tmp/smoke-own.txt "$BASE/api/business/bookings" | head -c 80
echo

echo "▶ business reports"
curl -sf -b /tmp/smoke-own.txt "$BASE/api/business/reports?days=30" | head -c 80
echo

echo "▶ admin login"
curl -sf -c /tmp/smoke-ad.txt -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"09120000000","password":"123456"}' | head -c 80
echo

echo "▶ admin overview"
curl -sf -b /tmp/smoke-ad.txt "$BASE/api/admin/overview" | head -c 100
echo

echo "▶ visitor login + me"
curl -sf -c /tmp/smoke-vi.txt -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"phone":"09120000004","password":"123456"}' > /dev/null
curl -sf -b /tmp/smoke-vi.txt "$BASE/api/visitor/me" | head -c 100
echo

echo "▶ pages"
for p in / /demo /pricing / /demo; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$p")
  echo "  $p → $code"
done

echo "✅ smoke OK"
