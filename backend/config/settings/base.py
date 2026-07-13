from datetime import timedelta

# ruff: noqa: ERA001, E501, E402
"""Base settings to build other settings files upon."""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve(strict=True).parent.parent.parent
# kotak/
APPS_DIR = BASE_DIR / "kotak"
env = environ.Env()

READ_DOT_ENV_FILE = env.bool("DJANGO_READ_DOT_ENV_FILE", default=False)
if READ_DOT_ENV_FILE:
    # OS environment variables take precedence over variables from .env
    env.read_env(str(BASE_DIR / ".env"))

# GENERAL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = env.bool("DJANGO_DEBUG", False)
# Local time zone. Choices are
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# though not all of them may be available with every OS.
# In Windows, this must be set to your system time zone.
TIME_ZONE = "Asia/Kolkata"
# https://docs.djangoproject.com/en/dev/ref/settings/#language-code
LANGUAGE_CODE = "en-us"
# https://docs.djangoproject.com/en/dev/ref/settings/#languages
# from django.utils.translation import gettext_lazy as _
# LANGUAGES = [
#     ('en', _('English')),
#     ('fr-fr', _('French')),
#     ('pt-br', _('Portuguese')),
# ]
# https://docs.djangoproject.com/en/dev/ref/settings/#site-id
SITE_ID = 1
# https://docs.djangoproject.com/en/dev/ref/settings/#use-i18n
USE_I18N = True
# https://docs.djangoproject.com/en/dev/ref/settings/#use-tz
USE_TZ = True
# https://docs.djangoproject.com/en/dev/ref/settings/#locale-paths
LOCALE_PATHS = [str(BASE_DIR / "locale")]

# DATABASES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#databases
# DATABASE_URL is exported in compose/production/django/entrypoint for the main process.
# docker compose exec does not re-run the entrypoint, so fall back to POSTGRES_* from env_file.
_database_url = env.str("DATABASE_URL", default="").strip()
if not _database_url:
    _pg_keys = (
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DB",
    )
    _pg = [env.str(k, default="").strip() for k in _pg_keys]
    if not all(_pg):
        msg = "Set the DATABASE_URL environment variable"
        raise environ.ImproperlyConfigured(msg)
    user, password, host, port, name = _pg
    _database_url = f"postgres://{user}:{password}@{host}:{port}/{name}"
DATABASES = {"default": env.db_url_config(_database_url)}
DATABASES["default"]["ATOMIC_REQUESTS"] = True
# https://docs.djangoproject.com/en/stable/ref/settings/#std:setting-DEFAULT_AUTO_FIELD
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# URLS
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#root-urlconf
ROOT_URLCONF = "config.urls"
# https://docs.djangoproject.com/en/dev/ref/settings/#wsgi-application
WSGI_APPLICATION = "config.wsgi.application"

# APPS
# ------------------------------------------------------------------------------
DJANGO_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.sites",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # "django.contrib.humanize", # Handy template tags
    "django.contrib.admin",
    "django.forms",
]
THIRD_PARTY_APPS = [
    "crispy_forms",
    "crispy_bootstrap5",
    "allauth",
    "allauth.account",
    "allauth.mfa",
    "allauth.socialaccount",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

LOCAL_APPS = [
    "kotak.users",
    "kotak.restaurants",
    "kotak.customers",
    "kotak.accounts",
    "kotak.menu",
    "kotak.feedback",
    "kotak.campaigns",
    "kotak.dashboard",
    "kotak.layouts",
]
# https://docs.djangoproject.com/en/dev/ref/settings/#installed-apps
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# MIGRATIONS
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#migration-modules
MIGRATION_MODULES = {"sites": "kotak.contrib.sites.migrations"}

# AUTHENTICATION
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#authentication-backends
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]
# https://docs.djangoproject.com/en/dev/ref/settings/#auth-user-model
AUTH_USER_MODEL = "users.User"
# https://docs.djangoproject.com/en/dev/ref/settings/#login-redirect-url
LOGIN_REDIRECT_URL = "users:redirect"
# https://docs.djangoproject.com/en/dev/ref/settings/#login-url
LOGIN_URL = "account_login"

# PASSWORDS
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#password-hashers
PASSWORD_HASHERS = [
    # https://docs.djangoproject.com/en/dev/topics/auth/passwords/#using-argon2-with-django
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
]
# https://docs.djangoproject.com/en/dev/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# MIDDLEWARE
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#middleware
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

# STATIC
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#static-root
STATIC_ROOT = str(BASE_DIR / "staticfiles")
# https://docs.djangoproject.com/en/dev/ref/settings/#static-url
STATIC_URL = "/static/"
# https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#std:setting-STATICFILES_DIRS
STATICFILES_DIRS = [str(APPS_DIR / "static")]
# https://docs.djangoproject.com/en/dev/ref/contrib/staticfiles/#staticfiles-finders
STATICFILES_FINDERS = [
    "django.contrib.staticfiles.finders.FileSystemFinder",
    "django.contrib.staticfiles.finders.AppDirectoriesFinder",
]

# MEDIA
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#media-root
MEDIA_ROOT = str(APPS_DIR / "media")
# https://docs.djangoproject.com/en/dev/ref/settings/#media-url
MEDIA_URL = "/media/"
# Optional menu image matting (Python 3.14 app): HTTP sidecar base URL, e.g. http://bg_removal:8765
MENU_BG_REMOVAL_URL = env("MENU_BG_REMOVAL_URL", default="").strip()
# Optional fallback when sidecar is unset: https://www.remove.bg/api
REMOVEBG_API_KEY = env("REMOVEBG_API_KEY", default="").strip()

# TEMPLATES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#templates
TEMPLATES = [
    {
        # https://docs.djangoproject.com/en/dev/ref/settings/#std:setting-TEMPLATES-BACKEND
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # https://docs.djangoproject.com/en/dev/ref/settings/#dirs
        "DIRS": [str(APPS_DIR / "templates")],
        # https://docs.djangoproject.com/en/dev/ref/settings/#app-dirs
        "APP_DIRS": True,
        "OPTIONS": {
            # https://docs.djangoproject.com/en/dev/ref/settings/#template-context-processors
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.template.context_processors.i18n",
                "django.template.context_processors.media",
                "django.template.context_processors.static",
                "django.template.context_processors.tz",
                "django.contrib.messages.context_processors.messages",
                "kotak.users.context_processors.allauth_settings",
            ],
        },
    },
]

# https://docs.djangoproject.com/en/dev/ref/settings/#form-renderer
FORM_RENDERER = "django.forms.renderers.TemplatesSetting"

# http://django-crispy-forms.readthedocs.io/en/latest/install.html#template-packs
CRISPY_TEMPLATE_PACK = "bootstrap5"
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"

# FIXTURES
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#fixture-dirs
FIXTURE_DIRS = (str(APPS_DIR / "fixtures"),)

# SECURITY
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#session-cookie-httponly
SESSION_COOKIE_HTTPONLY = True
# https://docs.djangoproject.com/en/dev/ref/settings/#csrf-cookie-httponly
CSRF_COOKIE_HTTPONLY = True
# https://docs.djangoproject.com/en/dev/ref/settings/#x-frame-options
X_FRAME_OPTIONS = "DENY"

# EMAIL
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = env(
    "DJANGO_EMAIL_BACKEND",
    default="django.core.mail.backends.smtp.EmailBackend",
)
# https://docs.djangoproject.com/en/dev/ref/settings/#email-timeout
EMAIL_TIMEOUT = 5

# ADMIN
# ------------------------------------------------------------------------------
# Django Admin URL.
ADMIN_URL = "admin/"
# https://docs.djangoproject.com/en/dev/ref/settings/#admins
ADMINS = ['"Mugdha" <mugdha@example.com>']
# https://docs.djangoproject.com/en/dev/ref/settings/#managers
MANAGERS = ADMINS
# https://cookiecutter-django.readthedocs.io/en/latest/settings.html#other-environment-settings
# Force the `admin` sign in process to go through the `django-allauth` workflow
DJANGO_ADMIN_FORCE_ALLAUTH = env.bool("DJANGO_ADMIN_FORCE_ALLAUTH", default=False)

# LOGGING
# ------------------------------------------------------------------------------
# https://docs.djangoproject.com/en/dev/ref/settings/#logging
# See https://docs.djangoproject.com/en/dev/topics/logging for
# more details on how to customize your logging configuration.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s",
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {"level": "INFO", "handlers": ["console"]},
}

REDIS_URL = env("REDIS_URL", default="redis://redis:6379/0")
REDIS_SSL = REDIS_URL.startswith("rediss://")

# WhatsApp Cloud API (Graph). Set WHATSAPP_GRAPH_API_VERSION to match Meta API Setup curl (e.g. v25.0).
WHATSAPP_GRAPH_API_VERSION = env("WHATSAPP_GRAPH_API_VERSION", default="v22.0").strip().lstrip("/")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="").strip()
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="").strip()
WHATSAPP_WEBHOOK_VERIFY_TOKEN = env("WHATSAPP_WEBHOOK_VERIFY_TOKEN", default="").strip()
WHATSAPP_DEFAULT_COUNTRY_CODE = env("WHATSAPP_DEFAULT_COUNTRY_CODE", default="91").strip()
FEEDBACK_PROMPT_DELAY_SECONDS = env.int("FEEDBACK_PROMPT_DELAY_SECONDS", default=1800)
# Used when Restaurant.google_review_link is empty (optional dev convenience).
DEFAULT_GOOGLE_REVIEW_LINK = env("DEFAULT_GOOGLE_REVIEW_LINK", default="").strip()
# Fallback when Restaurant.whatsapp_otp_template_name is empty (body {{1}} = OTP code).
WHATSAPP_OTP_TEMPLATE_NAME = env("WHATSAPP_OTP_TEMPLATE_NAME", default="").strip()
WHATSAPP_OTP_TEMPLATE_LANGUAGE = env("WHATSAPP_OTP_TEMPLATE_LANGUAGE", default="en").strip()
# SMS OTP (MSG91)
SMS_API_KEY = env("SMS_API_KEY", default="").strip()
SMS_SENDER_ID = env("SMS_SENDER_ID", default="").strip()
SMS_TEMPLATE_ID = env("SMS_TEMPLATE_ID", default="").strip()
SMS_OTP_EXPIRY_SECONDS = env.int("SMS_OTP_EXPIRY_SECONDS", default=300)

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TIMEZONE = TIME_ZONE
# When True, tasks run in the Django/Celery caller process (no worker). See local.py default for dev.
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
CELERY_TASK_EAGER_PROPAGATES = env.bool("CELERY_TASK_EAGER_PROPAGATES", default=True)
CELERY_BEAT_SCHEDULE = {
    "run-inactive-customers-automation-every-day": {
        "task": "kotak.dashboard.tasks.run_inactive_customers_automation_task",
        "schedule": 60 * 60 * 24,
    },
}

# django-allauth
# ------------------------------------------------------------------------------
ACCOUNT_ALLOW_REGISTRATION = env.bool("DJANGO_ACCOUNT_ALLOW_REGISTRATION", True)
# https://docs.allauth.org/en/latest/account/configuration.html
ACCOUNT_LOGIN_METHODS = {"username"}
# https://docs.allauth.org/en/latest/account/configuration.html
ACCOUNT_SIGNUP_FIELDS = ["email*", "username*", "password1*", "password2*"]
# https://docs.allauth.org/en/latest/account/configuration.html
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
# https://docs.allauth.org/en/latest/account/configuration.html
ACCOUNT_ADAPTER = "kotak.users.adapters.AccountAdapter"
# https://docs.allauth.org/en/latest/account/forms.html
ACCOUNT_FORMS = {"signup": "kotak.users.forms.UserSignupForm"}
# https://docs.allauth.org/en/latest/socialaccount/configuration.html
SOCIALACCOUNT_ADAPTER = "kotak.users.adapters.SocialAccountAdapter"
# https://docs.allauth.org/en/latest/socialaccount/configuration.html
SOCIALACCOUNT_FORMS = {"signup": "kotak.users.forms.UserSocialSignupForm"}

# django-rest-framework
# -------------------------------------------------------------------------------
# django-rest-framework - https://www.django-rest-framework.org/api-guide/settings/
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    # Scoped rates applied only where throttle_scope / throttle_classes are set.
    "DEFAULT_THROTTLE_RATES": {
        "check_in": "40/hour",
    },
}

# Admin CRM: customers with last_visit before this cutoff (or null) match INACTIVE campaigns.
CRM_INACTIVE_VISIT_DAYS = env.int("CRM_INACTIVE_VISIT_DAYS", default=90)

# django-cors-headers - https://github.com/adamchainz/django-cors-headers#setup
CORS_URLS_REGEX = r"^/api/.*$"

# OpenAPI / Swagger UI / ReDoc — https://drf-spectacular.readthedocs.io/en/latest/settings.html
SPECTACULAR_SETTINGS = {
    "TITLE": "Restaurant QR Flow API",
    "DESCRIPTION": (
        "REST API for the restaurant QR flow platform. "
        "Authenticate with **session** (browser) or **token** (`Authorization: Token <key>`). "
        "Use **Authorize** in Swagger UI to persist your token while exploring endpoints."
    ),
    "VERSION": "1.0.0",
    "CONTACT": {
        "name": "API support",
        "email": env("DJANGO_SPECTACULAR_CONTACT_EMAIL", default="mugdha@example.com"),
    },
    "LICENSE": {"name": "Proprietary"},
    # Any authenticated user can open docs (not only staff); anonymous users still get 403.
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAuthenticated"],
    "SERVE_AUTHENTICATION": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "SCHEMA_PATH_PREFIX": "/api/",
    "TAGS": [
        {"name": "Authentication", "description": "Create and use API tokens."},
        {"name": "Users", "description": "Current user profile and account data."},
        {
            "name": "Dashboard",
            "description": "Staff-only restaurant CRM summary and metrics.",
        },
        {
            "name": "CRM Customers",
            "description": "Staff-only customer list and detail for a restaurant.",
        },
        {
            "name": "CRM Feedback",
            "description": "Staff-only feedback listing for a restaurant.",
        },
        {
            "name": "CRM Campaigns",
            "description": "Staff-only WhatsApp campaign sends for a restaurant.",
        },
    ],
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
        "displayOperationId": False,
        "defaultModelsExpandDepth": 2,
        "defaultModelExpandDepth": 3,
        "docExpansion": "list",
        "filter": True,
        "persistAuthorization": True,
        "tryItOutEnabled": True,
        "syntaxHighlight": {"activate": True, "theme": "monokai"},
    },
    "REDOC_UI_SETTINGS": {
        "hideDownloadButton": False,
        "expandResponses": "200,201",
        "pathInMiddlePanel": True,
        "nativeScrollbars": True,
        "theme": {"colors": {"primary": {"main": "#2563eb"}}},
    },
    "COMPONENT_SPLIT_REQUEST": True,
}
# Your stuff...
# ------------------------------------------------------------------------------


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}
