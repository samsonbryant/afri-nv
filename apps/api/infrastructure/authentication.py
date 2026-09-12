"""JWT authentication with server-side subscription/onboarding enforcement."""

from __future__ import annotations

from django.utils import timezone
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.billing.infrastructure.models import Subscription
from apps.core.domain.exceptions import PermissionDeniedError
from apps.organizations.infrastructure.models import Membership, Organization


class OnboardingJWTAuthentication(JWTAuthentication):
    """Block product APIs until the selected workspace is fully entitled."""

    exempt_prefixes = (
        "/api/v1/auth/",
        "/api/v1/organizations/",
        "/api/v1/billing/",
        "/api/v1/admin/",
        "/api/v1/health/",
        "/api/v1/invites/",
    )

    def authenticate(self, request: Request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, _token = result
        if user.is_staff or user.is_superuser or request.path.startswith(self.exempt_prefixes):
            return result

        org_id = request.query_params.get("organization_id") or request.headers.get(
            "X-Organization-ID"
        )
        membership = (
            Membership.objects.filter(user_id=user.id, organization_id=org_id).first()
            if org_id
            else Membership.objects.filter(user_id=user.id).order_by("created_at").first()
        )
        if membership is None:
            self._deny("organization")

        organization = Organization.objects.filter(pk=membership.organization_id).first()
        subscription = (
            Subscription.objects.filter(organization_id=membership.organization_id)
            .exclude(status=Subscription.Status.CANCELLED)
            .order_by("-created_at")
            .first()
        )
        now = timezone.now()
        entitled = bool(
            subscription
            and (
                subscription.status == Subscription.Status.ACTIVE
                or (
                    subscription.status == Subscription.Status.TRIALING
                    and subscription.trial_end
                    and subscription.trial_end > now
                )
            )
        )
        payment_ready = bool(
            subscription
            and subscription.payment_method_ref
            and (
                (subscription.payment_method == "card" and subscription.auto_charge)
                or (
                    subscription.status == Subscription.Status.ACTIVE
                    and subscription.payment_method in {"mtn_momo", "orange_money"}
                )
            )
        )
        if not entitled or not payment_ready:
            self._deny("trial")
        if not organization or not organization.onboarding_completed_at:
            self._deny("profile")
        return result

    @staticmethod
    def _deny(next_step: str) -> None:
        raise PermissionDeniedError(
            "Complete subscription onboarding before using product APIs.",
            code=f"onboarding_{next_step}_required",
        )
