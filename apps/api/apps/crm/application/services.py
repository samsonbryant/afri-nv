"""CRM application services."""

from __future__ import annotations

from decimal import Decimal
from typing import Any
from uuid import UUID

from django.utils import timezone

from apps.crm.application.dto import (
    ActivityDTO,
    CompanyDTO,
    ContactDTO,
    LeadDTO,
    NoteDTO,
    OpportunityDTO,
    PipelineDTO,
)
from apps.crm.domain.entities import OpportunityStage
from apps.crm.domain.exceptions import (
    ActivityNotFoundError,
    CompanyNotFoundError,
    ContactNotFoundError,
    LeadAlreadyConvertedError,
    LeadNotFoundError,
    NoteNotFoundError,
    OpportunityNotFoundError,
)
from apps.crm.infrastructure.models import (
    Company,
    Contact,
    CrmActivity,
    CrmNote,
    Lead,
    Opportunity,
)
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from infrastructure.ai.llm import complete


class CrmService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    # ── Companies ──────────────────────────────────────────────

    def list_companies(self, actor_id: UUID, organization_id: UUID) -> list[CompanyDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._company_dto(c) for c in Company.objects.filter(organization_id=organization_id)
        ]

    def create_company(self, actor_id: UUID, organization_id: UUID, data: dict) -> CompanyDTO:
        self._require_member(actor_id, organization_id)
        company = Company.objects.create(
            organization_id=organization_id, **self._company_fields(data)
        )
        return self._company_dto(company)

    def get_company(self, actor_id: UUID, company_id: UUID) -> CompanyDTO:
        company = self._get_company(company_id)
        self._require_member(actor_id, company.organization_id)
        return self._company_dto(company)

    def update_company(self, actor_id: UUID, company_id: UUID, data: dict) -> CompanyDTO:
        company = self._get_company(company_id)
        self._require_member(actor_id, company.organization_id)
        for key, value in self._company_fields(data, partial=True).items():
            setattr(company, key, value)
        company.save()
        return self._company_dto(company)

    def delete_company(self, actor_id: UUID, company_id: UUID) -> None:
        company = self._get_company(company_id)
        self._require_member(actor_id, company.organization_id)
        company.delete()

    # ── Contacts ───────────────────────────────────────────────

    def list_contacts(self, actor_id: UUID, organization_id: UUID) -> list[ContactDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._contact_dto(c) for c in Contact.objects.filter(organization_id=organization_id)
        ]

    def create_contact(self, actor_id: UUID, organization_id: UUID, data: dict) -> ContactDTO:
        self._require_member(actor_id, organization_id)
        contact = Contact.objects.create(
            organization_id=organization_id, **self._contact_fields(data)
        )
        return self._contact_dto(contact)

    def get_contact(self, actor_id: UUID, contact_id: UUID) -> ContactDTO:
        contact = self._get_contact(contact_id)
        self._require_member(actor_id, contact.organization_id)
        return self._contact_dto(contact)

    def update_contact(self, actor_id: UUID, contact_id: UUID, data: dict) -> ContactDTO:
        contact = self._get_contact(contact_id)
        self._require_member(actor_id, contact.organization_id)
        for key, value in self._contact_fields(data, partial=True).items():
            setattr(contact, key, value)
        contact.save()
        return self._contact_dto(contact)

    def delete_contact(self, actor_id: UUID, contact_id: UUID) -> None:
        contact = self._get_contact(contact_id)
        self._require_member(actor_id, contact.organization_id)
        contact.delete()

    # ── Leads ──────────────────────────────────────────────────

    def list_leads(self, actor_id: UUID, organization_id: UUID) -> list[LeadDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._lead_dto(lead) for lead in Lead.objects.filter(organization_id=organization_id)
        ]

    def create_lead(self, actor_id: UUID, organization_id: UUID, data: dict) -> LeadDTO:
        self._require_member(actor_id, organization_id)
        lead = Lead.objects.create(organization_id=organization_id, **self._lead_fields(data))
        return self._lead_dto(lead)

    def get_lead(self, actor_id: UUID, lead_id: UUID) -> LeadDTO:
        lead = self._get_lead(lead_id)
        self._require_member(actor_id, lead.organization_id)
        return self._lead_dto(lead)

    def update_lead(self, actor_id: UUID, lead_id: UUID, data: dict) -> LeadDTO:
        lead = self._get_lead(lead_id)
        self._require_member(actor_id, lead.organization_id)
        for key, value in self._lead_fields(data, partial=True).items():
            setattr(lead, key, value)
        lead.save()
        return self._lead_dto(lead)

    def delete_lead(self, actor_id: UUID, lead_id: UUID) -> None:
        lead = self._get_lead(lead_id)
        self._require_member(actor_id, lead.organization_id)
        lead.delete()

    def convert_lead(self, actor_id: UUID, lead_id: UUID) -> OpportunityDTO:
        lead = self._get_lead(lead_id)
        self._require_member(actor_id, lead.organization_id)
        if lead.status == Lead.Status.CONVERTED:
            raise LeadAlreadyConvertedError()

        company = lead.company
        if company is None:
            company = Company.objects.create(
                organization_id=lead.organization_id,
                name=lead.title or "Converted Company",
            )
            lead.company = company

        opportunity = Opportunity.objects.create(
            organization_id=lead.organization_id,
            company=company,
            contact=lead.contact,
            name=f"Opportunity: {lead.title}",
            amount=Decimal("0"),
            stage=Opportunity.Stage.QUALIFICATION,
            probability=25,
            owner_id=lead.owner_id or actor_id,
        )
        lead.status = Lead.Status.CONVERTED
        lead.save(update_fields=["status", "company", "updated_at"])
        return self._opportunity_dto(opportunity)

    # ── Opportunities ──────────────────────────────────────────

    def list_opportunities(self, actor_id: UUID, organization_id: UUID) -> list[OpportunityDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._opportunity_dto(o)
            for o in Opportunity.objects.filter(organization_id=organization_id)
        ]

    def create_opportunity(
        self, actor_id: UUID, organization_id: UUID, data: dict
    ) -> OpportunityDTO:
        self._require_member(actor_id, organization_id)
        company = self._get_company(data["company_id"])
        if company.organization_id != organization_id:
            raise CompanyNotFoundError()
        opp = Opportunity.objects.create(
            organization_id=organization_id,
            **self._opportunity_fields(data),
        )
        return self._opportunity_dto(opp)

    def get_opportunity(self, actor_id: UUID, opportunity_id: UUID) -> OpportunityDTO:
        opp = self._get_opportunity(opportunity_id)
        self._require_member(actor_id, opp.organization_id)
        return self._opportunity_dto(opp)

    def update_opportunity(
        self, actor_id: UUID, opportunity_id: UUID, data: dict
    ) -> OpportunityDTO:
        opp = self._get_opportunity(opportunity_id)
        self._require_member(actor_id, opp.organization_id)
        for key, value in self._opportunity_fields(data, partial=True).items():
            setattr(opp, key, value)
        opp.save()
        return self._opportunity_dto(opp)

    def delete_opportunity(self, actor_id: UUID, opportunity_id: UUID) -> None:
        opp = self._get_opportunity(opportunity_id)
        self._require_member(actor_id, opp.organization_id)
        opp.delete()

    def pipeline(self, actor_id: UUID, organization_id: UUID) -> PipelineDTO:
        self._require_member(actor_id, organization_id)
        stages: dict[str, list[OpportunityDTO]] = {s.value: [] for s in OpportunityStage}
        for opp in Opportunity.objects.filter(organization_id=organization_id):
            stages.setdefault(opp.stage, []).append(self._opportunity_dto(opp))
        return PipelineDTO(stages=stages)

    # ── Notes ──────────────────────────────────────────────────

    def list_notes(self, actor_id: UUID, organization_id: UUID) -> list[NoteDTO]:
        self._require_member(actor_id, organization_id)
        return [self._note_dto(n) for n in CrmNote.objects.filter(organization_id=organization_id)]

    def create_note(self, actor_id: UUID, organization_id: UUID, data: dict) -> NoteDTO:
        self._require_member(actor_id, organization_id)
        note = CrmNote.objects.create(
            organization_id=organization_id,
            related_type=data["related_type"],
            object_id=data["object_id"],
            body=data["body"],
            author_id=actor_id,
        )
        return self._note_dto(note)

    def get_note(self, actor_id: UUID, note_id: UUID) -> NoteDTO:
        note = self._get_note(note_id)
        self._require_member(actor_id, note.organization_id)
        return self._note_dto(note)

    def update_note(self, actor_id: UUID, note_id: UUID, data: dict) -> NoteDTO:
        note = self._get_note(note_id)
        self._require_member(actor_id, note.organization_id)
        if "body" in data:
            note.body = data["body"]
        if "related_type" in data:
            note.related_type = data["related_type"]
        if "object_id" in data:
            note.object_id = data["object_id"]
        note.save()
        return self._note_dto(note)

    def delete_note(self, actor_id: UUID, note_id: UUID) -> None:
        note = self._get_note(note_id)
        self._require_member(actor_id, note.organization_id)
        note.delete()

    # ── Activities ─────────────────────────────────────────────

    def list_activities(self, actor_id: UUID, organization_id: UUID) -> list[ActivityDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._activity_dto(a)
            for a in CrmActivity.objects.filter(organization_id=organization_id)
        ]

    def create_activity(self, actor_id: UUID, organization_id: UUID, data: dict) -> ActivityDTO:
        self._require_member(actor_id, organization_id)
        activity = CrmActivity.objects.create(
            organization_id=organization_id,
            **self._activity_fields(data),
        )
        return self._activity_dto(activity)

    def get_activity(self, actor_id: UUID, activity_id: UUID) -> ActivityDTO:
        activity = self._get_activity(activity_id)
        self._require_member(actor_id, activity.organization_id)
        return self._activity_dto(activity)

    def update_activity(self, actor_id: UUID, activity_id: UUID, data: dict) -> ActivityDTO:
        activity = self._get_activity(activity_id)
        self._require_member(actor_id, activity.organization_id)
        for key, value in self._activity_fields(data, partial=True).items():
            setattr(activity, key, value)
        activity.save()
        return self._activity_dto(activity)

    def delete_activity(self, actor_id: UUID, activity_id: UUID) -> None:
        activity = self._get_activity(activity_id)
        self._require_member(actor_id, activity.organization_id)
        activity.delete()

    def ai_follow_up(self, actor_id: UUID, activity_id: UUID) -> dict[str, Any]:
        activity = self._get_activity(activity_id)
        self._require_member(actor_id, activity.organization_id)
        body = complete(
            f"Write a concise professional follow-up email/note for CRM activity:\n"
            f"Type: {activity.type}\nSubject: {activity.subject}\n"
            f"Related: {activity.related_type} {activity.related_id}",
            system="You are a CRM assistant. Write brief, actionable follow-ups.",
        )
        note = CrmNote.objects.create(
            organization_id=activity.organization_id,
            related_type=activity.related_type or "activity",
            object_id=activity.related_id or activity.id,
            body=body,
            author_id=actor_id,
        )
        follow = CrmActivity.objects.create(
            organization_id=activity.organization_id,
            type=CrmActivity.Type.FOLLOW_UP,
            subject=f"Follow-up: {activity.subject}",
            related_type=activity.related_type,
            related_id=activity.related_id,
            assignee_id=activity.assignee_id or actor_id,
            due_at=timezone.now(),
        )
        return {
            "note": self._note_dto(note),
            "activity": self._activity_dto(follow),
            "content": body,
        }

    # ── Helpers ────────────────────────────────────────────────

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_company(self, company_id: UUID) -> Company:
        try:
            return Company.objects.get(pk=company_id)
        except Company.DoesNotExist as exc:
            raise CompanyNotFoundError() from exc

    def _get_contact(self, contact_id: UUID) -> Contact:
        try:
            return Contact.objects.get(pk=contact_id)
        except Contact.DoesNotExist as exc:
            raise ContactNotFoundError() from exc

    def _get_lead(self, lead_id: UUID) -> Lead:
        try:
            return Lead.objects.get(pk=lead_id)
        except Lead.DoesNotExist as exc:
            raise LeadNotFoundError() from exc

    def _get_opportunity(self, opportunity_id: UUID) -> Opportunity:
        try:
            return Opportunity.objects.get(pk=opportunity_id)
        except Opportunity.DoesNotExist as exc:
            raise OpportunityNotFoundError() from exc

    def _get_note(self, note_id: UUID) -> CrmNote:
        try:
            return CrmNote.objects.get(pk=note_id)
        except CrmNote.DoesNotExist as exc:
            raise NoteNotFoundError() from exc

    def _get_activity(self, activity_id: UUID) -> CrmActivity:
        try:
            return CrmActivity.objects.get(pk=activity_id)
        except CrmActivity.DoesNotExist as exc:
            raise ActivityNotFoundError() from exc

    @staticmethod
    def _company_fields(data: dict, partial: bool = False) -> dict:
        keys = ("name", "domain", "industry", "size", "website", "phone", "address", "metadata")
        defaults = {k: ({} if k == "metadata" else "") for k in keys}
        if partial:
            return {k: data[k] for k in keys if k in data}
        return {k: data.get(k, defaults[k]) for k in keys}

    @staticmethod
    def _contact_fields(data: dict, partial: bool = False) -> dict:
        mapping = {
            "company_id": "company_id",
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "email",
            "phone": "phone",
            "title": "title",
            "status": "status",
        }
        result = {}
        for src, dest in mapping.items():
            if src in data:
                result[dest] = data[src]
            elif (not partial and src == "first_name") or (
                not partial and src in ("last_name", "email", "phone", "title")
            ):
                result[dest] = data.get(src, "")
            elif not partial and src == "status":
                result[dest] = data.get(src, Contact.Status.ACTIVE)
            elif not partial and src == "company_id":
                result[dest] = data.get(src)
        return result

    @staticmethod
    def _lead_fields(data: dict, partial: bool = False) -> dict:
        keys = ("contact_id", "company_id", "title", "source", "status", "score", "owner_id")
        result = {}
        for k in keys:
            if k in data:
                result[k] = data[k]
            elif not partial:
                defaults = {
                    "title": "",
                    "source": "",
                    "status": Lead.Status.NEW,
                    "score": 0,
                    "contact_id": None,
                    "company_id": None,
                    "owner_id": None,
                }
                if k in defaults:
                    result[k] = data.get(k, defaults[k])
        return result

    @staticmethod
    def _opportunity_fields(data: dict, partial: bool = False) -> dict:
        keys = (
            "company_id",
            "contact_id",
            "name",
            "amount",
            "currency",
            "stage",
            "probability",
            "close_date",
            "owner_id",
        )
        result = {}
        for k in keys:
            if k in data:
                result[k] = data[k]
            elif not partial:
                defaults = {
                    "contact_id": None,
                    "name": "",
                    "amount": Decimal("0"),
                    "currency": "USD",
                    "stage": Opportunity.Stage.PROSPECTING,
                    "probability": 10,
                    "close_date": None,
                    "owner_id": None,
                }
                if k == "company_id":
                    result[k] = data["company_id"]
                elif k in defaults:
                    result[k] = data.get(k, defaults[k])
        return result

    @staticmethod
    def _activity_fields(data: dict, partial: bool = False) -> dict:
        keys = (
            "type",
            "subject",
            "due_at",
            "completed_at",
            "related_type",
            "related_id",
            "assignee_id",
        )
        result = {}
        for k in keys:
            if k in data:
                result[k] = data[k]
            elif not partial:
                defaults = {
                    "type": CrmActivity.Type.TASK,
                    "subject": "",
                    "due_at": None,
                    "completed_at": None,
                    "related_type": "",
                    "related_id": None,
                    "assignee_id": None,
                }
                result[k] = data.get(k, defaults[k])
        return result

    @staticmethod
    def _company_dto(c: Company) -> CompanyDTO:
        return CompanyDTO(
            id=c.id,
            organization_id=c.organization_id,
            name=c.name,
            domain=c.domain,
            industry=c.industry,
            size=c.size,
            website=c.website,
            phone=c.phone,
            address=c.address,
            metadata=c.metadata or {},
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _contact_dto(c: Contact) -> ContactDTO:
        return ContactDTO(
            id=c.id,
            organization_id=c.organization_id,
            company_id=c.company_id,
            first_name=c.first_name,
            last_name=c.last_name,
            email=c.email,
            phone=c.phone,
            title=c.title,
            status=c.status,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _lead_dto(lead: Lead) -> LeadDTO:
        return LeadDTO(
            id=lead.id,
            organization_id=lead.organization_id,
            contact_id=lead.contact_id,
            company_id=lead.company_id,
            title=lead.title,
            source=lead.source,
            status=lead.status,
            score=lead.score,
            owner_id=lead.owner_id,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
        )

    @staticmethod
    def _opportunity_dto(o: Opportunity) -> OpportunityDTO:
        return OpportunityDTO(
            id=o.id,
            organization_id=o.organization_id,
            company_id=o.company_id,
            contact_id=o.contact_id,
            name=o.name,
            amount=o.amount,
            currency=o.currency,
            stage=o.stage,
            probability=o.probability,
            close_date=o.close_date,
            owner_id=o.owner_id,
            created_at=o.created_at,
            updated_at=o.updated_at,
        )

    @staticmethod
    def _note_dto(n: CrmNote) -> NoteDTO:
        return NoteDTO(
            id=n.id,
            organization_id=n.organization_id,
            related_type=n.related_type,
            object_id=n.object_id,
            body=n.body,
            author_id=n.author_id,
            created_at=n.created_at,
            updated_at=n.updated_at,
        )

    @staticmethod
    def _activity_dto(a: CrmActivity) -> ActivityDTO:
        return ActivityDTO(
            id=a.id,
            organization_id=a.organization_id,
            type=a.type,
            subject=a.subject,
            due_at=a.due_at,
            completed_at=a.completed_at,
            related_type=a.related_type,
            related_id=a.related_id,
            assignee_id=a.assignee_id,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
