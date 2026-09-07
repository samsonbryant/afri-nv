"""Meta Graph / WhatsApp Cloud API client (optional live mode).

Uses urllib so we don't add a heavy SDK. When no token is configured, callers
should keep stub/realtime-local behavior.
"""

from __future__ import annotations

import json
import logging
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings

logger = logging.getLogger(__name__)

GRAPH_VERSION = "v19.0"
GRAPH_BASE = f"https://graph.facebook.com/{GRAPH_VERSION}"


class MetaGraphClient:
    """Thin Graph API wrapper. Live when a usable access token is available."""

    def __init__(self, access_token: str | None = None) -> None:
        configured = (
            access_token or getattr(settings, "META_GRAPH_ACCESS_TOKEN", "") or ""
        ).strip()
        self.access_token = configured
        self.is_live = bool(self.access_token)

    def verify_token(self, token: str | None = None) -> dict[str, Any]:
        """Validate a user/page token via /me. Returns profile fields + ok flag."""
        tok = (token or self.access_token or "").strip()
        if not tok:
            return {"ok": False, "stub": True, "error": "missing_token"}
        try:
            data = self._get("/me", {"fields": "id,name", "access_token": tok})
            return {
                "ok": True,
                "stub": False,
                "account_id": str(data.get("id") or ""),
                "account_name": str(data.get("name") or ""),
                "raw": data,
            }
        except Exception as exc:
            logger.warning("meta_graph.verify_token failed: %s", exc)
            return {"ok": False, "stub": False, "error": str(exc)[:500]}

    def publish_page_post(
        self, *, page_id: str, message: str, access_token: str | None = None
    ) -> dict[str, Any]:
        tok = (access_token or self.access_token or "").strip()
        if not tok or not page_id:
            return {"ok": False, "stub": True, "error": "missing_token_or_page"}
        try:
            data = self._post(f"/{page_id}/feed", {"message": message, "access_token": tok})
            return {
                "ok": True,
                "stub": False,
                "external_id": str(data.get("id") or ""),
                "raw": data,
            }
        except Exception as exc:
            logger.warning("meta_graph.publish_page_post failed: %s", exc)
            return {"ok": False, "stub": False, "error": str(exc)[:500]}

    def send_whatsapp_text(
        self,
        *,
        phone_number_id: str,
        to: str,
        body: str,
        access_token: str | None = None,
    ) -> dict[str, Any]:
        tok = (access_token or self.access_token or "").strip()
        if not tok or not phone_number_id or not to:
            return {"ok": False, "stub": True, "error": "missing_whatsapp_params"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        }
        try:
            data = self._post_json(f"/{phone_number_id}/messages", payload, access_token=tok)
            messages = data.get("messages") or []
            external_id = ""
            if messages and isinstance(messages[0], dict):
                external_id = str(messages[0].get("id") or "")
            return {"ok": True, "stub": False, "external_id": external_id, "raw": data}
        except Exception as exc:
            logger.warning("meta_graph.send_whatsapp_text failed: %s", exc)
            return {"ok": False, "stub": False, "error": str(exc)[:500]}

    def _get(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        url = f"{GRAPH_BASE}{path}?{urlencode(params)}"
        req = Request(url, method="GET", headers={"Accept": "application/json"})
        return self._request(req)

    def _post(self, path: str, params: dict[str, str]) -> dict[str, Any]:
        url = f"{GRAPH_BASE}{path}"
        body = urlencode(params).encode("utf-8")
        req = Request(
            url,
            data=body,
            method="POST",
            headers={
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        return self._request(req)

    def _post_json(
        self, path: str, payload: dict[str, Any], *, access_token: str
    ) -> dict[str, Any]:
        url = f"{GRAPH_BASE}{path}?{urlencode({'access_token': access_token})}"
        body = json.dumps(payload).encode("utf-8")
        req = Request(
            url,
            data=body,
            method="POST",
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )
        return self._request(req)

    @staticmethod
    def _request(req: Request) -> dict[str, Any]:
        try:
            with urlopen(req, timeout=20) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw) if raw else {}
                if not isinstance(data, dict):
                    return {"data": data}
                return data
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:800]
            raise RuntimeError(f"Graph HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise RuntimeError(f"Graph network error: {exc.reason}") from exc
