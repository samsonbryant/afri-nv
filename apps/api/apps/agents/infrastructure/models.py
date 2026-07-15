"""Agents ORM models."""

from __future__ import annotations

from django.conf import settings
from django.db import models

from infrastructure.persistence.base import BaseModel


class Agent(BaseModel):
    class Type(models.TextChoices):
        SALES = "sales", "Sales"
        MARKETING = "marketing", "Marketing"
        HR = "hr", "HR"
        FINANCE = "finance", "Finance"
        LEGAL = "legal", "Legal"
        RESEARCH = "research", "Research"
        SUPPORT = "support", "Support"
        EXECUTIVE = "executive", "Executive"

    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="agents"
    )
    type = models.CharField(max_length=32, choices=Type.choices, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    system_prompt = models.TextField(blank=True, default="")
    tools = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "agents_agent"
        ordering = ("type", "name")
        indexes = [models.Index(fields=["organization", "type"])]

    def __str__(self) -> str:
        return self.name


class AgentRun(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="runs")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agent_runs",
    )
    input = models.TextField()
    output = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    tokens_used = models.PositiveIntegerField(default=0)
    citations = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "agents_agent_run"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.agent_id}:{self.status}"


class AgentMemory(BaseModel):
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="memories")
    key = models.CharField(max_length=255)
    value = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "agents_agent_memory"
        unique_together = (("agent", "key"),)
        ordering = ("key",)

    def __str__(self) -> str:
        return f"{self.agent_id}:{self.key}"
