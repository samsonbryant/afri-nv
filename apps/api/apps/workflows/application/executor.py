"""Execute workflow graphs (nodes/edges) for automation runs."""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import Any
from urllib import error as urllib_error, request as urllib_request

logger = logging.getLogger("apps.workflows.executor")


def _node_subtype(node: dict[str, Any]) -> str:
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    subtype = str(data.get("subtype") or data.get("type") or node.get("type") or "").strip()
    return subtype


def _node_kind(node: dict[str, Any]) -> str:
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    return str(data.get("kind") or "").strip().lower()


def _node_label(node: dict[str, Any]) -> str:
    data = node.get("data") if isinstance(node.get("data"), dict) else {}
    return str(data.get("label") or node.get("id") or "node")


def _topo_order(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {str(n.get("id")): n for n in nodes if n.get("id") is not None}
    incoming: dict[str, int] = dict.fromkeys(by_id, 0)
    outgoing: dict[str, list[str]] = {nid: [] for nid in by_id}
    for edge in edges:
        src = str(edge.get("source") or "")
        tgt = str(edge.get("target") or "")
        if src in by_id and tgt in by_id:
            outgoing[src].append(tgt)
            incoming[tgt] = incoming.get(tgt, 0) + 1

    queue = [nid for nid, count in incoming.items() if count == 0]
    ordered: list[dict[str, Any]] = []
    while queue:
        nid = queue.pop(0)
        ordered.append(by_id[nid])
        for nxt in outgoing.get(nid, []):
            incoming[nxt] -= 1
            if incoming[nxt] == 0:
                queue.append(nxt)

    # Append any disconnected leftover nodes
    seen = {str(n.get("id")) for n in ordered}
    for nid, node in by_id.items():
        if nid not in seen:
            ordered.append(node)
    return ordered


def _run_ai(prompt: str, context: dict[str, Any], organization_id: str | None = None) -> str:
    from infrastructure.ai.llm import complete
    from infrastructure.ai.quota import record_ai_usage

    payload_preview = json.dumps(context, default=str)[:1500]
    full_prompt = (
        f"{prompt.strip() or 'Summarize the workflow input and suggest next steps.'}\n\n"
        f"Context JSON:\n{payload_preview}"
    )
    text = complete(
        full_prompt,
        system="You are Novixa workflow AI. Reply in concise markdown.",
        temperature=0.4,
        organization_id=organization_id,
    )
    if organization_id:
        record_ai_usage(organization_id, tokens=max(10, len(text.split())), feature="workflow")
    return text


def _run_http(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    url = str(config.get("url") or "").strip()
    if not url:
        return {"skipped": True, "reason": "missing_url"}
    method = str(config.get("method") or "GET").upper()
    body = json.dumps(context).encode("utf-8") if method in {"POST", "PUT", "PATCH"} else None
    req = urllib_request.Request(
        url,
        data=body,
        method=method,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib_request.urlopen(req, timeout=15) as resp:
            raw = resp.read(8_000)
            return {
                "status": getattr(resp, "status", 200),
                "body": raw.decode("utf-8", errors="replace")[:4000],
            }
    except urllib_error.URLError as exc:
        return {"error": str(exc)}


def execute_workflow_definition(
    definition: dict[str, Any] | None,
    input_payload: dict[str, Any] | None = None,
    *,
    organization_id: str | None = None,
) -> dict[str, Any]:
    """Walk the workflow graph and execute action nodes."""
    definition = definition if isinstance(definition, dict) else {}
    nodes = definition.get("nodes") if isinstance(definition.get("nodes"), list) else []
    edges = definition.get("edges") if isinstance(definition.get("edges"), list) else []
    context: dict[str, Any] = {
        "input": input_payload or {},
        "started_at": datetime.now(tz=UTC).isoformat(),
    }
    steps: list[dict[str, Any]] = []

    if not nodes:
        return {
            "mode": "live",
            "processed": True,
            "warning": "Workflow has no nodes; echoed input only.",
            "echo": input_payload or {},
            "steps": steps,
            "completed_at": datetime.now(tz=UTC).isoformat(),
        }

    for node in _topo_order(nodes, edges):
        subtype = _node_subtype(node)
        kind = _node_kind(node)
        label = _node_label(node)
        data = node.get("data") if isinstance(node.get("data"), dict) else {}
        config = data.get("config") if isinstance(data.get("config"), dict) else {}
        step: dict[str, Any] = {
            "id": str(node.get("id")),
            "label": label,
            "kind": kind or "unknown",
            "subtype": subtype,
        }

        try:
            if kind == "trigger" or subtype in {"manual", "webhook", "schedule", "record_created"}:
                step["result"] = {"ok": True, "trigger": subtype or "trigger"}
            elif subtype in {"ai", "ai_generate"} or (kind == "action" and "ai" in subtype):
                prompt = str(config.get("prompt") or data.get("description") or label)
                text = _run_ai(prompt, context, organization_id=organization_id)
                step["result"] = {"text": text}
                context["last_ai"] = text
            elif subtype in {"http_request", "http"}:
                step["result"] = _run_http(config, context)
            elif subtype in {"send_email", "email", "notify", "create_task"}:
                step["result"] = {
                    "queued": True,
                    "action": subtype,
                    "config": {
                        k: config.get(k)
                        for k in ("to", "subject", "title", "message")
                        if k in config
                    },
                }
            elif subtype in {"if", "if_else"} or kind == "condition":
                step["result"] = {"branch": "default", "expression": config.get("expression", "")}
            else:
                step["result"] = {"ok": True, "passthrough": True, "subtype": subtype}
        except Exception as exc:
            logger.exception("workflow_node_failed", extra={"node": step["id"], "subtype": subtype})
            step["error"] = str(exc)[:500]
            steps.append(step)
            return {
                "mode": "live",
                "processed": False,
                "failed_at": step["id"],
                "steps": steps,
                "context": context,
                "completed_at": datetime.now(tz=UTC).isoformat(),
            }

        steps.append(step)

    return {
        "mode": "live",
        "processed": True,
        "steps": steps,
        "context": context,
        "completed_at": datetime.now(tz=UTC).isoformat(),
    }
