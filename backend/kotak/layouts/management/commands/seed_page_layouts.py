from django.core.management.base import BaseCommand

from kotak.layouts.services import ensure_defaults_for_all_restaurants


class Command(BaseCommand):
    help = "Seed default page layouts for all restaurants."

    def handle(self, *args, **options):
        n = ensure_defaults_for_all_restaurants()
        self.stdout.write(self.style.SUCCESS(f"Created {n} default page layout(s)."))
