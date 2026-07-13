#!/usr/bin/env bash
# Smoke-test public QR endpoints on a live Phase 1 deploy.
# Usage: ./scripts/smoke_qr_production.sh https://YOUR_DOMAIN [slug]
set -euo pipefail

ORIGIN="${1:-}"
SLUG="${2:-dough-joe}"
if [[ -z "$ORIGIN" ]]; then
  echo "Usage: $0 https://YOUR_DOMAIN [restaurant-slug]" >&2
  echo "   or: $0 http://127.0.0.1:8000 [slug]   (local API-only; SPA paths may 404)" >&2
  exit 1
fi
if [[ "$ORIGIN" != https://* && "$ORIGIN" != http://127.0.0.1* && "$ORIGIN" != http://localhost* ]]; then
  echo "Origin must be https://… (production) or http://localhost / http://127.0.0.1 (local)" >&2
  exit 1
fi
ORIGIN="${ORIGIN%/}"

fail=0
check() {
  local name="$1" url="$2" expect="$3"
  code="$(curl -sS -o /tmp/qr_smoke_body -w '%{http_code}' --max-time 20 "$url" || echo 000)"
  if [[ "$code" == "$expect" ]]; then
    echo "OK  ${name} (${code})"
  else
    echo "FAIL ${name} got ${code}, want ${expect} — ${url}"
    fail=1
  fi
}

LOCAL_API_ONLY=0
if [[ "$ORIGIN" == http://127.0.0.1* || "$ORIGIN" == http://localhost* ]]; then
  LOCAL_API_ONLY=1
fi

echo "Smoke QR against ${ORIGIN} slug=${SLUG}"
check "csrf" "${ORIGIN}/api/csrf/" "200"
check "public_menu" "${ORIGIN}/api/public/menu/?restaurant_slug=${SLUG}" "200"
check "public_layouts" "${ORIGIN}/api/public/layouts/${SLUG}/" "200"
if [[ "$LOCAL_API_ONLY" -eq 0 ]]; then
  check "spa_root" "${ORIGIN}/" "200"
  check "spa_scan_menu" "${ORIGIN}/scan/${SLUG}/menu" "200"
else
  echo "SKIP spa_* (API-only local origin)"
fi

# Soft checks on menu JSON
if command -v python3 >/dev/null; then
  python3 - <<PY || fail=1
import json, sys
from pathlib import Path
raw = Path("/tmp/qr_smoke_body").read_text()
# last successful was spa — re-fetch menu for count
import urllib.request
url = "${ORIGIN}/api/public/menu/?restaurant_slug=${SLUG}"
data = json.load(urllib.request.urlopen(url, timeout=20))
cats = data.get("categories") or []
n = sum(len(c.get("items") or []) for c in cats)
print(f"OK  menu_items={n} categories={len(cats)}")
if n < 1:
    print("FAIL expected at least 1 menu item")
    sys.exit(1)
PY
fi

if [[ "$fail" -ne 0 ]]; then
  echo "Smoke test FAILED"
  exit 1
fi
echo "Smoke test PASSED — now scan a printed QR on cellular and confirm images + check-in."
