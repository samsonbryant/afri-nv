"""DRF permission classes for Novixa."""

from __future__ import annotations

from rest_framework.permissions import BasePermission, IsAuthenticated  # noqa: F401
from rest_framework.request import Request
from rest_framework.views import APIView

from apps.organizations.domain.permissions import role_has_permission
from apps.organizations.infrastructure.models import Membership


class HasOrgRole(BasePermission):
    """
    Require authenticated membership with a permission key.

    Views should set ``org_permission`` (e.g. ``"invites.create"``) and resolve
    ``organization_id`` from kwargs (`org_id`) or query/body (`organization_id`).
    """

    message = "You do not have permission to perform this action in this organization."

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        permission = getattr(view, "org_permission", None)
        if not permission:
            return True

        org_id = (
            view.kwargs.get("org_id")
            or request.query_params.get("organization_id")
            or request.data.get("organization_id")
        )
        if not org_id:
            return False

        membership = (
            Membership.objects.filter(user_id=request.user.id, organization_id=org_id)
            .only("role")
            .first()
        )
        if membership is None:
            return False
        return role_has_permission(membership.role, permission)
