#!/usr/bin/env bash
# Replace YOUR_DOMAIN placeholders for bundled Traefik + print compose build env.
# Usage: ./scripts/set_production_domain.sh menu.yourdomain.com
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" || "$DOMAIN" == *http* ]]; then
  echo "Usage: $0 YOUR_DOMAIN   (e.g. menu.example.com — no https://)" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TRAEFIK="$ROOT/backend/compose/production/traefik/traefik.yml"
DOKPLOY_COMPOSE="$ROOT/backend/docker-compose.dokploy.yml"

if [[ ! -f "$TRAEFIK" ]]; then
  echo "Missing $TRAEFIK" >&2
  exit 1
fi

# Prefer sed that works on macOS + Linux
replace_domain() {
  local file="$1"
  if sed --version >/dev/null 2>&1; then
    sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" "$file"
  else
    sed -i '' "s/YOUR_DOMAIN/${DOMAIN}/g" "$file"
  fi
}

replace_domain "$TRAEFIK"
if [[ -f "$DOKPLOY_COMPOSE" ]]; then
  replace_domain "$DOKPLOY_COMPOSE"
fi

echo "Updated Traefik + Dokploy compose host rules → ${DOMAIN}"
echo ""
echo "DNS A/AAAA → Elastic IP 3.110.20.17 (Dokploy)"
echo ""
echo "Prefer Dokploy Traefik (no port clash):"
echo "  Compose file: backend/docker-compose.dokploy.yml"
echo "  Routes: /api /admin /accounts /static → django:5000 ; / → frontend:80"
echo ""
echo "Set these in Dokploy before deploy:"
echo "  VITE_PUBLIC_APP_ORIGIN=https://${DOMAIN}"
echo "  DJANGO_ALLOWED_HOSTS=${DOMAIN},www.${DOMAIN}"
echo "  DJANGO_CSRF_TRUSTED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}"
echo "  DJANGO_AWS_STORAGE_BUCKET_NAME=doughandjoe-media-prod"
echo "  DJANGO_AWS_S3_REGION_NAME=ap-south-1"
echo "  DJANGO_AWS_S3_CUSTOM_DOMAIN=d24m4yvlxpismq.cloudfront.net"
echo "  CELERY_TASK_ALWAYS_EAGER=True"
echo ""
echo "Only use bundled Traefik (docker-compose.production.yml) if Dokploy is not binding :80/:443."
echo ""
echo "After deploy, smoke-test:"
echo "  ./scripts/smoke_qr_production.sh https://${DOMAIN} dough-joe"
