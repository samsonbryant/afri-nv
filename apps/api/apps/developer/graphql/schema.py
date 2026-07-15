"""Strawberry GraphQL schema — read-only subset."""

from __future__ import annotations

from uuid import UUID

import strawberry
from strawberry.types import Info


@strawberry.type
class OrganizationType:
    id: strawberry.ID
    name: str
    slug: str
    plan: str


@strawberry.type
class WorkflowType:
    id: strawberry.ID
    organization_id: strawberry.ID
    name: str
    status: str
    description: str


@strawberry.type
class MeetingType:
    id: strawberry.ID
    organization_id: strawberry.ID
    title: str
    status: str
    provider: str
    meeting_url: str


def _request_user(info: Info):
    request = info.context.request
    user = getattr(request, "user", None)
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return user


@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Novixa GraphQL"

    @strawberry.field
    def health(self) -> str:
        return "ok"

    @strawberry.field
    def organizations(self, info: Info) -> list[OrganizationType]:
        user = _request_user(info)
        if user is None:
            return []
        from apps.organizations.infrastructure.models import Membership, Organization

        org_ids = Membership.objects.filter(user_id=user.id).values_list(
            "organization_id", flat=True
        )
        return [
            OrganizationType(id=str(o.id), name=o.name, slug=o.slug, plan=o.plan)
            for o in Organization.objects.filter(id__in=org_ids)[:50]
        ]

    @strawberry.field
    def organization(self, info: Info, id: strawberry.ID) -> OrganizationType | None:
        from apps.organizations.infrastructure.models import Organization

        try:
            org = Organization.objects.get(pk=UUID(str(id)))
        except (Organization.DoesNotExist, ValueError):
            return None
        return OrganizationType(id=str(org.id), name=org.name, slug=org.slug, plan=org.plan)

    @strawberry.field
    def workflows(self, info: Info, organization_id: strawberry.ID) -> list[WorkflowType]:
        from apps.workflows.infrastructure.models import Workflow

        try:
            org_id = UUID(str(organization_id))
        except ValueError:
            return []
        return [
            WorkflowType(
                id=str(w.id),
                organization_id=str(w.organization_id),
                name=w.name,
                status=w.status,
                description=w.description,
            )
            for w in Workflow.objects.filter(organization_id=org_id)[:50]
        ]

    @strawberry.field
    def meetings(self, info: Info, organization_id: strawberry.ID) -> list[MeetingType]:
        from apps.meetings.infrastructure.models import Meeting

        try:
            org_id = UUID(str(organization_id))
        except ValueError:
            return []
        return [
            MeetingType(
                id=str(m.id),
                organization_id=str(m.organization_id),
                title=m.title,
                status=m.status,
                provider=m.provider,
                meeting_url=m.meeting_url,
            )
            for m in Meeting.objects.filter(organization_id=org_id)[:50]
        ]


schema = strawberry.Schema(query=Query)
