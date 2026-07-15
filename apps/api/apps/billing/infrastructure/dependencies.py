from apps.billing.application.services import BillingService
from apps.organizations.infrastructure.repositories import DjangoMembershipRepository
from infrastructure.external.dodo import DodoPaymentsClient


def get_billing_service() -> BillingService:
    return BillingService(
        membership_repository=DjangoMembershipRepository(),
        dodo_client=DodoPaymentsClient(),
    )
