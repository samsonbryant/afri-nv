"""Organization permission constants matrix."""

from __future__ import annotations

from apps.organizations.domain.entities import MembershipRole

# Permission → minimum roles that may perform the action.
PERMISSIONS: dict[str, frozenset[str]] = {
    "organization.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "organization.update": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "organization.delete": frozenset({MembershipRole.OWNER}),
    "members.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "members.create": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "members.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "invites.create": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "invites.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "invites.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "workflows.create": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "workflows.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "workflows.update": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "workflows.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "automations.create": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "automations.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "automations.run": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "documents.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "documents.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "documents.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "assistant.use": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "dashboard.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "knowledge.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "knowledge.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "knowledge.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "crm.create": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "crm.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "crm.update": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "crm.delete": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "support.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "support.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "support.update": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "marketing.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "marketing.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "reports.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "reports.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "meetings.create": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "meetings.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "agents.use": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "billing.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}),
    "billing.manage": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "analytics.read": frozenset(
        {MembershipRole.OWNER, MembershipRole.ADMIN, MembershipRole.MEMBER}
    ),
    "security.read": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
    "developer.manage": frozenset({MembershipRole.OWNER, MembershipRole.ADMIN}),
}


def role_has_permission(role: str, permission: str) -> bool:
    allowed = PERMISSIONS.get(permission)
    if allowed is None:
        return False
    return role in allowed
