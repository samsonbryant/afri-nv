"""Console / Django email helpers for auth flows."""

from __future__ import annotations

import logging

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger("apps.accounts.mailers")


def send_password_reset_email(*, to_email: str, token: str) -> None:
    subject = "Reset your Novixa password"
    body = (
        f"You requested a password reset for your Novixa account.\n\n"
        f"Reset token: {token}\n\n"
        f"This token expires in 1 hour. If you did not request this, ignore this email.\n"
    )
    logger.info("Password reset token for %s: %s", to_email, token)
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
        fail_silently=True,
    )


def send_email_verification(*, to_email: str, token: str) -> None:
    subject = "Verify your Novixa email"
    body = f"Welcome to Novixa!\n\nVerification token: {token}\n\nThis token expires in 24 hours.\n"
    logger.info("Email verification token for %s: %s", to_email, token)
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
        fail_silently=True,
    )


def send_organization_invite(*, to_email: str, org_name: str, token: str) -> None:
    subject = f"You're invited to join {org_name} on Novixa"
    body = (
        f"You have been invited to join {org_name} on Novixa.\n\n"
        f"Invite token: {token}\n\n"
        f"This invite expires in 7 days.\n"
    )
    logger.info("Org invite token for %s (%s): %s", to_email, org_name, token)
    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [to_email],
        fail_silently=True,
    )
