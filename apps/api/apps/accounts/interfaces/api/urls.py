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
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", RefreshView.as_view(), name="refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("me/password/", ChangePasswordView.as_view(), name="change-password"),
    path("me/avatar/", AvatarUploadView.as_view(), name="avatar"),
]
