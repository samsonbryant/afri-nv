from __future__ import annotations

from django.contrib import admin

from apps.billing.infrastructure.models import (
    Coupon,
    Invoice,
    PaymentEvent,
    Plan,
    Subscription,
    UsageRecord,
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "amount_cents", "interval", "is_active")
    search_fields = ("code", "name")


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ("organization", "plan", "status", "dodo_subscription_id")
    list_filter = ("status",)
    search_fields = ("dodo_subscription_id", "organization__name", "plan__code")
    autocomplete_fields = ("organization", "plan")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("number", "organization", "amount_cents", "status", "issued_at")
    list_filter = ("status",)
    autocomplete_fields = ("organization", "subscription")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "percent_off", "amount_off", "times_redeemed", "valid_until")
    search_fields = ("code",)


@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ("provider", "event_type", "processed_at", "created_at")
    list_filter = ("provider", "event_type")


@admin.register(UsageRecord)
class UsageRecordAdmin(admin.ModelAdmin):
    list_display = ("organization", "metric", "quantity", "period_start", "period_end")
    list_filter = ("metric",)
    autocomplete_fields = ("organization",)
