"""Marketing DTOs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(slots=True)
class AssetDTO:
    id: UUID
    organization_id: UUID
    type: str
    title: str
    content: str
    status: str
    metadata: dict
    created_by_id: UUID | None
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class CampaignDTO:
    id: UUID
    organization_id: UUID
    name: str
    channel: str
    status: str
    scheduled_at: datetime | None
    asset_id: UUID | None
    metrics: dict
    created_at: datetime
    updated_at: datetime
