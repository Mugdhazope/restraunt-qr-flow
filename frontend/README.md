# Frontend (Vite)

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:8080** (not only `localhost` if your machine resolves it oddly).

With **Django running on port 8000**, the Vite dev server proxies backend paths to Django, so you can use one origin:

- **Dashboard:** http://127.0.0.1:8080/dashboard
- **Django Admin:** http://127.0.0.1:8080/admin/
- **Swagger UI:** http://127.0.0.1:8080/api/docs/
- **ReDoc:** http://127.0.0.1:8080/api/redoc/
- **OpenAPI JSON:** http://127.0.0.1:8080/api/schema/

You can also open Django directly: http://127.0.0.1:8000/admin/

If the port is busy, stop the other app or change the port in `vite.config.ts` and the `dev` script in `package.json`.

## Production QR codes

QR codes on **Dashboard → QR & Entry Flow** encode:

`{VITE_PUBLIC_APP_ORIGIN or window.location.origin}/scan/{restaurant-slug}/menu`

Set the public SPA origin **at build time** so printed codes never point at localhost:

```bash
# frontend/.env.production (or CI env)
VITE_PUBLIC_APP_ORIGIN=https://your-domain.com
```

Then `npm run build`. After changing the domain, regenerate and reprint outlet QRs. Legacy path `/scan/thenest/menu` still resolves to The Nest via slug mapping.
