"""Agents application services."""

from __future__ import annotations

from uuid import UUID

from apps.agents.application.dto import AgentDTO, AgentRunDTO
from apps.agents.domain.entities import AGENT_CATALOG, DEFAULT_PROMPTS
from apps.agents.domain.exceptions import AgentNotFoundError
from apps.agents.infrastructure.models import Agent, AgentRun
from apps.organizations.domain.exceptions import NotOrganizationMemberError
from apps.organizations.domain.repositories import AbstractMembershipRepository


class AgentService:
    def __init__(self, membership_repository: AbstractMembershipRepository) -> None:
        self._memberships = membership_repository

    def catalog(self) -> list[dict]:
        return list(AGENT_CATALOG)

    def list_agents(
        self, actor_id: UUID, organization_id: UUID, agent_type: str | None = None
    ) -> list[AgentDTO]:
        self._require_member(actor_id, organization_id)
        self._seed_defaults(organization_id)
        qs = Agent.objects.filter(organization_id=organization_id)
        if agent_type:
            qs = qs.filter(type=agent_type)
        return [self._agent_dto(a) for a in qs]

    def create_agent(self, actor_id: UUID, organization_id: UUID, data: dict) -> AgentDTO:
        self._require_member(actor_id, organization_id)
        agent_type = data["type"]
        agent = Agent.objects.create(
            organization_id=organization_id,
            type=agent_type,
            name=data.get("name") or f"{agent_type.title()} Agent",
            description=data.get("description", ""),
            system_prompt=data.get("system_prompt") or DEFAULT_PROMPTS.get(agent_type, ""),
            tools=data.get("tools") or [],
            is_active=data.get("is_active", True),
            config=data.get("config") or {},
        )
        return self._agent_dto(agent)

    def get_agent(self, actor_id: UUID, agent_id: UUID) -> AgentDTO:
        agent = self._get_agent(agent_id)
        self._require_member(actor_id, agent.organization_id)
        return self._agent_dto(agent)

    def update_agent(self, actor_id: UUID, agent_id: UUID, data: dict) -> AgentDTO:
        agent = self._get_agent(agent_id)
        self._require_member(actor_id, agent.organization_id)
        for key in ("name", "description", "system_prompt", "tools", "is_active", "config", "type"):
            if key in data:
                setattr(agent, key, data[key])
        agent.save()
        return self._agent_dto(agent)

    def run_agent(
        self, actor_id: UUID, agent_id: UUID, message: str, context: dict | None = None
    ) -> AgentRunDTO:
        agent = self._get_agent(agent_id)
        self._require_member(actor_id, agent.organization_id)
        run = AgentRun.objects.create(
            agent=agent,
            user_id=actor_id,
            input=message,
            status=AgentRun.Status.RUNNING,
        )
        output, tokens, citations = self._specialize_response(agent, message, context or {})
        run.output = output
        run.tokens_used = tokens
        run.citations = citations
        run.status = AgentRun.Status.SUCCEEDED
        run.save(update_fields=["output", "tokens_used", "citations", "status", "updated_at"])
        return self._run_dto(run)

    def list_runs(self, actor_id: UUID, agent_id: UUID) -> list[AgentRunDTO]:
        agent = self._get_agent(agent_id)
        self._require_member(actor_id, agent.organization_id)
        return [self._run_dto(r) for r in AgentRun.objects.filter(agent=agent)]

    def _seed_defaults(self, organization_id: UUID) -> None:
        if Agent.objects.filter(organization_id=organization_id).exists():
            return
        for item in AGENT_CATALOG:
            Agent.objects.create(
                organization_id=organization_id,
                type=item["type"],
                name=item["name"],
                description=item["description"],
                system_prompt=DEFAULT_PROMPTS[item["type"]],
                tools=[],
                is_active=True,
                config={},
            )

    def _specialize_response(
        self, agent: Agent, message: str, context: dict
    ) -> tuple[str, int, list]:
        from apps.organizations.infrastructure.models import Organization
        from infrastructure.ai.llm import complete
        from infrastructure.ai.quota import evaluate_free_tier, record_ai_usage

        org = Organization.objects.filter(pk=agent.organization_id).first()
        org_bits = []
        if org:
            org_bits.append(f"Business: {org.name}")
            if org.industry:
                org_bits.append(f"Industry: {org.industry}")
            if org.description:
                org_bits.append(f"About: {org.description[:800]}")
            if org.website:
                org_bits.append(f"Website: {org.website}")
            if org.business_context:
                org_bits.append(f"Context: {org.business_context}")
        ctx_bits = ", ".join(f"{k}={v}" for k, v in list(context.items())[:8])
        decision = evaluate_free_tier(agent.organization_id)
        if not decision.allowed:
            from infrastructure.ai.quota import blocked_upgrade_reply

            return blocked_upgrade_reply(message), 0, []

        system = (
            f"You are {agent.name}, a Novixa {agent.type} agent working in real time for this "
            f"organization. Be detailed, practical, and actionable.\n"
            f"Agent playbook:\n{agent.system_prompt}\n"
            f"Organization profile:\n" + ("\n".join(org_bits) or "Not provided yet.")
        )
        prompt = message.strip()
        if ctx_bits:
            prompt = f"{prompt}\n\nRuntime context: {ctx_bits}"
        try:
            body = complete(
                prompt,
                system=system,
                temperature=0.35,
                max_tokens=decision.max_tokens,
                organization_id=str(agent.organization_id),
            )
        except Exception:
            body = (
                f"[{agent.name}] I could not reach the AI provider just now. "
                f"Here is a structured draft based on your request:\n\n{message.strip()}"
            )
        record_ai_usage(
            agent.organization_id,
            tokens=max(12, len(body.split())),
            feature=f"agent:{agent.type}",
        )
        citations = [
            {
                "title": f"{agent.type} playbook",
                "url": f"https://novixa.ai/agents/{agent.type}",
            }
        ]
        if org:
            citations.append({"title": org.name, "url": org.website or ""})
        return body, max(12, len(body.split())), citations

    def _require_member(self, user_id: UUID, organization_id: UUID) -> None:
        if self._memberships.get(user_id, organization_id) is None:
            raise NotOrganizationMemberError()

    def _get_agent(self, agent_id: UUID) -> Agent:
        try:
            return Agent.objects.get(pk=agent_id)
        except Agent.DoesNotExist as exc:
            raise AgentNotFoundError() from exc

    @staticmethod
    def _agent_dto(a: Agent) -> AgentDTO:
        return AgentDTO(
            id=a.id,
            organization_id=a.organization_id,
            type=a.type,
            name=a.name,
            description=a.description,
            system_prompt=a.system_prompt,
            tools=a.tools or [],
            is_active=a.is_active,
            config=a.config or {},
            created_at=a.created_at,
            updated_at=a.updated_at,
        )

    @staticmethod
    def _run_dto(r: AgentRun) -> AgentRunDTO:
        return AgentRunDTO(
            id=r.id,
            agent_id=r.agent_id,
            user_id=r.user_id,
            input=r.input,
            output=r.output,
            status=r.status,
            tokens_used=r.tokens_used,
            citations=r.citations or [],
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
