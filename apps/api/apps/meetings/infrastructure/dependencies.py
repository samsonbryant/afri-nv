from apps.meetings.application.services import MeetingService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository


def get_meeting_service() -> MeetingService:
    return MeetingService(membership_repository=DjangoMembershipRepository())
