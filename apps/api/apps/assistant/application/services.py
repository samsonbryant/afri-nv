"""Assistant application services."""

from __future__ import annotations

import logging
from pathlib import Path
from uuid import UUID, uuid4

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone

from apps.assistant.application.dto import (
    ConversationDTO,
    CreateConversationDTO,
    MessageDTO,
    SendMessageDTO,
    SendMessageResultDTO,
    UpdateConversationDTO,
    UploadResultDTO,
)
from apps.assistant.domain.exceptions import ConversationNotFoundError, EmptyMessageError
from apps.assistant.infrastructure.models import Conversation, Message
from apps.dashboard.infrastructure.models import AiUsageRecord
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository

logger = logging.getLogger("apps.assistant")


def _format_openai_error(exc: BaseException) -> str:
    text = str(exc)
    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return "insufficient_quota — add payment method / credits in the OpenAI billing dashboard"
    if "invalid_api_key" in text or "Incorrect API key" in text:
        return "invalid_api_key — regenerate the key and update OPENAI_API_KEY"
    if "model_not_found" in text or "does not exist" in text:
        return f"model error — check AI_DEFAULT_MODEL ({getattr(settings, 'AI_DEFAULT_MODEL', 'gpt-4o')})"
    return text[:280]


class AssistantService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def list_conversations(self, actor_id: UUID, organization_id: UUID) -> list[ConversationDTO]:
        self._require_member(actor_id, organization_id)
        qs = Conversation.objects.filter(organization_id=organization_id, user_id=actor_id)
        return [self._conversation_dto(c) for c in qs]

    def create_conversation(self, actor_id: UUID, data: CreateConversationDTO) -> ConversationDTO:
        self._require_member(actor_id, data.organization_id)
        conversation = Conversation.objects.create(
            organization_id=data.organization_id,
            user_id=actor_id,
            title=data.title or "New conversation",
        )
        return self._conversation_dto(conversation)

    def get_conversation(self, actor_id: UUID, conversation_id: UUID) -> ConversationDTO:
        conversation = self._get_owned(actor_id, conversation_id)
        return self._conversation_dto(conversation)

    def update_conversation(
        self, actor_id: UUID, conversation_id: UUID, data: UpdateConversationDTO
    ) -> ConversationDTO:
        conversation = self._get_owned(actor_id, conversation_id)
        if data.title is not None:
            conversation.title = data.title
            conversation.save(update_fields=["title", "updated_at"])
        return self._conversation_dto(conversation)

    def delete_conversation(self, actor_id: UUID, conversation_id: UUID) -> None:
        conversation = self._get_owned(actor_id, conversation_id)
        conversation.delete()

    def list_messages(self, actor_id: UUID, conversation_id: UUID) -> list[MessageDTO]:
        conversation = self._get_owned(actor_id, conversation_id)
        return [self._message_dto(m) for m in Message.objects.filter(conversation=conversation)]

    def send_message(
        self, actor_id: UUID, conversation_id: UUID, data: SendMessageDTO
    ) -> SendMessageResultDTO:
        conversation = self._get_owned(actor_id, conversation_id)
        if not data.content.strip():
            raise EmptyMessageError()

        user_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=data.content,
            content_type=data.content_type or Message.ContentType.MARKDOWN,
            attachments=data.attachments or [],
            citations=[],
        )

        reply_content, citations, tokens = self._generate_reply(conversation, data.content)
        assistant_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=reply_content,
            content_type=Message.ContentType.MARKDOWN,
            attachments=[],
            citations=citations,
        )

        conversation.updated_at = timezone.now()
        if conversation.title == "New conversation":
            conversation.title = data.content.strip()[:80]
        conversation.save(update_fields=["title", "updated_at"])

        AiUsageRecord.objects.create(
            organization_id=conversation.organization_id,
            tokens=tokens,
            model=getattr(settings, "AI_DEFAULT_MODEL", "stub"),
            feature="assistant",
        )

        return SendMessageResultDTO(
            user_message=self._message_dto(user_message),
            assistant_message=self._message_dto(assistant_message),
        )

    def upload(self, actor_id: UUID, uploaded: UploadedFile) -> UploadResultDTO:
        ext = Path(uploaded.name or "file").suffix
        path = default_storage.save(
            f"assistant/{actor_id}/{uuid4().hex}{ext}",
            uploaded,
        )
        url = default_storage.url(path)
        return UploadResultDTO(
            url=url,
            name=uploaded.name or Path(path).name,
            content_type=getattr(uploaded, "content_type", None) or "application/octet-stream",
            size=int(getattr(uploaded, "size", 0) or 0),
        )

    def _generate_reply(
        self, conversation: Conversation, user_content: str
    ) -> tuple[str, list[dict], int]:
        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        openai_error: str | None = None
        if api_key:
            try:
                return self._openai_reply(conversation, user_content, api_key)
            except Exception as exc:
                logger.exception("OpenAI reply failed; falling back to stub.")
                openai_error = _format_openai_error(exc)
        elif not api_key:
            openai_error = "OPENAI_API_KEY is missing."

        citations = [
            {
                "title": "Novixa Docs — Automations",
                "url": "https://docs.novixa.ai/automations",
                "snippet": "Automations run workflows on schedules or events.",
            },
            {
                "title": "Novixa Docs — AI Assistant",
                "url": "https://docs.novixa.ai/assistant",
                "snippet": "Ask questions about your org knowledge base.",
            },
        ]
        if openai_error:
            reply = (
                f"**OpenAI is not available right now.**\n\n"
                f"`{openai_error}`\n\n"
                f"> You asked: {user_content.strip()[:280]}\n\n"
                f"Fix billing/quota at https://platform.openai.com/settings/organization/billing "
                f"and ensure `OPENAI_API_KEY` is set, then retry."
            )
        else:
            reply = (
                f"Here's a helpful response to your question.\n\n"
                f"> You asked: {user_content.strip()[:280]}\n\n"
                f"### Suggested next steps\n"
                f"1. Review your workflows\n"
                f"2. Check recent automation runs\n"
                f"3. Add documents to the knowledge base\n\n"
                f"I can refine this further if you share more context."
            )
        approx_tokens = max(50, len(user_content.split()) + len(reply.split()))
        return reply, citations, approx_tokens

    def _openai_reply(
        self, conversation: Conversation, user_content: str, api_key: str
    ) -> tuple[str, list[dict], int]:
        from openai import OpenAI

        client = OpenAI(api_key=api_key)
        history = list(
            Message.objects.filter(conversation=conversation).order_by("created_at")[:20]
        )
        messages = [
            {
                "role": "system",
                "content": (
                    "You are Novixa, an AI business operating system assistant. "
                    "Reply in markdown. Include practical next steps when useful."
                ),
            }
        ]
        for msg in history:
            if msg.role in ("user", "assistant", "system"):
                messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_content})

        completion = client.chat.completions.create(
            model=getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o"),
            messages=messages,
            temperature=0.4,
        )
        content = completion.choices[0].message.content or ""
        usage = getattr(completion, "usage", None)
        tokens = int(getattr(usage, "total_tokens", 0) or 0) or max(50, len(content.split()))
        citations = [
            {
                "title": "Novixa knowledge",
                "url": "https://docs.novixa.ai",
                "snippet": "Generated with organization context.",
            }
        ]
        return content, citations, tokens

    def _get_owned(self, actor_id: UUID, conversation_id: UUID) -> Conversation:
        try:
            conversation = Conversation.objects.get(pk=conversation_id)
        except Conversation.DoesNotExist as exc:
            raise ConversationNotFoundError() from exc
        if conversation.user_id != actor_id:
            raise ConversationNotFoundError()
        self._require_member(actor_id, conversation.organization_id)
        return conversation

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    @staticmethod
    def _conversation_dto(c: Conversation) -> ConversationDTO:
        return ConversationDTO(
            id=c.id,
            organization_id=c.organization_id,
            user_id=c.user_id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )

    @staticmethod
    def _message_dto(m: Message) -> MessageDTO:
        return MessageDTO(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            content_type=m.content_type,
            attachments=m.attachments or [],
            citations=m.citations or [],
            created_at=m.created_at,
        )
