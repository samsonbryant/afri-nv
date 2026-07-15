"""Assistant API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.assistant.interfaces.api.views import (
    ConversationDetailView,
    ConversationListCreateView,
    MessageListCreateView,
    MessageStreamView,
    UploadView,
)

app_name = "assistant"

urlpatterns = [
    path("conversations/", ConversationListCreateView.as_view(), name="conversations"),
    path(
        "conversations/<uuid:conversation_id>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        MessageListCreateView.as_view(),
        name="messages",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/stream/",
        MessageStreamView.as_view(),
        name="messages-stream",
    ),
    path("uploads/", UploadView.as_view(), name="uploads"),
]
