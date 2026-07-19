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
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository

logger = logging.getLogger("apps.assistant")


def _format_openai_error(exc: BaseException) -> str:
    text = str(exc)
    if "requires more credits" in text or "Error code: 402" in text or '"code": 402' in text:
        max_tokens = getattr(settings, "AI_MAX_TOKENS", 1024)
        return (
            "ai_credits — OpenRouter needs more credits (or a lower max_tokens). "
            f"Add credits at https://openrouter.ai/settings/credits, or set AI_MAX_TOKENS "
            f"(current default {max_tokens}) and optionally AI_DEFAULT_MODEL=gpt-4o-mini."
        )
    if "insufficient_quota" in text or "exceeded your current quota" in text:
        return "insufficient_quota — add payment method / credits in the OpenAI billing dashboard"
    if "invalid_api_key" in text or "Incorrect API key" in text:
        return (
            "invalid_api_key — this key was rejected by the AI endpoint. "
            "OpenAI keys start with sk- (not sk-or-). OpenRouter keys need "
            "OPENAI_BASE_URL=https://openrouter.ai/api/v1 (auto-detected for sk-or-*)."
        )
    if "model_not_found" in text or "does not exist" in text:
        return f"model error — check AI_DEFAULT_MODEL ({getattr(settings, 'AI_DEFAULT_MODEL', 'gpt-4o-mini')})"
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

        from infrastructure.ai.quota import record_ai_usage

        record_ai_usage(
            conversation.organization_id,
            tokens=tokens,
            feature="assistant",
            model=getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o-mini"),
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
        from infrastructure.ai.quota import (
            blocked_upgrade_reply,
            evaluate_free_tier,
            minimize_free_reply,
        )

        tier = evaluate_free_tier(conversation.organization_id)
        if tier.is_free and not tier.allowed:
            reply = blocked_upgrade_reply(user_content)
            return reply, [], max(10, len(reply.split()))

        api_key = getattr(settings, "OPENAI_API_KEY", "") or ""
        openai_error: str | None = None
        if api_key:
            try:
                content, citations, tokens = self._openai_reply(
                    conversation, user_content, api_key, max_tokens=tier.max_tokens
                )
                if tier.is_free:
                    content = minimize_free_reply(content, remaining=max(0, tier.remaining - 1))
                return content, citations, tokens
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
            is_openrouter = "openrouter" in openai_error.lower() or "ai_credits" in openai_error
            billing_hint = (
                "Add OpenRouter credits at https://openrouter.ai/settings/credits "
                "(or lower `AI_MAX_TOKENS` / use `gpt-4o-mini`)"
                if is_openrouter
                else "Fix billing/quota at https://platform.openai.com/settings/organization/billing"
            )
            reply = (
                f"**AI is not available right now.**\n\n"
                f"`{openai_error}`\n\n"
                f"> You asked: {user_content.strip()[:280]}\n\n"
                f"{billing_hint} and ensure `OPENAI_API_KEY` is set, then retry."
            )
        else:
            reply = (
                f"Quick take: {user_content.strip()[:160] or 'your question'}. "
                f"I can go deeper once you upgrade."
            )
        if tier.is_free:
            reply = minimize_free_reply(reply, remaining=max(0, tier.remaining - 1))
        approx_tokens = max(20, len(user_content.split()) + len(reply.split()))
        return reply, citations, approx_tokens

    def _openai_reply(
        self,
        conversation: Conversation,
        user_content: str,
        api_key: str,
        *,
        max_tokens: int,
    ) -> tuple[str, list[dict], int]:
        from infrastructure.ai.client import get_openai_client, resolve_chat_model

        client = get_openai_client(api_key)
        # Free tier: keep history short to stay within the small completion budget.
        history_limit = 6 if max_tokens <= 256 else 20
        history = list(
            Message.objects.filter(conversation=conversation).order_by("created_at")[:history_limit]
        )
        system = "You are Novixa, an AI business operating system assistant. Reply in markdown."
        if max_tokens <= 256:
            system += " Keep answers under 3 short sentences. No long lists."
        else:
            system += " Include practical next steps when useful."

        messages = [{"role": "system", "content": system}]
        for msg in history:
            if msg.role in ("user", "assistant", "system"):
                messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": user_content})

        completion = client.chat.completions.create(
            model=resolve_chat_model(getattr(settings, "AI_DEFAULT_MODEL", "gpt-4o-mini")),
            messages=messages,
            temperature=0.4,
            max_tokens=max_tokens,
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
