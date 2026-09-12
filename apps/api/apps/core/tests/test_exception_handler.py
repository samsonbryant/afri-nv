from __future__ import annotations

from rest_framework import status

from apps.billing.domain.exceptions import PaymentProviderUnavailableError
from apps.core.interfaces.api.exception_handler import custom_exception_handler


def test_payment_provider_error_returns_service_unavailable() -> None:
    response = custom_exception_handler(PaymentProviderUnavailableError(), {})

    assert response is not None
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.data == {
        "error": {
            "code": "payment_provider_unavailable",
            "message": (
                "Card checkout is temporarily unavailable. "
                "Please use MTN MoMo or Orange Money below, or contact support."
            ),
        }
    }
