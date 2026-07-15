# Phase 1 gateway — path-split /api → django, / → frontend SPA.
FROM docker.io/nginx:1.27-alpine

COPY ./compose/production/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
