"""Duplicate existing menu items until a restaurant has ~N dishes (for scale testing)."""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.core.management.base import CommandError
from django.db import transaction

from kotak.menu.models import MenuItem
from kotak.restaurants.models import Restaurant


class Command(BaseCommand):
    help = (
        "Clone existing uploaded menu items with unique names until the restaurant "
        "reaches TARGET item count (default 150)."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--slug",
            default="dough-joe",
            help="Restaurant slug (default: dough-joe)",
        )
        parser.add_argument(
            "--target",
            type=int,
            default=150,
            help="Desired total menu item count (default: 150)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be created without writing",
        )

    def handle(self, *args, **options):
        slug: str = options["slug"]
        target: int = options["target"]
        dry_run: bool = options["dry_run"]

        if target < 1:
            raise CommandError("--target must be >= 1")

        try:
            restaurant = Restaurant.objects.get(slug=slug)
        except Restaurant.DoesNotExist as exc:
            raise CommandError(f"Restaurant not found: {slug!r}") from exc

        existing = list(
            MenuItem.objects.filter(category__restaurant=restaurant)
            .select_related("category")
            .order_by("category__name", "name"),
        )
        current = len(existing)
        if current == 0:
            raise CommandError(f"No menu items for {slug!r} — upload/import some first.")

        if current >= target:
            self.stdout.write(
                self.style.SUCCESS(f"{slug} already has {current} items (>= {target}). Nothing to do."),
            )
            return

        # Round-robin clone from originals; names must be unique per category.
        used_names: dict[int, set[str]] = {}
        for item in existing:
            used_names.setdefault(item.category_id, set()).add(item.name)

        to_create: list[MenuItem] = []
        source_idx = 0
        copy_n = 2
        while current + len(to_create) < target:
            src = existing[source_idx % len(existing)]
            source_idx += 1
            names = used_names.setdefault(src.category_id, set())
            # Find a free name for this category
            while True:
                candidate = f"{src.name} ({copy_n})"
                if candidate not in names:
                    names.add(candidate)
                    break
                copy_n += 1
            to_create.append(
                MenuItem(
                    category=src.category,
                    name=candidate,
                    description=src.description,
                    price=src.price,
                    image=src.image.name if src.image else "",
                    tag=src.tag,
                    is_featured=False,
                    is_new=False,
                    is_jain=src.is_jain,
                    image_scale=src.image_scale,
                ),
            )
            # Bump copy index periodically so names stay readable across sources
            if source_idx % len(existing) == 0:
                copy_n += 1

        self.stdout.write(
            f"{slug}: {current} items → will add {len(to_create)} clones "
            f"(total {current + len(to_create)}).",
        )
        if dry_run:
            for row in to_create[:10]:
                self.stdout.write(f"  + {row.category.name}: {row.name}")
            if len(to_create) > 10:
                self.stdout.write(f"  … and {len(to_create) - 10} more")
            return

        with transaction.atomic():
            MenuItem.objects.bulk_create(to_create, batch_size=100)

        final = MenuItem.objects.filter(category__restaurant=restaurant).count()
        self.stdout.write(self.style.SUCCESS(f"Done. {slug} now has {final} menu items."))
