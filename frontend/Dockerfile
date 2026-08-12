# Phase 1 production SPA — build Vite dist, serve with nginx.
# Build from repo root or set compose context to ./frontend:
#   docker build -f frontend/Dockerfile \
#     --build-arg VITE_PUBLIC_APP_ORIGIN=https://YOUR_DOMAIN \
#     frontend/
#
# Standalone preview (no Django): add
#   --build-arg VITE_PREVIEW_ONLY=true
#   --build-arg VITE_LIVE_APP_ORIGIN=https://morph.origin4.co
# then deploy this image alone. The demo lives at /preview.

FROM docker.io/node:22-alpine AS build
WORKDIR /app

COPY package.json bun.lock* package-lock.json* yarn.lock* ./
RUN if [ -f bun.lock ]; then \
      npm install -g bun && bun install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

COPY . .

ARG VITE_PUBLIC_APP_ORIGIN=https://YOUR_DOMAIN
ENV VITE_PUBLIC_APP_ORIGIN=$VITE_PUBLIC_APP_ORIGIN

ARG VITE_PREVIEW_ONLY=false
ENV VITE_PREVIEW_ONLY=$VITE_PREVIEW_ONLY

ARG VITE_LIVE_APP_ORIGIN=
ENV VITE_LIVE_APP_ORIGIN=$VITE_LIVE_APP_ORIGIN

RUN npm run build

FROM docker.io/nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
