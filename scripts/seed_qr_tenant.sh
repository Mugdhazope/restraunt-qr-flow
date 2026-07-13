#!/usr/bin/env bash
# One-shot Phase 1 seed helpers for QR go-live (local docker or prod container).
# Usage:
#   ./scripts/seed_qr_tenant.sh                           # local compose
#   ./scripts/seed_qr_tenant.sh --compose dokploy          # print prod instructions
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${QR_SLUG:-dough-joe}"
NAME="${QR_NAME:-Dough & Joe}"
EMAIL="${QR_STAFF_EMAIL:-}"
PASSWORD="${QR_STAFF_PASSWORD:-}"

MODE="${1:-local}"

cmd=(python manage.py bootstrap_qr_tenant --slug "$SLUG" --name "$NAME")
if [[ -n "$EMAIL" ]]; then
  if [[ -z "$PASSWORD" ]]; then
    echo "Set QR_STAFF_PASSWORD when QR_STAFF_EMAIL is set" >&2
    exit 1
  fi
  cmd+=(--staff-email "$EMAIL" --staff-password "$PASSWORD")
fi

if [[ "$MODE" == "local" || "$MODE" == "--local" ]]; then
  cd "$ROOT/backend"
  docker compose -f docker-compose.local.yml exec -T django "${cmd[@]}"
  echo ""
  echo "Print QR from dashboard → QR & Entry Flow (after VITE_PUBLIC_APP_ORIGIN is set for prod builds)."
  echo "Local API smoke:"
  echo "  $ROOT/scripts/smoke_qr_production.sh http://127.0.0.1:8000 $SLUG"
elif [[ "$MODE" == "dokploy" || "$MODE" == "--compose" || "$MODE" == "--dokploy" ]]; then
  echo "Run inside the production django container (Dokploy → terminal / exec):"
  echo "  ${cmd[*]}"
  echo ""
  echo "Then:"
  echo "  1. Log into dashboard, upload menu images (confirm CloudFront URLs)"
  echo "  2. Open QR & Entry Flow — print only if origin is NOT localhost"
  echo "  3. ./scripts/smoke_qr_production.sh https://YOUR_DOMAIN $SLUG"
  echo "  4. Phone (cellular): /scan/$SLUG/menu → detail → optional check-in"
else
  echo "Usage: $0 [local|dokploy]" >&2
  exit 1
fi
