"""Dashboard application services."""

from __future__ import annotations

from datetime import timedelta
from uuid import UUID

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.ai_engine.infrastructure.models import Document
from apps.automations.infrastructure.models import AutomationRun
from apps.dashboard.application.dto import (
    ActivityFeedDTO,
    NotificationDTO,
    OverviewDTO,
    UsageSeriesDTO,
)
from apps.dashboard.domain.entities import ActivityItem, OverviewKPI, UsagePoint
from apps.dashboard.domain.exceptions import NotificationNotFoundError, OrganizationRequiredError
from apps.dashboard.infrastructure.models import AiUsageRecord, Notification
from apps.organizations.domain.exceptions import (
    NotOrganizationMemberError,
    OrganizationNotFoundError,
)
from apps.organizations.domain.repositories import (
    AbstractMembershipRepository,
    AbstractOrganizationRepository,
)
from apps.workflows.infrastructure.models import Workflow


class DashboardService:
    def __init__(
        self,
        org_repository: AbstractOrganizationRepository,
        membership_repository: AbstractMembershipRepository,
    ) -> None:
        self._orgs = org_repository
        self._memberships = membership_repository

    def overview(self, actor_id: UUID, organization_id: UUID) -> OverviewDTO:
        self._require_member(actor_id, organization_id)
        org = self._orgs.get_by_id(organization_id)
        if org is None:
            raise OrganizationNotFoundError()

        workflows_count = Workflow.objects.filter(organization_id=organization_id).count()
        automations_count = AutomationRun.objects.filter(organization_id=organization_id).count()
        ai_documents_count = Document.objects.filter(organization_id=organization_id).count()
        tokens_agg = AiUsageRecord.objects.filter(organization_id=organization_id).aggregate(
            total=Sum("tokens")
        )
        ai_tokens_used = int(tokens_agg["total"] or 0)
        members_count = self._memberships.count_for_organization(organization_id)

        return OverviewDTO(
            kpis=OverviewKPI(
                workflows_count=workflows_count,
                automations_count=automations_count,
                ai_documents_count=ai_documents_count,
                ai_tokens_used=ai_tokens_used,
                members_count=members_count,
                plan=org.plan,
                subscription_status="active" if org.plan != "free" else "free",
            )
        )

    def activity(
        self, actor_id: UUID, organization_id: UUID, *, limit: int = 25
    ) -> ActivityFeedDTO:
        self._require_member(actor_id, organization_id)
        items: list[ActivityItem] = []

        for run in AutomationRun.objects.filter(organization_id=organization_id).order_by(
            "-created_at"
        )[:limit]:
            items.append(
                ActivityItem(
                    id=f"run:{run.id}",
                    type="automation_run",
                    title=f"Automation {run.status}",
                    description=f"Workflow run finished with status {run.status}.",
                    created_at=run.created_at,
                    actor_id=run.triggered_by_id,
                    link=f"/automations/runs/{run.id}",
                )
            )

        for doc in Document.objects.filter(organization_id=organization_id).order_by("-created_at")[
            :limit
        ]:
            items.append(
                ActivityItem(
                    id=f"doc:{doc.id}",
                    type="document_created",
                    title="Document added",
                    description=doc.title,
                    created_at=doc.created_at,
                    actor_id=doc.created_by_id,
                    link=f"/ai/documents/{doc.id}",
                )
            )

        from apps.organizations.infrastructure.models import Membership

        for membership in Membership.objects.filter(organization_id=organization_id).order_by(
            "-created_at"
        )[:limit]:
            items.append(
                ActivityItem(
                    id=f"member:{membership.id}",
                    type="member_added",
                    title="Member joined",
                    description=f"Role: {membership.role}",
                    created_at=membership.created_at,
                    actor_id=membership.user_id,
                    link="/settings/members",
                )
            )

        items.sort(key=lambda i: i.created_at, reverse=True)
        return ActivityFeedDTO(items=items[:limit])

    def usage(self, actor_id: UUID, organization_id: UUID, *, days: int = 7) -> UsageSeriesDTO:
        self._require_member(actor_id, organization_id)
        days = 30 if days >= 30 else 7
        start = timezone.now() - timedelta(days=days - 1)

        run_rows = (
            AutomationRun.objects.filter(organization_id=organization_id, created_at__gte=start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
        )
        token_rows = (
            AiUsageRecord.objects.filter(organization_id=organization_id, created_at__gte=start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("tokens"))
        )
        runs_by_day = {r["day"]: r["count"] for r in run_rows}
        tokens_by_day = {r["day"]: int(r["total"] or 0) for r in token_rows}

        points: list[UsagePoint] = []
        today = timezone.now().date()
        for offset in range(days):
            d = today - timedelta(days=days - 1 - offset)
            points.append(
                UsagePoint(
                    date=d,
                    automations=runs_by_day.get(d, 0),
                    ai_tokens=tokens_by_day.get(d, 0),
                )
            )
        return UsageSeriesDTO(days=days, points=points)

    def list_notifications(self, user_id: UUID) -> list[NotificationDTO]:
        qs = Notification.objects.filter(user_id=user_id)
        return [self._notification_dto(n) for n in qs]

    def mark_read(self, user_id: UUID, notification_id: UUID) -> NotificationDTO:
        try:
            n = Notification.objects.get(pk=notification_id, user_id=user_id)
        except Notification.DoesNotExist as exc:
            raise NotificationNotFoundError() from exc
        if n.read_at is None:
            n.read_at = timezone.now()
            n.save(update_fields=["read_at", "updated_at"])
        return self._notification_dto(n)

    def mark_all_read(self, user_id: UUID) -> int:
        return Notification.objects.filter(user_id=user_id, read_at__isnull=True).update(
            read_at=timezone.now()
        )

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if organization_id is None:
            raise OrganizationRequiredError()
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _notification_dto(n: Notification) -> NotificationDTO:
        return NotificationDTO(
            id=n.id,
            user_id=n.user_id,
            organization_id=n.organization_id,
            title=n.title,
            body=n.body,
            type=n.type,
            link=n.link,
            read_at=n.read_at,
            created_at=n.created_at,
            is_read=n.read_at is not None,
        )
