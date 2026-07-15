"""Organization domain exceptions."""

from __future__ import annotations

from apps.core.domain.exceptions import ConflictError, NotFoundError, PermissionDeniedError


class OrganizationNotFoundError(NotFoundError):
    default_message = "Organization not found."
    code = "organization_not_found"


class MembershipNotFoundError(NotFoundError):
    default_message = "Membership not found."
    code = "membership_not_found"


class OrganizationSlugExistsError(ConflictError):
    default_message = "Organization slug already exists."
    code = "organization_slug_exists"


class NotOrganizationMemberError(PermissionDeniedError):
    default_message = "You are not a member of this organization."
    code = "not_organization_member"


class InsufficientRoleError(PermissionDeniedError):
    default_message = "Insufficient organization role."
    code = "insufficient_role"
