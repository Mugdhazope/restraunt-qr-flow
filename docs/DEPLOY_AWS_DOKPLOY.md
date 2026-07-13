# Phase 1 production: AWS + Dokploy (lowest cost)

Ultra-low-cost production for the QR digital menu + staff dashboard on a **single EC2** running **Dokploy** (Traefik + Django + Postgres + Redis), with **S3** (+ optional **CloudFront**) for menu images. Same-origin SPA. No Celery worker in Phase 1.

Ballpark (post free-tier): roughly **$10–20/mo** (EC2 + EBS + S3/CF + DNS). Near-$0 only while AWS free tier covers the instance.

Related compose: [`backend/docker-compose.production.yml`](../backend/docker-compose.production.yml).

**If Dokploy is already running:** use the short path in [`DOKPLOY_GO_LIVE.md`](DOKPLOY_GO_LIVE.md) (env templates, bootstrap command, smoke script). Prefer compose file [`backend/docker-compose.dokploy.yml`](../backend/docker-compose.dokploy.yml) (Dokploy Traefik + `dokploy-network` labels; no bundled Traefik).

---

## Architecture (locked for Phase 1)

| Layer | Choice | Why |
| ----- | ------ | --- |
| Compute | 1× `t4g.small` (or free-tier `t3.micro`) + Elastic IP | Dokploy + containers; ARM cheaper |
| DB | Postgres **container** on EC2 volume | Avoid RDS cost |
| Cache/broker | Redis container | Prod cache; Phase 2 Celery-ready |
| Celery worker | **Omit** | `CELERY_TASK_ALWAYS_EAGER=True` |
| Proxy/TLS | Dokploy Traefik **or** bundled Traefik + Let’s Encrypt | HTTPS |
| Media | S3 under `media/` | Already wired in production settings |
| CDN | CloudFront in front of S3 (recommended) | Fast images; Django not serving bytes |
| Static SPA | nginx `dist/` behind Traefik, **same domain** as API | Avoids CORS/CSRF pain |
| BG removal | **Off** | Images already 512 WebP q80 |

Skip for Phase 1: RDS, ElastiCache, ALB, ECS/EKS, NAT Gateway, WAF.

---

## App / compose prerequisites (already in repo)

- `DJANGO_CSRF_TRUSTED_ORIGINS` in production settings
- Check-in throttle: `POST /api/auth/check-in/` (default `40/hour` per IP; override with `DJANGO_CHECK_IN_THROTTLE`)
- Production start runs `migrate` + `collectstatic`
- Frontend Dockerfile + nginx; Traefik hosts use `YOUR_DOMAIN` (replace before deploy)
- Phase 1 compose: **no** celeryworker / bg_removal

---

## AWS resources to create

### 1. EC2

- AMI: Ubuntu LTS
- Instance: `t4g.small` (or free-tier micro while eligible)
- Disk: 20–30 GB gp3
- Attach an **Elastic IP**
- **Security group**
  - Inbound: `80`, `443` from `0.0.0.0/0` (and `::/0` if IPv6)
  - Inbound: `22` from **your IP only**
  - Outbound: all (or HTTPS-only if you harden later)

### 2. S3 media bucket (`your-app-media-prod`)

- Block public ACLs
- Prefer **private bucket + CloudFront OAC** (or public-read via bucket policy on `media/*` only)
- Versioning: **On**
- Lifecycle: abort incomplete multipart; optional IA after 90d
- CORS: only needed if browsers load objects cross-origin from the SPA origin (not required when using absolute CloudFront URLs in the API)

### 3. CloudFront (recommended)

- Origin: S3 bucket with OAC
- HTTPS only; cache `media/*`; compression on
- Set Django `DJANGO_AWS_S3_CUSTOM_DOMAIN` to the CF domain **without** `https://` (e.g. `dxxxx.cloudfront.net` or `media.YOUR_DOMAIN`)

### 4. IAM

**Prefer EC2 instance role** (no long-lived keys):

- `s3:PutObject`, `GetObject`, `DeleteObject` on `arn:aws:s3:::your-app-media-prod/media/*`
- `s3:ListBucket` on `arn:aws:s3:::your-app-media-prod`
- Optional: `s3:PutObject` on a private backup bucket

If Dokploy cannot use the instance profile: create an IAM user with the same least-privilege policy; store keys in Dokploy secrets as `DJANGO_AWS_ACCESS_KEY_ID` / `DJANGO_AWS_SECRET_ACCESS_KEY`. **No AdminAccess.**

### 5. DNS

- Route53 (or external): A/AAAA → Elastic IP for `YOUR_DOMAIN` (and `www` if used)
- Optional CNAME for a media subdomain → CloudFront

### 6. Optional backup bucket

- `your-app-db-backups` — private only; nightly `pg_dump` uploads

---

## Dokploy setup

1. Install Dokploy on the EC2 (official install script).
2. Point DNS at the Elastic IP; issue certificates in Dokploy/Traefik.
3. Create an application from this Git repo using [`backend/docker-compose.production.yml`](../backend/docker-compose.production.yml).
4. **If Dokploy already provides Traefik:** remove/disable the compose `traefik` service and map:
   - `/api`, `/admin`, `/accounts`, `/static` → `django:5000`
   - `/` → `frontend:80`
5. **If using bundled Traefik:** replace every `YOUR_DOMAIN` in [`backend/compose/production/traefik/traefik.yml`](../backend/compose/production/traefik/traefik.yml) (and ACME email) before first deploy.
6. Set env groups (secrets) — table below.
7. Deploy: build Django image; build frontend with `VITE_PUBLIC_APP_ORIGIN=https://YOUR_DOMAIN`; start stack.
8. One-off: `createsuperuser`; verify public menu, dashboard login, QR URLs show production host (not localhost).
9. Health: Dokploy healthcheck on Django `GET /api/csrf/` (compose includes a container healthcheck).

**Never commit** `.envs/.production/`. Inject via Dokploy secrets (or SSM later).

---

## Environment variables

### Django (Dokploy / `.django`)

| Variable | Example / notes |
| -------- | --------------- |
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `DJANGO_SECRET_KEY` | Long random string |
| `DJANGO_ALLOWED_HOSTS` | `YOUR_DOMAIN,www.YOUR_DOMAIN` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://YOUR_DOMAIN,https://www.YOUR_DOMAIN` |
| `DJANGO_SECURE_SSL_REDIRECT` | `True` |
| `DJANGO_ADMIN_URL` | Random path — **not** `admin/` |
| `DATABASE_URL` or `POSTGRES_*` | As compose / entrypoint expects (`postgres:5432`) |
| `REDIS_URL` | `redis://redis:6379/0` |
| `CELERY_TASK_ALWAYS_EAGER` | **`True`** (Phase 1 — no worker) |
| `DJANGO_AWS_ACCESS_KEY_ID` / `SECRET` | Only if not using instance role (else leave empty) |
| `DJANGO_AWS_STORAGE_BUCKET_NAME` | Media bucket name |
| `DJANGO_AWS_S3_REGION_NAME` | e.g. `ap-south-1` |
| `DJANGO_AWS_S3_CUSTOM_DOMAIN` | CloudFront domain (no `https://`) |
| `DJANGO_CHECK_IN_THROTTLE` | Optional; default `40/hour` |
| WA / SMS template vars | Leave empty for Phase 1 |

**Do not set** `CRM_OPEN_PERMISSIONS=true` in production.

`AWS_QUERYSTRING_AUTH` is `False` in production settings so public CF/S3 URLs do not expire.

### Frontend build

| Variable | Notes |
| -------- | ----- |
| `VITE_PUBLIC_APP_ORIGIN` | `https://YOUR_DOMAIN` (compose build arg / Dokploy build env) |

---

## Media / static serving

| Asset | How |
| ----- | --- |
| Menu images | Upload → Django WebP 512 → S3 → CloudFront URL in API `image_url` |
| Django admin/static | WhiteNoise inside Django container |
| SPA JS/CSS/HTML | Traefik → frontend nginx on `/` |
| API | Traefik → Django `/api`, `/admin`, `/accounts` |

---

## Security checklist

- [ ] SG: SSH locked to your IP; only 80/443 public
- [ ] Postgres/Redis **not** published on host public ports
- [ ] HTTPS everywhere; `SECURE_PROXY_SSL_HEADER` already set in Django
- [ ] `CSRF_TRUSTED_ORIGINS` matches the real SPA origin
- [ ] Staff dashboard auth required (`CRM_OPEN_PERMISSIONS=False`)
- [ ] Check-in rate limit enabled
- [ ] S3: no accidental public writes; OAC for CloudFront
- [ ] Secrets only in Dokploy; rotate `DJANGO_SECRET_KEY` and IAM keys on a schedule
- [ ] After HTTPS is proven: raise `SECURE_HSTS_SECONDS` (today starts at 60s) toward `518400`

---

## Logging, monitoring, backups

| Need | Low-cost approach |
| ---- | ----------------- |
| App logs | Docker / Dokploy log viewer |
| Uptime | Free UptimeRobot / Better Stack → homepage + `/api/csrf/` |
| DB backup | Nightly `pg_dump` (compose `awscli` / postgres maintenance scripts) → private S3 backup bucket |
| Media | S3 versioning |
| Disk | CloudWatch basic EC2 metrics + disk alarm |
| Recovery | Dokploy redeploy + restore `pg_dump`; monthly AMI snapshot |

Automate: TLS renew (Traefik), nightly DB dump to S3, optional Dokploy auto-deploy from `main`.

---

## Exact go-live sequence

1. Buy/point domain → Elastic IP.
2. Create S3 (+ CloudFront) + IAM role/user.
3. Provision EC2 + SG + Dokploy.
4. Land this repo’s Phase 1 code; set Dokploy env + replace `YOUR_DOMAIN` in Traefik (or Dokploy UI routes).
5. Deploy stack; confirm migrate/collectstatic on Django start.
6. Create staff user; upload a test menu image; confirm S3/CF URL in API.
7. Settings → Appearance / QR; download QR; scan on phone (**cellular**, not LAN).
8. Optional light load test (50–100 concurrent GETs on public menu).
9. Lengthen HSTS; document restore/rotate runbook for your team.
10. Leave Redis in place for Phase 2.

---

## Phase 2 readiness (no network redesign)

- Redis already present as Celery broker
- Uncomment `celeryworker` (and optional `celerybeat`) in production compose
- Set `CELERY_TASK_ALWAYS_EAGER=False`
- Add WhatsApp secrets; Meta webhook → `https://YOUR_DOMAIN/...`
- Scale vertically or move Postgres to RDS when revenue justifies

---

## Ops note

Creating live AWS resources and clicking through Dokploy is **manual**. This document plus the production compose/settings changes are the code-side Phase 1 deliverable.
