"""Organization application services."""

from __future__ import annotations

from uuid import UUID

from apps.organizations.application.dto import (
    AddMemberDTO,
    CreateOrganizationDTO,
    MembershipDTO,
    OrganizationDTO,
    UpdateOrganizationDTO,
)
from apps.organizations.domain.entities import MembershipEntity, MembershipRole, OrganizationEntity
from apps.organizations.domain.exceptions import (
    InsufficientRoleError,
    MembershipNotFoundError,
    NotOrganizationMemberError,
    OrganizationNotFoundError,
    OrganizationSlugExistsError,
)
from apps.organizations.domain.repositories import (
    AbstractMembershipRepository,
    AbstractOrganizationRepository,
)

_ADMIN_ROLES = {MembershipRole.OWNER, MembershipRole.ADMIN}


class OrganizationService:
    def __init__(
        self,
        org_repository: AbstractOrganizationRepository,
        membership_repository: AbstractMembershipRepository,
    ) -> None:
        self._orgs = org_repository
        self._memberships = membership_repository

    def create(self, actor_id: UUID, data: CreateOrganizationDTO) -> OrganizationDTO:
        if self._orgs.get_by_slug(data.slug):
            raise OrganizationSlugExistsError()
        org = self._orgs.create(name=data.name, slug=data.slug, plan=data.plan)
        self._memberships.create(
            user_id=actor_id,
            organization_id=org.id,
            role=MembershipRole.OWNER.value,
        )
        return self._org_dto(org)

    def ensure_default(self, user_id: UUID, *, display_name: str = "") -> OrganizationDTO:
        """Return the user's first org, creating a personal workspace if needed."""
        existing = self.list_for_user(user_id)
        if existing:
            return existing[0]

        base = (display_name or "Personal").strip() or "Personal"
        name = f"{base}'s Workspace" if base.lower() != "personal" else "Personal Workspace"
        slug_base = (
            "".join(ch.lower() if ch.isalnum() else "-" for ch in base).strip("-") or "workspace"
        )
        slug = f"{slug_base}-{str(user_id).split('-')[0]}"
        # Collision-safe slug attempts
        for attempt in range(5):
            candidate = slug if attempt == 0 else f"{slug}-{attempt}"
            if self._orgs.get_by_slug(candidate) is None:
                return self.create(
                    user_id,
                    CreateOrganizationDTO(name=name, slug=candidate, plan="free"),
                )
        return self.create(
            user_id,
            CreateOrganizationDTO(name=name, slug=f"{slug}-{user_id.hex[:8]}", plan="free"),
        )

    def list_for_user(self, user_id: UUID) -> list[OrganizationDTO]:
        return [self._org_dto(o) for o in self._orgs.list_for_user(user_id)]

    def get(self, actor_id: UUID, org_id: UUID) -> OrganizationDTO:
        self._require_member(actor_id, org_id)
        org = self._orgs.get_by_id(org_id)
        if org is None:
            raise OrganizationNotFoundError()
        return self._org_dto(org)

    def update(self, actor_id: UUID, org_id: UUID, data: UpdateOrganizationDTO) -> OrganizationDTO:
        self._require_role(actor_id, org_id, _ADMIN_ROLES)
        org = self._orgs.get_by_id(org_id)
        if org is None:
            raise OrganizationNotFoundError()
        if data.name is not None:
            org.name = data.name
        if data.plan is not None:
            org.plan = data.plan
        return self._org_dto(self._orgs.update(org))

    def delete(self, actor_id: UUID, org_id: UUID) -> None:
        self._require_role(actor_id, org_id, {MembershipRole.OWNER})
        if self._orgs.get_by_id(org_id) is None:
            raise OrganizationNotFoundError()
        self._orgs.delete(org_id)

    def list_members(self, actor_id: UUID, org_id: UUID) -> list[MembershipDTO]:
        self._require_member(actor_id, org_id)
        return [self._membership_dto(m) for m in self._memberships.list_for_organization(org_id)]

    def add_member(self, actor_id: UUID, org_id: UUID, data: AddMemberDTO) -> MembershipDTO:
        self._require_role(actor_id, org_id, _ADMIN_ROLES)
        if self._orgs.get_by_id(org_id) is None:
            raise OrganizationNotFoundError()
        existing = self._memberships.get(data.user_id, org_id)
        if existing:
            return self._membership_dto(existing)
        membership = self._memberships.create(
            user_id=data.user_id,
            organization_id=org_id,
            role=data.role,
        )
        return self._membership_dto(membership)

    def remove_member(self, actor_id: UUID, org_id: UUID, membership_id: UUID) -> None:
        self._require_role(actor_id, org_id, _ADMIN_ROLES)
        membership = self._memberships.get_by_id(membership_id)
        if membership is None or membership.organization_id != org_id:
            raise MembershipNotFoundError()
        self._memberships.delete(membership_id)

    def _require_member(self, user_id: UUID, org_id: UUID) -> MembershipEntity:
        membership = self._memberships.get(user_id, org_id)
        if membership is None:
            raise NotOrganizationMemberError()
        return membership

    def _require_role(
        self, user_id: UUID, org_id: UUID, roles: set[MembershipRole]
    ) -> MembershipEntity:
        membership = self._require_member(user_id, org_id)
        if membership.role not in {r.value for r in roles}:
            raise InsufficientRoleError()
        return membership

    @staticmethod
    def _org_dto(org: OrganizationEntity) -> OrganizationDTO:
        return OrganizationDTO(
            id=org.id,
            name=org.name,
            slug=org.slug,
            plan=org.plan,
            created_at=org.created_at,
            updated_at=org.updated_at,
        )

    @staticmethod
    def _membership_dto(m: MembershipEntity) -> MembershipDTO:
        return MembershipDTO(
            id=m.id,
            user_id=m.user_id,
            organization_id=m.organization_id,
            role=m.role,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
