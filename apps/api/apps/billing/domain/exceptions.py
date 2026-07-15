from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class PlanNotFoundError(NotFoundError):
    default_message = "Plan not found."
    code = "plan_not_found"


class SubscriptionNotFoundError(NotFoundError):
    default_message = "Subscription not found."
    code = "subscription_not_found"


class CouponInvalidError(ValidationError):
    default_message = "Coupon is invalid."
    code = "coupon_invalid"


class InvoiceNotFoundError(NotFoundError):
    default_message = "Invoice not found."
    code = "invoice_not_found"
