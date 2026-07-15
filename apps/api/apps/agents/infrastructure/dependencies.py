from apps.agents.application.services import AgentService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_agent_service() -> AgentService:
    return AgentService(membership_repository=DjangoMembershipRepository())
