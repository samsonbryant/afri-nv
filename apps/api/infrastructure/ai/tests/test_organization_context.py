from __future__ import annotations

import pytest
from django.utils import timezone

from apps.billing.infrastructure.models import Plan, Subscription
from apps.organizations.infrastructure.models import Organization
from infrastructure.ai.organization_context import build_organization_context
from infrastructure.ai.quota import evaluate_free_tier


@pytest.mark.django_db
def test_context_builder_includes_complete_business_profile() -> None:
    org = Organization.objects.create(
        name="Context Co",
        slug="context-co",
        industry="Logistics",
        description="Moves critical goods.",
        website="https://context.example",
        phone="+1 555 0100",
        address="10 Market Street",
        business_context={
            "products_services": "Freight",
            "target_customers": "Retailers",
            "brand_voice": "Direct",
            "goals": "Reduce delays",
            "automation_priorities": "Shipment updates",
        },
    )

    context = build_organization_context(org.id)

    for value in (
        "Context Co",
        "Logistics",
        "Moves critical goods.",
        "Freight",
        "Retailers",
        "Direct",
        "Reduce delays",
        "Shipment updates",
    ):
        assert value in context


@pytest.mark.django_db
def test_context_builder_is_bounded() -> None:
    org = Organization.objects.create(
        name="Bounded Co",
        slug="bounded-co",
        description="x" * 5000,
    )
    assert len(build_organization_context(org.id, max_chars=250)) <= 250


@pytest.mark.django_db
def test_expired_trial_does_not_inherit_paid_organization_plan() -> None:
    org = Organization.objects.create(name="Expired Co", slug="expired-co", plan="growth")
    plan = Plan.objects.create(code="growth", name="Growth", amount_cents=14900)
    Subscription.objects.create(
        organization=org,
        plan=plan,
        status=Subscription.Status.PAST_DUE,
        trial_end=timezone.now(),
    )

    decision = evaluate_free_tier(org.id)

    assert decision.is_free is True
    assert decision.on_trial is False
