from .base import *  # noqa: F403
from .base import INSTALLED_APPS
from .base import MIDDLEWARE
from .base import env

# GENERAL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True
# https://docs.djangoproject.com/en/dev/ref/settings/#secret-key
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="rRwV6MLP9MnH1w2VUygTydCK5MUfK3nbfKdsg9MRRNxb1LkwkwZYUITC9CTKAvpx",
)
# https://docs.djangoproject.com/en/dev/ref/settings/#allowed-hosts
ALLOWED_HOSTS = [
    "localhost",
    "0.0.0.0",
    "127.0.0.1",
    ".ngrok-free.dev",
]  # noqa: S104

# Vite (:8080) proxies /api to Django (:8000); browser Referer does not match Host — CSRF needs this.
# https://docs.djangoproject.com/en/stable/ref/settings/#csrf-trusted-origins
CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]

# CRM: set DJANGO_CRM_OPEN_PERMISSIONS=yes in .envs/.local/.django for open dashboard API in dev.
# Default False so a public ngrok tunnel to :8000 does not expose the CRM without staff auth.
CRM_OPEN_PERMISSIONS = env.bool("DJANGO_CRM_OPEN_PERMISSIONS", default=False)

# CACHES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#caches
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "",
    },
}

# EMAIL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = env(
    "DJANGO_EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)

# WhiteNoise
# ------------------------------------------------------------------------------
# http://whitenoise.evans.io/en/latest/django.html#using-whitenoise-in-development
INSTALLED_APPS = ["whitenoise.runserver_nostatic", *INSTALLED_APPS]


# django-debug-toolbar
# ------------------------------------------------------------------------------
# https://django-debug-toolbar.readthedocs.io/en/latest/installation.html#prerequisites
INSTALLED_APPS += ["debug_toolbar"]
# https://django-debug-toolbar.readthedocs.io/en/latest/installation.html#middleware
MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]
# https://django-debug-toolbar.readthedocs.io/en/latest/configuration.html#debug-toolbar-config
DEBUG_TOOLBAR_CONFIG = {
    "DISABLE_PANELS": [
        "debug_toolbar.panels.redirects.RedirectsPanel",
        # Disable profiling panel due to an issue with Python 3.12+:
        # https://github.com/jazzband/django-debug-toolbar/issues/1875
        "debug_toolbar.panels.profiling.ProfilingPanel",
    ],
    "SHOW_TEMPLATE_CONTEXT": True,
}
# https://django-debug-toolbar.readthedocs.io/en/latest/installation.html#internal-ips
INTERNAL_IPS = ["127.0.0.1", "10.0.2.2"]
if env("USE_DOCKER") == "yes":
    import socket

    hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    INTERNAL_IPS += [".".join([*ip.split(".")[:-1], "1"]) for ip in ips]

# django-extensions
# ------------------------------------------------------------------------------
# https://django-extensions.readthedocs.io/en/latest/installation_instructions.html#configuration
INSTALLED_APPS += ["django_extensions"]

# OpenAPI (Swagger / ReDoc): allow browsing docs without logging in during local dev only.
# Production keeps IsAuthenticated from base.py.
SPECTACULAR_SETTINGS = {
    **SPECTACULAR_SETTINGS,
    "SERVE_PERMISSIONS": ["rest_framework.permissions.AllowAny"],
}

# Your stuff...
# ------------------------------------------------------------------------------
# Without a Celery worker, feedback tasks stay in Redis forever. Eager mode runs them in-process.
# Set CELERY_TASK_ALWAYS_EAGER=no in .env when running `celery worker` and you want real async.
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=True)
