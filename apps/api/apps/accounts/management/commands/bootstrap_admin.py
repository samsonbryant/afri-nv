"""Create or update the documented platform admin account."""

from __future__ import annotations

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = (
        "Create or update admin@novixa.ai (or ADMIN_EMAIL) as a staff superuser. "
        "Password defaults to NovixaAdmin2026! unless ADMIN_PASSWORD is set."
    )

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--email",
            default=os.environ.get("ADMIN_EMAIL", "admin@novixa.ai"),
            help="Admin email (default: ADMIN_EMAIL or admin@novixa.ai)",
        )
        parser.add_argument(
            "--password",
            default=os.environ.get("ADMIN_PASSWORD", "NovixaAdmin2026!"),
            help="Admin password (default: ADMIN_PASSWORD or NovixaAdmin2026!)",
        )

    def handle(self, *args, **options) -> None:
        email = str(options["email"]).strip().lower()
        password = str(options["password"])
        User = get_user_model()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "is_email_verified": True,
                "email_verified_at": timezone.now(),
            },
        )
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.is_email_verified = True
        if user.email_verified_at is None:
            user.email_verified_at = timezone.now()
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} staff admin: {email}"))
        self.stdout.write(
            self.style.WARNING("Change this password after first login in production.")
        )
