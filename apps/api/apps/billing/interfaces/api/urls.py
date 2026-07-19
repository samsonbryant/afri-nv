from __future__ import annotations

from django.urls import path

from apps.billing.interfaces.api.views import (
    CheckoutView,
    CouponValidateView,
    DodoWebhookView,
    InvoiceListView,
    ManualPaymentInstructionsView,
    ManualPaymentListCreateView,
    ManualPaymentSubmitView,
    PlanListView,
    PortalView,
    RefundView,
    SubscriptionView,
    UsageView,
)

app_name = "billing"

urlpatterns = [
    path("plans/", PlanListView.as_view(), name="plans"),
    path("subscription/", SubscriptionView.as_view(), name="subscription"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("portal/", PortalView.as_view(), name="portal"),
    path("invoices/", InvoiceListView.as_view(), name="invoices"),
    path("coupons/validate/", CouponValidateView.as_view(), name="coupon-validate"),
    path("refunds/", RefundView.as_view(), name="refunds"),
    path("usage/", UsageView.as_view(), name="usage"),
    path("webhooks/dodo/", DodoWebhookView.as_view(), name="dodo-webhook"),
    path(
        "manual-payments/instructions/",
        ManualPaymentInstructionsView.as_view(),
        name="manual-instructions",
    ),
    path("manual-payments/", ManualPaymentListCreateView.as_view(), name="manual-payments"),
    path(
        "manual-payments/<uuid:request_id>/submit/",
        ManualPaymentSubmitView.as_view(),
        name="manual-payment-submit",
    ),
]
