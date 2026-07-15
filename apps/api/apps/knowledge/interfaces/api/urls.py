"""Knowledge API URL routes."""

from __future__ import annotations

from django.urls import path

from apps.knowledge.interfaces.api.views import (
    ConversationListCreateView,
    ConversationMessagesView,
    DocumentChunksView,
    DocumentDetailView,
    DocumentListCreateView,
    DocumentReprocessView,
)

app_name = "knowledge"

urlpatterns = [
    path("documents/", DocumentListCreateView.as_view(), name="documents"),
    path(
        "documents/<uuid:document_id>/",
        DocumentDetailView.as_view(),
        name="document-detail",
    ),
    path(
        "documents/<uuid:document_id>/reprocess/",
        DocumentReprocessView.as_view(),
        name="document-reprocess",
    ),
    path(
        "documents/<uuid:document_id>/chunks/",
        DocumentChunksView.as_view(),
        name="document-chunks",
    ),
    path("conversations/", ConversationListCreateView.as_view(), name="conversations"),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        ConversationMessagesView.as_view(),
        name="messages",
    ),
]
