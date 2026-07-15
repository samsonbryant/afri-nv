"""Accounts service tests."""

from __future__ import annotations

import pytest

from apps.accounts.application.dto import LoginDTO, RegisterUserDTO
from apps.accounts.domain.exceptions import EmailAlreadyExistsError, InvalidCredentialsError
from apps.accounts.infrastructure.dependencies import get_auth_service


@pytest.mark.django_db
@pytest.mark.unit
def test_register_and_login() -> None:
    service = get_auth_service()
    user, tokens = service.register(
        RegisterUserDTO(
            email="alice@novixa.ai",
            password="securepass123",
            first_name="Alice",
            last_name="Novixa",
        )
    )
    assert user.email == "alice@novixa.ai"
    assert tokens.access
    assert tokens.refresh

    logged_in, login_tokens = service.login(
        LoginDTO(email="alice@novixa.ai", password="securepass123")
    )
    assert logged_in.id == user.id
    assert login_tokens.access


@pytest.mark.django_db
@pytest.mark.unit
def test_duplicate_email_raises() -> None:
    service = get_auth_service()
    dto = RegisterUserDTO(email="dup@novixa.ai", password="securepass123")
    service.register(dto)
    with pytest.raises(EmailAlreadyExistsError):
        service.register(dto)


@pytest.mark.django_db
@pytest.mark.unit
def test_invalid_login_raises() -> None:
    service = get_auth_service()
    with pytest.raises(InvalidCredentialsError):
        service.login(LoginDTO(email="missing@novixa.ai", password="nope"))
