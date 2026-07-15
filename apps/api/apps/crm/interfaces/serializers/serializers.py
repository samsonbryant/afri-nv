"""CRM serializers."""

from __future__ import annotations

from rest_framework import serializers

from apps.crm.application.dto import (
    ActivityDTO,
    CompanyDTO,
    ContactDTO,
    LeadDTO,
    NoteDTO,
    OpportunityDTO,
)
from apps.crm.domain.entities import ActivityType, LeadStatus, OpportunityStage


class CompanyWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    name = serializers.CharField(max_length=255)
    domain = serializers.CharField(required=False, allow_blank=True, default="")
    industry = serializers.CharField(required=False, allow_blank=True, default="")
    size = serializers.CharField(required=False, allow_blank=True, default="")
    website = serializers.URLField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    address = serializers.CharField(required=False, allow_blank=True, default="")
    metadata = serializers.DictField(required=False, default=dict)


class CompanyUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    domain = serializers.CharField(required=False, allow_blank=True)
    industry = serializers.CharField(required=False, allow_blank=True)
    size = serializers.CharField(required=False, allow_blank=True)
    website = serializers.URLField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.DictField(required=False)


class CompanySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    name = serializers.CharField()
    domain = serializers.CharField()
    industry = serializers.CharField()
    size = serializers.CharField()
    website = serializers.CharField()
    phone = serializers.CharField()
    address = serializers.CharField()
    metadata = serializers.DictField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: CompanyDTO | dict) -> dict:
        if isinstance(instance, CompanyDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "name": instance.name,
                "domain": instance.domain,
                "industry": instance.industry,
                "size": instance.size,
                "website": instance.website,
                "phone": instance.phone,
                "address": instance.address,
                "metadata": instance.metadata,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class ContactWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    company_id = serializers.UUIDField(required=False, allow_null=True)
    first_name = serializers.CharField(max_length=128)
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    title = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.CharField(required=False, default="active")


class ContactUpdateSerializer(serializers.Serializer):
    company_id = serializers.UUIDField(required=False, allow_null=True)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False)


class ContactSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    company_id = serializers.UUIDField(allow_null=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    phone = serializers.CharField()
    title = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: ContactDTO | dict) -> dict:
        if isinstance(instance, ContactDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "company_id": str(instance.company_id) if instance.company_id else None,
                "first_name": instance.first_name,
                "last_name": instance.last_name,
                "email": instance.email,
                "phone": instance.phone,
                "title": instance.title,
                "status": instance.status,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class LeadWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    company_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(max_length=255)
    source = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.ChoiceField(
        choices=[s.value for s in LeadStatus], required=False, default=LeadStatus.NEW.value
    )
    score = serializers.IntegerField(required=False, default=0)
    owner_id = serializers.UUIDField(required=False, allow_null=True)


class LeadUpdateSerializer(serializers.Serializer):
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    company_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False)
    source = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=[s.value for s in LeadStatus], required=False)
    score = serializers.IntegerField(required=False)
    owner_id = serializers.UUIDField(required=False, allow_null=True)


class LeadSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    contact_id = serializers.UUIDField(allow_null=True)
    company_id = serializers.UUIDField(allow_null=True)
    title = serializers.CharField()
    source = serializers.CharField()
    status = serializers.CharField()
    score = serializers.IntegerField()
    owner_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: LeadDTO | dict) -> dict:
        if isinstance(instance, LeadDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "contact_id": str(instance.contact_id) if instance.contact_id else None,
                "company_id": str(instance.company_id) if instance.company_id else None,
                "title": instance.title,
                "source": instance.source,
                "status": instance.status,
                "score": instance.score,
                "owner_id": str(instance.owner_id) if instance.owner_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class OpportunityWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    company_id = serializers.UUIDField()
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0)
    currency = serializers.CharField(required=False, default="USD")
    stage = serializers.ChoiceField(
        choices=[s.value for s in OpportunityStage],
        required=False,
        default=OpportunityStage.PROSPECTING.value,
    )
    probability = serializers.IntegerField(required=False, default=10)
    close_date = serializers.DateField(required=False, allow_null=True)
    owner_id = serializers.UUIDField(required=False, allow_null=True)


class OpportunityUpdateSerializer(serializers.Serializer):
    company_id = serializers.UUIDField(required=False)
    contact_id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(required=False)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    currency = serializers.CharField(required=False)
    stage = serializers.ChoiceField(choices=[s.value for s in OpportunityStage], required=False)
    probability = serializers.IntegerField(required=False)
    close_date = serializers.DateField(required=False, allow_null=True)
    owner_id = serializers.UUIDField(required=False, allow_null=True)


class OpportunitySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    company_id = serializers.UUIDField()
    contact_id = serializers.UUIDField(allow_null=True)
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    currency = serializers.CharField()
    stage = serializers.CharField()
    probability = serializers.IntegerField()
    close_date = serializers.DateField(allow_null=True)
    owner_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: OpportunityDTO | dict) -> dict:
        if isinstance(instance, OpportunityDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "company_id": str(instance.company_id),
                "contact_id": str(instance.contact_id) if instance.contact_id else None,
                "name": instance.name,
                "amount": str(instance.amount),
                "currency": instance.currency,
                "stage": instance.stage,
                "probability": instance.probability,
                "close_date": instance.close_date,
                "owner_id": str(instance.owner_id) if instance.owner_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class NoteWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    related_type = serializers.CharField(max_length=64)
    object_id = serializers.UUIDField()
    body = serializers.CharField()


class NoteUpdateSerializer(serializers.Serializer):
    related_type = serializers.CharField(required=False)
    object_id = serializers.UUIDField(required=False)
    body = serializers.CharField(required=False)


class NoteSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    related_type = serializers.CharField()
    object_id = serializers.UUIDField()
    body = serializers.CharField()
    author_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: NoteDTO | dict) -> dict:
        if isinstance(instance, NoteDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "related_type": instance.related_type,
                "object_id": str(instance.object_id),
                "body": instance.body,
                "author_id": str(instance.author_id) if instance.author_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)


class ActivityWriteSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=[t.value for t in ActivityType])
    subject = serializers.CharField(max_length=255)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    related_type = serializers.CharField(required=False, allow_blank=True, default="")
    related_id = serializers.UUIDField(required=False, allow_null=True)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)


class ActivityUpdateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[t.value for t in ActivityType], required=False)
    subject = serializers.CharField(required=False)
    due_at = serializers.DateTimeField(required=False, allow_null=True)
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    related_type = serializers.CharField(required=False, allow_blank=True)
    related_id = serializers.UUIDField(required=False, allow_null=True)
    assignee_id = serializers.UUIDField(required=False, allow_null=True)


class ActivitySerializer(serializers.Serializer):
    id = serializers.UUIDField()
    organization_id = serializers.UUIDField()
    type = serializers.CharField()
    subject = serializers.CharField()
    due_at = serializers.DateTimeField(allow_null=True)
    completed_at = serializers.DateTimeField(allow_null=True)
    related_type = serializers.CharField()
    related_id = serializers.UUIDField(allow_null=True)
    assignee_id = serializers.UUIDField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

    def to_representation(self, instance: ActivityDTO | dict) -> dict:
        if isinstance(instance, ActivityDTO):
            return {
                "id": str(instance.id),
                "organization_id": str(instance.organization_id),
                "type": instance.type,
                "subject": instance.subject,
                "due_at": instance.due_at,
                "completed_at": instance.completed_at,
                "related_type": instance.related_type,
                "related_id": str(instance.related_id) if instance.related_id else None,
                "assignee_id": str(instance.assignee_id) if instance.assignee_id else None,
                "created_at": instance.created_at,
                "updated_at": instance.updated_at,
            }
        return super().to_representation(instance)
