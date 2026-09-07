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
    from infrastructure.ai.organization_context import with_organization_context
    from infrastructure.ai.quota import record_ai_usage

    payload_preview = json.dumps(context, default=str)[:1500]
    full_prompt = (
        f"{prompt.strip() or 'Summarize the workflow input and suggest next steps.'}\n\n"
        f"Context JSON:\n{payload_preview}"
    )
    system = "You are Novixa workflow AI. Reply in concise markdown."
    if organization_id:
        system = with_organization_context(system, organization_id)
    text = complete(
        full_prompt,
        system=system,
        temperature=0.4,
        organization_id=organization_id,
    )
    if organization_id:
        record_ai_usage(organization_id, tokens=max(10, len(text.split())), feature="workflow")
    return text


def _run_http(config: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    """Call an external API in real time; auto-detect OpenAPI when discover=true."""
    url = str(config.get("url") or "").strip()
    discover = bool(config.get("discover") or config.get("detect_api"))
    if not url and discover:
        base = str(config.get("base_url") or context.get("api_base") or "").rstrip("/")
        if base:
            for path in (
                "/openapi.json",
                "/swagger.json",
                "/api/schema/",
                "/.well-known/openapi.json",
            ):
                probe = _http_call(f"{base}{path}", "GET", None)
                if probe.get("status") and int(probe["status"]) < 400:
                    return {
                        "detected": True,
                        "schema_url": f"{base}{path}",
                        "status": probe["status"],
                        "body_preview": str(probe.get("body") or "")[:2000],
                    }
            return {"detected": False, "reason": "no_openapi_found", "base_url": base}
        return {"skipped": True, "reason": "missing_url"}
    if not url:
        return {"skipped": True, "reason": "missing_url"}
    method = str(config.get("method") or "GET").upper()
    payload = config.get("body")
    if payload is None and method in {"POST", "PUT", "PATCH"}:
        payload = context.get("input") or context
    body = json.dumps(payload).encode("utf-8") if payload is not None and method != "GET" else None
    result = _http_call(
        url,
        method,
        body,
        headers=config.get("headers") if isinstance(config.get("headers"), dict) else None,
    )
    context["last_http"] = result
    return result


def _http_call(
    url: str,
    method: str,
    body: bytes | None,
    headers: dict[str, Any] | None = None,
) -> dict[str, Any]:
    hdrs = {"Content-Type": "application/json", "Accept": "application/json"}
    if headers:
        hdrs.update({str(k): str(v) for k, v in headers.items()})
    req = urllib_request.Request(url, data=body, method=method, headers=hdrs)
    try:
        with urllib_request.urlopen(req, timeout=20) as resp:
            raw = resp.read(12_000)
            return {
                "ok": True,
                "status": getattr(resp, "status", 200),
                "body": raw.decode("utf-8", errors="replace")[:6000],
                "url": url,
                "method": method,
            }
    except urllib_error.HTTPError as exc:
        detail = exc.read(4000).decode("utf-8", errors="replace") if exc.fp else ""
        return {
            "ok": False,
            "status": exc.code,
            "error": str(exc.reason),
            "body": detail[:2000],
            "url": url,
        }
    except urllib_error.URLError as exc:
        return {"ok": False, "error": str(exc), "url": url}


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
            elif subtype in {"http_request", "http", "detect_api", "api"}:
                step["result"] = _run_http(config, context)
                if step["result"].get("body") and config.get("respond_with_ai"):
                    reply = _run_ai(
                        str(config.get("prompt") or "Respond to the client using the API result."),
                        {**context, "api_result": step["result"]},
                        organization_id=organization_id,
                    )
                    step["result"]["client_response"] = reply
                    context["last_ai"] = reply
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
