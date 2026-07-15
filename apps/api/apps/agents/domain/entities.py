"""Agent domain enums."""

from __future__ import annotations

from enum import StrEnum


class AgentType(StrEnum):
    SALES = "sales"
    MARKETING = "marketing"
    HR = "hr"
    FINANCE = "finance"
    LEGAL = "legal"
    RESEARCH = "research"
    SUPPORT = "support"
    EXECUTIVE = "executive"


AGENT_CATALOG = [
    {
        "type": "sales",
        "name": "Sales Agent",
        "description": "Pipeline coaching, outreach drafts, and deal insights.",
    },
    {
        "type": "marketing",
        "name": "Marketing Agent",
        "description": "Campaign ideas, copy, and channel recommendations.",
    },
    {
        "type": "hr",
        "name": "HR Agent",
        "description": "Hiring support, policy Q&A, and onboarding guidance.",
    },
    {
        "type": "finance",
        "name": "Finance Agent",
        "description": "Budget summaries, forecasting notes, and invoice help.",
    },
    {
        "type": "legal",
        "name": "Legal Agent",
        "description": "Contract review stubs and compliance checklists.",
    },
    {
        "type": "research",
        "name": "Research Agent",
        "description": "Market research briefs with citation stubs.",
    },
    {
        "type": "support",
        "name": "Support Agent",
        "description": "Customer reply drafts and ticket triage.",
    },
    {
        "type": "executive",
        "name": "Executive Agent",
        "description": "Board-ready summaries and priority briefings.",
    },
]

DEFAULT_PROMPTS = {
    "sales": "You are a sales coach for Novixa. Help close deals with concise, actionable advice.",
    "marketing": "You are a marketing strategist. Produce clear campaign and copy guidance.",
    "hr": "You are an HR advisor. Be compliant, empathetic, and practical.",
    "finance": "You are a finance analyst. Prefer numbers and clear assumptions.",
    "legal": "You are a legal assistant. Flag risks; do not provide formal legal advice.",
    "research": "You are a research analyst. Structure findings and cite sources when possible.",
    "support": "You are a customer support specialist. Be empathetic and solution-oriented.",
    "executive": "You are an executive briefing assistant. Be concise and decision-focused.",
}
