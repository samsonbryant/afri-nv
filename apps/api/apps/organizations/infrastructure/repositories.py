"""Django organization repositories."""

from __future__ import annotations

from uuid import UUID

from apps.organizations.domain.entities import MembershipEntity, OrganizationEntity
from apps.organizations.domain.repositories import (
    AbstractMembershipRepository,
    AbstractOrganizationRepository,
)
from apps.organizations.infrastructure.models import Membership, Organization


class DjangoOrganizationRepository(AbstractOrganizationRepository):
    def get_by_id(self, org_id: UUID) -> OrganizationEntity | None:
        try:
            org = Organization.objects.get(pk=org_id)
        except Organization.DoesNotExist:
            return None
        return self._to_entity(org)

    def get_by_slug(self, slug: str) -> OrganizationEntity | None:
        try:
            org = Organization.objects.get(slug=slug)
        except Organization.DoesNotExist:
            return None
        return self._to_entity(org)

    def list_for_user(self, user_id: UUID) -> list[OrganizationEntity]:
        qs = Organization.objects.filter(memberships__user_id=user_id).distinct()
        return [self._to_entity(o) for o in qs]

    def create(self, *, name: str, slug: str, plan: str) -> OrganizationEntity:
        org = Organization.objects.create(name=name, slug=slug, plan=plan)
        return self._to_entity(org)

    def update(self, org: OrganizationEntity) -> OrganizationEntity:
        orm = Organization.objects.get(pk=org.id)
        orm.name = org.name
        orm.plan = org.plan
        orm.save(update_fields=["name", "plan", "updated_at"])
        return self._to_entity(orm)

    def delete(self, org_id: UUID) -> None:
        Organization.objects.filter(pk=org_id).delete()

    @staticmethod
    def _to_entity(org: Organization) -> OrganizationEntity:
        return OrganizationEntity(
            id=org.id,
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            created_at=org.created_at,
            updated_at=org.updated_at,
        )


class DjangoMembershipRepository(AbstractMembershipRepository):
    def get_by_id(self, membership_id: UUID) -> MembershipEntity | None:
        try:
            m = Membership.objects.get(pk=membership_id)
        except Membership.DoesNotExist:
            return None
        return self._to_entity(m)

    def get(self, user_id: UUID, organization_id: UUID) -> MembershipEntity | None:
        try:
            m = Membership.objects.get(user_id=user_id, organization_id=organization_id)
        except Membership.DoesNotExist:
            return None
        return self._to_entity(m)

    def list_for_organization(self, organization_id: UUID) -> list[MembershipEntity]:
        qs = Membership.objects.filter(organization_id=organization_id)
        return [self._to_entity(m) for m in qs]

    def create(self, *, user_id: UUID, organization_id: UUID, role: str) -> MembershipEntity:
        m = Membership.objects.create(
            user_id=user_id,
            organization_id=organization_id,
            role=role,
        )
        return self._to_entity(m)

    def update(self, membership: MembershipEntity) -> MembershipEntity:
        orm = Membership.objects.get(pk=membership.id)
        orm.role = membership.role
        orm.save(update_fields=["role", "updated_at"])
        return self._to_entity(orm)

    def delete(self, membership_id: UUID) -> None:
        Membership.objects.filter(pk=membership_id).delete()

    @staticmethod
    def _to_entity(m: Membership) -> MembershipEntity:
        return MembershipEntity(
            id=m.id,
            user_id=m.user_id,
            organization_id=m.organization_id,
            role=m.role,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
