from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from apps.security.application.services import SecurityService


def get_security_service() -> SecurityService:
    return SecurityService(membership_repository=DjangoMembershipRepository())
