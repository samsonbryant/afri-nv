"""Developer platform ORM models."""

from __future__ import annotations

from django.db import models

from infrastructure.persistence.base import BaseModel


class WebhookEndpoint(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="webhook_endpoints",
    )
    url = models.URLField()
    secret = models.CharField(max_length=255, blank=True, default="")
    events = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "developer_webhook_endpoint"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "is_active"])]

    def __str__(self) -> str:
        return self.url


class WebhookDelivery(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"

    endpoint = models.ForeignKey(
        WebhookEndpoint, on_delete=models.CASCADE, related_name="deliveries"
    )
    event = models.CharField(max_length=128)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    response_code = models.PositiveIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True, default="")
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "developer_webhook_delivery"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.event}:{self.status}"


class ApiKey(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    name = models.CharField(max_length=128)
    prefix = models.CharField(max_length=16, db_index=True)
    hashed_key = models.CharField(max_length=128)
    last_used_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "developer_api_key"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "prefix"])]

    def __str__(self) -> str:
        return f"{self.name}:{self.prefix}"
