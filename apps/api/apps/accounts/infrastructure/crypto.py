"""Helpers for protecting TOTP secrets and signing short-lived temp tokens."""

from __future__ import annotations

from uuid import UUID

from django.core import signing


def encrypt_totp_secret(secret: str) -> str:
    """Obfuscate TOTP secret at rest via Django signing (not reversible without SECRET_KEY)."""
    return signing.dumps(secret, salt="novixa.totp")


def decrypt_totp_secret(ciphertext: str) -> str:
    try:
        return signing.loads(ciphertext, salt="novixa.totp")
    except signing.BadSignature as exc:
        raise ValueError("Unable to decrypt TOTP secret.") from exc


def issue_temp_2fa_token(user_id: UUID) -> str:
    return signing.dumps({"uid": str(user_id), "purpose": "2fa"}, salt="novixa.2fa")


def parse_temp_2fa_token(token: str, *, max_age: int = 300) -> UUID:
    try:
        data = signing.loads(token, salt="novixa.2fa", max_age=max_age)
    except signing.BadSignature as exc:
        raise ValueError("Invalid or expired temp token.") from exc
    if data.get("purpose") != "2fa":
        raise ValueError("Invalid temp token purpose.")
    return UUID(data["uid"])
