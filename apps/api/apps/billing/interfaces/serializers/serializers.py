from __future__ import annotations

from rest_framework import serializers


class PlanSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    code = serializers.CharField()
    name = serializers.CharField()
    amount_cents = serializers.IntegerField()
    currency = serializers.CharField()
    interval = serializers.CharField()
    trial_days = serializers.IntegerField()
    features = serializers.DictField()
    is_active = serializers.BooleanField()


class SubscriptionSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    plan_id = serializers.UUIDField()
    plan_code = serializers.CharField()
    status = serializers.CharField()
    dodo_subscription_id = serializers.CharField()
    current_period_start = serializers.DateTimeField(allow_null=True)
    current_period_end = serializers.DateTimeField(allow_null=True)
    cancel_at_period_end = serializers.BooleanField()
    trial_end = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField()


class CheckoutSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    plan_code = serializers.CharField()
    coupon = serializers.CharField(required=False, allow_blank=True)


class PortalSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()


class InvoiceSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    subscription_id = serializers.UUIDField(allow_null=True)
    number = serializers.CharField()
    amount_cents = serializers.IntegerField()
    tax_cents = serializers.IntegerField()
    status = serializers.CharField()
    hosted_url = serializers.CharField()
    pdf_url = serializers.CharField()
    issued_at = serializers.DateTimeField(allow_null=True)
    paid_at = serializers.DateTimeField(allow_null=True)


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()


class RefundSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    invoice_id = serializers.UUIDField()
    amount_cents = serializers.IntegerField(required=False)


class UsageSerializer(serializers.Serializer):
    metric = serializers.CharField()
    quantity = serializers.IntegerField()
    period_start = serializers.DateTimeField()
    period_end = serializers.DateTimeField()
