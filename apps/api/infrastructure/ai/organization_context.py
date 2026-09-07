"""Shared, bounded business context for every organization-aware AI feature."""

from __future__ import annotations

from uuid import UUID


class OrganizationContextBuilder:
    """Build one consistent, bounded text profile for organization-aware models."""

    def __init__(self, *, max_chars: int = 4000) -> None:
        self.max_chars = max_chars

    def build(self, organization_id: str | UUID) -> str:
        from apps.organizations.infrastructure.models import Organization

        org = Organization.objects.filter(pk=organization_id).first()
        if org is None:
            return "Organization profile: not provided."

        context = org.business_context or {}
        logo_url = None
        if org.logo:
            try:
                logo_url = org.logo.url
            except Exception:
                logo_url = None
        fields = [
            ("Business", org.name),
            ("Industry", org.industry),
            ("About", org.description),
            ("Website", org.website),
            ("Phone", org.phone),
            ("Address", org.address),
            ("Products/services", context.get("products_services")),
            ("Target customers", context.get("target_customers")),
            ("Brand voice", context.get("brand_voice")),
            ("Goals", context.get("goals")),
            ("Automation priorities", context.get("automation_priorities")),
            ("Logo/brand asset", logo_url),
            ("Brand colors", context.get("brand_colors")),
            ("Brand style", context.get("brand_style")),
        ]
        lines = [f"{label}: {value}" for label, value in fields if value]
        return ("\n".join(lines) or "Organization profile: not provided.")[: self.max_chars]


def build_organization_context(organization_id: str | UUID, *, max_chars: int = 4000) -> str:
    return OrganizationContextBuilder(max_chars=max_chars).build(organization_id)


def with_organization_context(system: str, organization_id: str | UUID) -> str:
    return f"{system}\n\nOrganization profile:\n{build_organization_context(organization_id)}"
