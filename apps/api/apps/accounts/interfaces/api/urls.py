"""Accounts API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.accounts.interfaces.api.views import (
    AvatarUploadView,
    ChangePasswordView,
    LoginView,
    MeView,
    RefreshView,
    RegisterView,
    SessionListView,
    SessionRevokeView,
    TwoFactorConfirmView,
    TwoFactorDisableView,
    TwoFactorSetupView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/password/", ChangePasswordView.as_view(), name="change-password"),
    path("me/avatar/", AvatarUploadView.as_view(), name="avatar"),
    path("2fa/setup/", TwoFactorSetupView.as_view(), name="2fa-setup"),
    path("2fa/confirm/", TwoFactorConfirmView.as_view(), name="2fa-confirm"),
    path("2fa/disable/", TwoFactorDisableView.as_view(), name="2fa-disable"),
    path("sessions/", SessionListView.as_view(), name="sessions"),
    path("sessions/<str:session_id>/", SessionRevokeView.as_view(), name="session-revoke"),
]
