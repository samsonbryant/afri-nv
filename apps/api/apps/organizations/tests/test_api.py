"""Organization API tests."""

from __future__ import annotations

import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.infrastructure.models import User
from apps.billing.infrastructure.dependencies import get_billing_service
from apps.organizations.infrastructure.models import Organization


@pytest.mark.django_db
@pytest.mark.integration
def test_organization_crud() -> None:
    user = User.objects.create_user(email="orgapi@novixa.ai", password="securepass123")
    client = APIClient()
    client.force_authenticate(user=user)

    create_resp = client.post(
        reverse("organizations:list-create"),
        {"name": "Nova Co", "slug": "nova-co", "plan": "free"},
        format="json",
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    org_id = create_resp.data["id"]

    list_resp = client.get(reverse("organizations:list-create"))
    assert list_resp.status_code == status.HTTP_200_OK
    assert len(list_resp.data) == 1

    detail_resp = client.get(reverse("organizations:detail", kwargs={"org_id": org_id}))
    assert detail_resp.status_code == status.HTTP_200_OK
    assert detail_resp.data["slug"] == "nova-co"


@pytest.mark.django_db
@pytest.mark.integration
def test_bootstrap_requires_trial_profile_and_logo() -> None:
    user = User.objects.create_user(email="onboarding@novixa.ai", password="securepass123")
    client = APIClient()
    client.force_authenticate(user=user)
    create = client.post(
        reverse("organizations:list-create"),
        {"name": "Onboard Co", "slug": "onboard-co"},
        format="json",
    )
    org_id = create.data["id"]

    initial = client.get(reverse("organizations:bootstrap"), {"organization_id": org_id})
    assert initial.data["next_step"] == "trial"

    get_billing_service().attach_card(
        user.id,
        org_id,
        payment_method_ref="pm_test_4242",
        card_last4="4242",
        card_brand="visa",
        plan_code="starter",
    )
    after_card = client.get(reverse("organizations:bootstrap"), {"organization_id": org_id})
    assert after_card.data["next_step"] == "profile"

    client.patch(
        reverse("organizations:detail", kwargs={"org_id": org_id}),
        {"industry": "Technology", "description": "Business automation software."},
        format="json",
    )
    image_bytes = io.BytesIO()
    Image.new("RGB", (64, 64), color="blue").save(image_bytes, format="PNG")
    logo = SimpleUploadedFile("logo.png", image_bytes.getvalue(), content_type="image/png")
    upload = client.patch(
        reverse("organizations:detail", kwargs={"org_id": org_id}),
        {"logo": logo},
        format="multipart",
    )
    assert upload.status_code == status.HTTP_200_OK
    assert upload.data["logo_url"]

    complete = client.post(
        reverse("organizations:complete-onboarding", kwargs={"org_id": org_id}),
        {},
        format="json",
    )
    assert complete.status_code == status.HTTP_200_OK
    assert complete.data["next_step"] == "dashboard"


@pytest.mark.django_db
@pytest.mark.integration
def test_product_api_rejects_incomplete_onboarding() -> None:
    user = User.objects.create_user(email="gate@novixa.ai", password="securepass123")
    client = APIClient()
    client.force_authenticate(user=user)
    create = client.post(
        reverse("organizations:list-create"),
        {"name": "Gate Co", "slug": "gate-co"},
        format="json",
    )
    org_id = create.data["id"]
    client.force_authenticate(user=None)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(user).access_token}")

    response = client.get(reverse("dashboard:overview"), {"organization_id": org_id})

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert response.data["error"]["code"] == "onboarding_trial_required"

    get_billing_service().attach_card(
        user.id,
        org_id,
        payment_method_ref="pm_test_gate",
        plan_code="starter",
    )
    Organization.objects.filter(pk=org_id).update(onboarding_completed_at=timezone.now())

    allowed = client.get(reverse("dashboard:overview"), {"organization_id": org_id})
    assert allowed.status_code == status.HTTP_200_OK
