"""Organization repository interfaces."""

from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from apps.organizations.domain.entities import MembershipEntity, OrganizationEntity


class AbstractOrganizationRepository(ABC):
    @abstractmethod
    def get_by_id(self, org_id: UUID) -> OrganizationEntity | None: ...

    @abstractmethod
    def get_by_slug(self, slug: str) -> OrganizationEntity | None: ...

    @abstractmethod
    def list_for_user(self, user_id: UUID) -> list[OrganizationEntity]: ...

    @abstractmethod
    def create(self, *, name: str, slug: str, plan: str) -> OrganizationEntity: ...

    @abstractmethod
    def update(self, org: OrganizationEntity) -> OrganizationEntity: ...

    @abstractmethod
    def delete(self, org_id: UUID) -> None: ...


class AbstractMembershipRepository(ABC):
    @abstractmethod
    def get_by_id(self, membership_id: UUID) -> MembershipEntity | None: ...

    @abstractmethod
    def get(self, user_id: UUID, organization_id: UUID) -> MembershipEntity | None: ...

    @abstractmethod
    def list_for_organization(self, organization_id: UUID) -> list[MembershipEntity]: ...

    @abstractmethod
    def create(self, *, user_id: UUID, organization_id: UUID, role: str) -> MembershipEntity: ...

    @abstractmethod
    def update(self, membership: MembershipEntity) -> MembershipEntity: ...

    @abstractmethod
    def delete(self, membership_id: UUID) -> None: ...
