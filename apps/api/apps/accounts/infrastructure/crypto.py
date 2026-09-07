"""Helpers for protecting TOTP secrets and signing short-lived temp tokens."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import struct
import time
from urllib.parse import quote
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


def generate_totp_secret() -> str:
    return base64.b32encode(os.urandom(20)).decode("ascii").rstrip("=")


def _normalize_b32(secret: str) -> bytes:
    padded = secret.strip().upper()
    pad = (-len(padded)) % 8
    return base64.b32decode(padded + ("=" * pad), casefold=True)


def totp_at(secret: str, for_time: float | None = None, *, step: int = 30) -> str:
    key = _normalize_b32(secret)
    counter = int((for_time if for_time is not None else time.time()) // step)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return f"{code % 1_000_000:06d}"


def verify_totp(secret: str, code: str, *, window: int = 1) -> bool:
    candidate = "".join(ch for ch in str(code) if ch.isdigit())
    if len(candidate) != 6:
        return False
    now = time.time()
    for drift in range(-window, window + 1):
        if hmac.compare_digest(totp_at(secret, now + drift * 30), candidate):
            return True
    return False


def build_otpauth_url(*, email: str, secret: str, issuer: str = "Novixa") -> str:
    label = quote(f"{issuer}:{email}")
    return f"otpauth://totp/{label}?secret={secret}&issuer={quote(issuer)}&digits=6&period=30"
