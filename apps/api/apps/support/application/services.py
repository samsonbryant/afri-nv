"""Support application services."""

from __future__ import annotations

from uuid import UUID

from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository
from apps.support.application.dto import (
    ChannelDTO,
    SupportStatsDTO,
    TicketDTO,
    TicketMessageDTO,
)
from apps.support.domain.exceptions import ChannelNotFoundError, TicketNotFoundError
from apps.support.infrastructure.models import SupportChannel, Ticket, TicketMessage
from infrastructure.ai.llm import complete


class SupportService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    # Channels
    def list_channels(self, actor_id: UUID, organization_id: UUID) -> list[ChannelDTO]:
        self._require_member(actor_id, organization_id)
        return [
            self._channel_dto(c)
            for c in SupportChannel.objects.filter(organization_id=organization_id)
        ]

    def create_channel(self, actor_id: UUID, organization_id: UUID, data: dict) -> ChannelDTO:
        self._require_member(actor_id, organization_id)
        channel = SupportChannel.objects.create(
            organization_id=organization_id,
            type=data["type"],
            name=data["name"],
            config=data.get("config") or {},
            is_active=data.get("is_active", True),
        )
        return self._channel_dto(channel)

    def get_channel(self, actor_id: UUID, channel_id: UUID) -> ChannelDTO:
        channel = self._get_channel(channel_id)
        self._require_member(actor_id, channel.organization_id)
        return self._channel_dto(channel)

    def update_channel(self, actor_id: UUID, channel_id: UUID, data: dict) -> ChannelDTO:
        channel = self._get_channel(channel_id)
        self._require_member(actor_id, channel.organization_id)
        for key in ("type", "name", "config", "is_active"):
            if key in data:
                setattr(channel, key, data[key])
        channel.save()
        return self._channel_dto(channel)

    def delete_channel(self, actor_id: UUID, channel_id: UUID) -> None:
        channel = self._get_channel(channel_id)
        self._require_member(actor_id, channel.organization_id)
        channel.delete()

    # Tickets
    def list_tickets(self, actor_id: UUID, organization_id: UUID) -> list[TicketDTO]:
        self._require_member(actor_id, organization_id)
        return [self._ticket_dto(t) for t in Ticket.objects.filter(organization_id=organization_id)]

    def create_ticket(self, actor_id: UUID, organization_id: UUID, data: dict) -> TicketDTO:
        self._require_member(actor_id, organization_id)
        ticket = Ticket.objects.create(
            organization_id=organization_id,
            channel_id=data.get("channel_id"),
            subject=data["subject"],
            description=data.get("description", ""),
            status=data.get("status", Ticket.Status.OPEN),
            priority=data.get("priority", Ticket.Priority.MEDIUM),
            requester_email=data.get("requester_email", ""),
            requester_name=data.get("requester_name", ""),
            assignee_id=data.get("assignee_id"),
            tags=data.get("tags") or [],
        )
        if ticket.description:
            TicketMessage.objects.create(
                ticket=ticket,
                sender_type=TicketMessage.SenderType.CUSTOMER,
                body=ticket.description,
            )
        return self._ticket_dto(ticket)

    def get_ticket(self, actor_id: UUID, ticket_id: UUID) -> TicketDTO:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        return self._ticket_dto(ticket)

    def update_ticket(self, actor_id: UUID, ticket_id: UUID, data: dict) -> TicketDTO:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        for key in (
            "channel_id",
            "subject",
            "description",
            "status",
            "priority",
            "requester_email",
            "requester_name",
            "assignee_id",
            "tags",
        ):
            if key in data:
                setattr(ticket, key, data[key])
        ticket.save()
        return self._ticket_dto(ticket)

    def delete_ticket(self, actor_id: UUID, ticket_id: UUID) -> None:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        ticket.delete()

    def assign_ticket(self, actor_id: UUID, ticket_id: UUID, assignee_id: UUID | None) -> TicketDTO:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        ticket.assignee_id = assignee_id
        if ticket.status == Ticket.Status.OPEN:
            ticket.status = Ticket.Status.PENDING
        ticket.save(update_fields=["assignee_id", "status", "updated_at"])
        TicketMessage.objects.create(
            ticket=ticket,
            sender_type=TicketMessage.SenderType.SYSTEM,
            body=f"Ticket assigned to {assignee_id or 'unassigned'}.",
            is_internal=True,
        )
        return self._ticket_dto(ticket)

    def list_messages(self, actor_id: UUID, ticket_id: UUID) -> list[TicketMessageDTO]:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        return [self._message_dto(m) for m in TicketMessage.objects.filter(ticket=ticket)]

    def add_message(self, actor_id: UUID, ticket_id: UUID, data: dict) -> TicketMessageDTO:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender_type=data.get("sender_type", TicketMessage.SenderType.AGENT),
            body=data["body"],
            attachments=data.get("attachments") or [],
            is_internal=data.get("is_internal", False),
        )
        return self._message_dto(message)

    def ai_reply(self, actor_id: UUID, ticket_id: UUID, *, post: bool = True) -> dict:
        ticket = self._get_ticket(ticket_id)
        self._require_member(actor_id, ticket.organization_id)
        history = list(TicketMessage.objects.filter(ticket=ticket).order_by("created_at")[:20])
        transcript = "\n".join(f"{m.sender_type}: {m.body}" for m in history)
        draft = complete(
            f"Ticket: {ticket.subject}\nDescription: {ticket.description}\n\n"
            f"Conversation:\n{transcript or '(empty)'}\n\n"
            "Draft a helpful support reply.",
            system="You are a professional customer support agent for Novixa.",
        )
        message = None
        if post:
            message = TicketMessage.objects.create(
                ticket=ticket,
                sender_type=TicketMessage.SenderType.AI,
                body=draft,
            )
            if ticket.status == Ticket.Status.OPEN:
                ticket.status = Ticket.Status.PENDING
                ticket.save(update_fields=["status", "updated_at"])
        return {
            "draft": draft,
            "message": self._message_dto(message) if message else None,
        }

    def stats(self, actor_id: UUID, organization_id: UUID) -> SupportStatsDTO:
        self._require_member(actor_id, organization_id)
        qs = Ticket.objects.filter(organization_id=organization_id)
        by_priority = {
            p: qs.filter(priority=p).count() for p in ("low", "medium", "high", "urgent")
        }
        return SupportStatsDTO(
            total=qs.count(),
            open=qs.filter(status=Ticket.Status.OPEN).count(),
            pending=qs.filter(status=Ticket.Status.PENDING).count(),
            resolved=qs.filter(status=Ticket.Status.RESOLVED).count(),
            closed=qs.filter(status=Ticket.Status.CLOSED).count(),
            by_priority=by_priority,
        )

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_channel(self, channel_id: UUID) -> SupportChannel:
        try:
            return SupportChannel.objects.get(pk=channel_id)
        except SupportChannel.DoesNotExist as exc:
            raise ChannelNotFoundError() from exc

    def _get_ticket(self, ticket_id: UUID) -> Ticket:
        try:
            return Ticket.objects.get(pk=ticket_id)
        except Ticket.DoesNotExist as exc:
            raise TicketNotFoundError() from exc

    @staticmethod
    def _channel_dto(c: SupportChannel) -> ChannelDTO:
        return ChannelDTO(
            id=c.id,
            organization_id=c.organization_id,
            type=c.type,
            name=c.name,
            config=c.config or {},
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _ticket_dto(t: Ticket) -> TicketDTO:
        return TicketDTO(
            id=t.id,
            organization_id=t.organization_id,
            channel_id=t.channel_id,
            subject=t.subject,
            description=t.description,
            status=t.status,
            priority=t.priority,
            requester_email=t.requester_email,
            requester_name=t.requester_name,
            assignee_id=t.assignee_id,
            tags=t.tags or [],
            created_at=t.created_at,
            updated_at=t.updated_at,
        )

    @staticmethod
    def _message_dto(m: TicketMessage) -> TicketMessageDTO:
        return TicketMessageDTO(
            id=m.id,
            ticket_id=m.ticket_id,
            sender_type=m.sender_type,
            body=m.body,
            attachments=m.attachments or [],
            is_internal=m.is_internal,
            created_at=m.created_at,
        )
