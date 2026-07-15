"""CRM ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Company(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_companies",
    )
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, blank=True, default="")
    industry = models.CharField(max_length=128, blank=True, default="")
    size = models.CharField(max_length=64, blank=True, default="")
    website = models.URLField(blank=True, default="")
    phone = models.CharField(max_length=64, blank=True, default="")
    address = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "crm_company"
        ordering = ("name",)
        indexes = [models.Index(fields=["organization", "name"])]

    def __str__(self) -> str:
        return self.name


class Contact(BaseModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        LEAD = "lead", "Lead"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_contacts",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contacts",
    )
    first_name = models.CharField(max_length=128)
    last_name = models.CharField(max_length=128, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=64, blank=True, default="")
    title = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.ACTIVE, db_index=True
    )

    class Meta:
        db_table = "crm_contact"
        ordering = ("last_name", "first_name")
        indexes = [models.Index(fields=["organization", "email"])]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class Lead(BaseModel):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        QUALIFIED = "qualified", "Qualified"
        UNQUALIFIED = "unqualified", "Unqualified"
        CONVERTED = "converted", "Converted"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_leads",
    )
    contact = models.ForeignKey(
        Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    company = models.ForeignKey(
        Company, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    title = models.CharField(max_length=255)
    source = models.CharField(max_length=128, blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.NEW, db_index=True
    )
    score = models.IntegerField(default=0)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_leads",
    )

    class Meta:
        db_table = "crm_lead"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "status"])]

    def __str__(self) -> str:
        return self.title


class Opportunity(BaseModel):
    class Stage(models.TextChoices):
        PROSPECTING = "prospecting", "Prospecting"
        QUALIFICATION = "qualification", "Qualification"
        PROPOSAL = "proposal", "Proposal"
        NEGOTIATION = "negotiation", "Negotiation"
        CLOSED_WON = "closed_won", "Closed Won"
        CLOSED_LOST = "closed_lost", "Closed Lost"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_opportunities",
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="opportunities")
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="opportunities",
    )
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="USD")
    stage = models.CharField(
        max_length=32, choices=Stage.choices, default=Stage.PROSPECTING, db_index=True
    )
    probability = models.PositiveIntegerField(default=10)
    close_date = models.DateField(null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_opportunities",
    )

    class Meta:
        db_table = "crm_opportunity"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "stage"])]

    def __str__(self) -> str:
        return self.name


class CrmNote(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_notes",
    )
    related_type = models.CharField(max_length=64)
    object_id = models.UUIDField()
    body = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="crm_notes",
    )

    class Meta:
        db_table = "crm_note"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "related_type", "object_id"])]

    def __str__(self) -> str:
        return self.body[:40]


class CrmActivity(BaseModel):
    class Type(models.TextChoices):
        CALL = "call", "Call"
        EMAIL = "email", "Email"
        MEETING = "meeting", "Meeting"
        TASK = "task", "Task"
        FOLLOW_UP = "follow_up", "Follow Up"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="crm_activities",
    )
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    subject = models.CharField(max_length=255)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    related_type = models.CharField(max_length=64, blank=True, default="")
    related_id = models.UUIDField(null=True, blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="crm_activities",
    )

    class Meta:
        db_table = "crm_activity"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["organization", "type"])]

    def __str__(self) -> str:
        return self.subject
