# Dokploy go-live checklist (QR Phase 1)

You already have a **Dokploy EC2** and an S3 + CloudFront media path. Completing QR go-live is Dokploy app config + domain + one smoke test.

Full architecture: [`DEPLOY_AWS_DOKPLOY.md`](DEPLOY_AWS_DOKPLOY.md).

## Already provisioned in AWS

| Resource | Value |
| -------- | ----- |
| Dokploy EC2 | `i-0f314cc9b9d3751bd` (ap-south-1) |
| Elastic IP | `3.110.20.17` — point DNS A/AAAA here |
| Dokploy UI | `http://3.110.20.17:3000` |
| Security group | `sg-066dbe122aafc951f`: 80/443(/+v6) public, 3000 Dokploy UI, SSH locked to ops IP |
| S3 media | `doughandjoe-media-prod` (private, versioning, abort incomplete MPU lifecycle) |
| CloudFront | `d24m4yvlxpismq.cloudfront.net` (`E1MS4UJ41ED4YA`) + OAC on `media/*` |
| EC2 instance profile | `doughandjoe-dokploy-ec2` (S3 list/get/put/delete on `media/*`) |

Leave `DJANGO_AWS_ACCESS_KEY_ID` / `SECRET` empty so the container uses the instance role (restart Dokploy app after role attach if uploads fail).

Set `DJANGO_AWS_S3_CUSTOM_DOMAIN=d24m4yvlxpismq.cloudfront.net` (no `https://`).

## Your remaining clicks (Dokploy UI)

1. **Domain** — Point DNS A/AAAA at Elastic IP `3.110.20.17`. Issue TLS in Dokploy.
2. **New compose app** from this monorepo. Prefer compose file: [`backend/docker-compose.dokploy.yml`](../backend/docker-compose.dokploy.yml) (no bundled Traefik).
3. **Dokploy Traefik routes** (same host):
   - `/api`, `/admin`, `/accounts`, `/static` → `django:5000`
   - `/` → `frontend:80`
4. **If you insist on bundled Traefik** — use `backend/docker-compose.production.yml` and run `scripts/set_production_domain.sh YOUR_DOMAIN` first (and do not double-bind :80/:443 with Dokploy).
5. **Env group** — paste from [`backend/.envs/.production/.django.example`](../backend/.envs/.production/.django.example) + [`.postgres.example`](../backend/.envs/.production/.postgres.example); replace every `YOUR_*` / `CHANGE_ME_*`.
6. **Build arg** — `VITE_PUBLIC_APP_ORIGIN=https://YOUR_DOMAIN`.
7. **Deploy** — confirm Django logs show migrate + collectstatic.
8. **Bootstrap tenant** (one-off in django container):

```bash
python manage.py bootstrap_qr_tenant \
  --slug dough-joe \
  --name "Dough & Joe" \
  --staff-email you@example.com \
  --staff-password 'USE_A_STRONG_PASSWORD'
```

9. Upload real menu images in dashboard; confirm `image_url` uses `d24m4yvlxpismq.cloudfront.net`.
10. Print QR from dashboard (must not show localhost warning).
11. Smoke:

```bash
./scripts/smoke_qr_production.sh https://YOUR_DOMAIN dough-joe
# or after local seed:
./scripts/seed_qr_tenant.sh local
./scripts/smoke_qr_production.sh http://127.0.0.1:8000 dough-joe
```

Then scan on a phone (**cellular**): menu → item detail → optional check-in → visit count increments.

**No owned domain yet?** Point a temporary host like `menu.3.110.20.17.sslip.io` (A → `3.110.20.17`), run `scripts/set_production_domain.sh menu.3.110.20.17.sslip.io`, then replace with your real domain later.

## Must-have env keys (QR will break without these)

- `DJANGO_CSRF_TRUSTED_ORIGINS=https://YOUR_DOMAIN,...`
- `DJANGO_ALLOWED_HOSTS=YOUR_DOMAIN,...`
- `CELERY_TASK_ALWAYS_EAGER=True`
- `DJANGO_AWS_STORAGE_BUCKET_NAME=doughandjoe-media-prod`
- `DJANGO_AWS_S3_REGION_NAME=ap-south-1`
- `DJANGO_AWS_S3_CUSTOM_DOMAIN=d24m4yvlxpismq.cloudfront.net`
- `VITE_PUBLIC_APP_ORIGIN=https://YOUR_DOMAIN` (build-time)

## Not required for Phase 1 QR

WhatsApp / MSG91 OTP, Celery worker, BG removal, RDS.
