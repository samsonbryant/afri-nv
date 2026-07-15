"""CRM domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import NotFoundError, ValidationError


class CompanyNotFoundError(NotFoundError):
    default_message = "Company not found."
    code = "company_not_found"


class ContactNotFoundError(NotFoundError):
    default_message = "Contact not found."
    code = "contact_not_found"


class LeadNotFoundError(NotFoundError):
    default_message = "Lead not found."
    code = "lead_not_found"


class OpportunityNotFoundError(NotFoundError):
    default_message = "Opportunity not found."
    code = "opportunity_not_found"


class NoteNotFoundError(NotFoundError):
    default_message = "Note not found."
    code = "note_not_found"


class ActivityNotFoundError(NotFoundError):
    default_message = "Activity not found."
    code = "activity_not_found"


class LeadAlreadyConvertedError(ValidationError):
    default_message = "Lead has already been converted."
    code = "lead_already_converted"
