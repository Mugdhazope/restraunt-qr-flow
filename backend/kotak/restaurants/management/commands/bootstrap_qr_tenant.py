"""Bootstrap a restaurant + default layouts for QR Phase 1 production."""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.core.management.base import CommandError
from django.db import transaction

from kotak.layouts.services import ensure_default_layouts
from kotak.restaurants.models import MembershipRole
from kotak.restaurants.models import Restaurant
from kotak.restaurants.models import RestaurantMembership


class Command(BaseCommand):
    help = (
        "Ensure restaurant exists, seed default mobile layouts, and optionally "
        "create a staff user with membership (QR / Dokploy go-live)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--slug", default="dough-joe", help="Restaurant slug used in /scan/{slug}/…")
        parser.add_argument("--name", default="Dough & Joe", help="Restaurant display name")
        parser.add_argument(
            "--staff-email",
            default="",
            help="If set with --staff-password, create/update a staff user",
        )
        parser.add_argument("--staff-password", default="", help="Password for --staff-email")
        parser.add_argument(
            "--staff-username",
            default="",
            help="Username (defaults to email local-part or staff)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        slug: str = options["slug"].strip()
        name: str = options["name"].strip()
        if not slug:
            raise CommandError("--slug is required")

        restaurant, created = Restaurant.objects.get_or_create(
            slug=slug,
            defaults={"name": name or slug},
        )
        if not created and name and restaurant.name != name:
            restaurant.name = name
            restaurant.save(update_fields=["name"])

        layouts = ensure_default_layouts(restaurant)
        self.stdout.write(
            self.style.SUCCESS(
                f"{'Created' if created else 'Found'} restaurant {restaurant.slug!r}; "
                f"layouts ensured ({len(layouts)} new).",
            ),
        )

        email = (options["staff_email"] or "").strip()
        password = options["staff_password"] or ""
        if email:
            if not password:
                raise CommandError("--staff-password required when --staff-email is set")
            User = get_user_model()
            username = (options["staff_username"] or "").strip() or email.split("@")[0] or "staff"
            user, u_created = User.objects.get_or_create(
                username=username,
                defaults={"email": email, "name": name or username},
            )
            if email and user.email != email:
                user.email = email
            user.is_staff = True
            user.set_password(password)
            user.save()
            RestaurantMembership.objects.update_or_create(
                user=user,
                restaurant=restaurant,
                defaults={"role": MembershipRole.ADMIN},
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Created' if u_created else 'Updated'} staff user {user.username!r} "
                    f"as ADMIN of {restaurant.slug}.",
                ),
            )

        self.stdout.write(
            "Next: upload menu in dashboard, set Appearance, print QR at "
            f"/scan/{restaurant.slug}/menu",
        )
