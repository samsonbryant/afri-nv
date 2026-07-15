from apps.analytics.application.services import AnalyticsService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_analytics_service() -> AnalyticsService:
    return AnalyticsService(membership_repository=DjangoMembershipRepository())
