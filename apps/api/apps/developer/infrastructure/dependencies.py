from apps.developer.application.services import DeveloperService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_developer_service() -> DeveloperService:
    return DeveloperService(membership_repository=DjangoMembershipRepository())
