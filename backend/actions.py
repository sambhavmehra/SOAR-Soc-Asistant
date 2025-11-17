from typing import Dict, Any, Callable, Optional
from pydantic import BaseModel, Field
import os, requests

# Free intel providers (no paid TI)
GETIPINTEL_CONTACT = os.getenv("GETIPINTEL_CONTACT")   # free, needs contact email
OTX_API_KEY        = os.getenv("OTX_API_KEY")          # optional free key

# ----- Schemas -----
class DeepAnalysisIn(BaseModel):
    hosts: list[str] = Field(default_factory=list)
    window: str = "1h"
    sources: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)

class GenerateReportIn(BaseModel):
    incident_id: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    source_ip: Optional[str] = None
    notes: Optional[str] = None
    artifacts: dict = Field(default_factory=dict)

class IpReputationIn(BaseModel): ip: str
class UrlReputationIn(BaseModel): url: str

class FetchLogsIn(BaseModel):
    source: str = "siem"
    window: str = "1h"
    query: Optional[str] = None
    filters: dict = Field(default_factory=dict)

class ContainmentIn(BaseModel):
    host: str
    mode: str = "simulate"

class NotifyIn(BaseModel):
    channel: str = "oncall"
    message: Optional[str] = None
    metadata: dict = Field(default_factory=dict)

class TicketIn(BaseModel):
    project: str = "SEC"
    issue_type: str = "Incident"
    summary: Optional[str] = None
    description: Optional[str] = None
    fields: dict = Field(default_factory=dict)

# ----- Local deterministic handlers -----
def deep_analysis(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    data = DeepAnalysisIn(**payload)
    summary = "Correlated telemetry"
    if data.sources: summary += f" across {', '.join(data.sources)}"
    if data.window:  summary += f" within {data.window}"
    result_hosts = data.hosts or context.get("suspected_hosts", [])
    recs = []
    if result_hosts:  recs.append(f"Review {len(result_hosts)} host(s) for lateral movement")
    if "ioc" in context: recs.append("Block supplied IOCs at perimeter")
    return {
        "success": True, "reply": "Deep analysis complete.",
        "data": {
            "summary": summary, "affected_hosts": result_hosts, "sources": data.sources,
            "window": data.window, "tags": data.tags, "context_used": list(context.keys()),
            "recommendations": recs
        },
        "actions": [
            *([{"type":"check_ip","label":f"Reputation: {context['source_ip']}","data":{"ip":context["source_ip"]}}]
              if context.get("source_ip") else [])
        ]
    }

def generate_report(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = GenerateReportIn(**payload)
    report = {
        "incident_id": p.incident_id or context.get("incident_id"),
        "type":        p.type        or context.get("event_type"),
        "status":      p.status      or context.get("status") or "New",
        "source_ip":   p.source_ip   or context.get("source_ip"),
        "notes":       p.notes       or context.get("notes"),
        "artifacts":   p.artifacts   or context.get("artifacts", {}),
        "context_used": list(context.keys())
    }
    return {"success": True, "reply": "Incident report generated.", "data": report, "actions": []}

def check_ip(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = IpReputationIn(**payload); ip = p.ip
    out = {"ip": ip, "sources": {}}
    # 1) GetIPIntel (free)
    if GETIPINTEL_CONTACT:
        try:
            r = requests.get("https://check.getipintel.net/check.php",
                             params={"ip": ip, "contact": GETIPINTEL_CONTACT, "format": "json"}, timeout=12)
            if r.ok:
                j = r.json(); out["sources"]["getipintel"] = j
                score = j.get("result")
                if isinstance(score, (float, int)):
                    out["risk_score"] = float(score)
                    out["verdict_from_score"] = ("Malicious-leaning" if score >= 0.95
                                                 else "Suspicious" if score >= 0.85
                                                 else "Unclear" if score >= 0.65
                                                 else "Likely clean")
        except Exception as e:
            out["sources"]["getipintel_error"] = str(e)
    # 2) ip-api (free)
    try:
        r = requests.get(f"https://ip-api.com/json/{ip}",
                         params={"fields":"status,message,country,regionName,city,isp,org,as,query"}, timeout=10)
        if r.ok: out["sources"]["ip_api"] = r.json()
    except Exception as e:
        out["sources"]["ip_api_error"] = str(e)
    # 3) OTX (optional)
    if OTX_API_KEY:
        try:
            r = requests.get(f"https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general",
                             headers={"X-OTX-API-KEY": OTX_API_KEY}, timeout=12)
            if r.ok:
                j = r.json()
                out["sources"]["otx"] = {
                    "pulse_count": j.get("pulse_info", {}).get("count"),
                    "pulses": [p.get("name") for p in j.get("pulse_info", {}).get("pulses", [])][:5],
                    "reputation": j.get("reputation"),
                    "geo": j.get("geo"),
                }
        except Exception as e:
            out["sources"]["otx_error"] = str(e)
    return {"success": True, "reply": f"IP intelligence fetched for {ip}.", "data": out, "actions": []}

def check_url(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = UrlReputationIn(**payload); url = p.url
    out = {"url": url, "sources": {}}
    try:
        r = requests.post("https://urlhaus-api.abuse.ch/v1/url/", data={"url": url}, timeout=12)
        if r.ok:
            j = r.json(); out["sources"]["urlhaus"] = j
            q = j.get("query_status"); status = j.get("url_status")
            out["summary"] = ("URLhaus reports status: "+status if q=="ok"
                              else "URL not found in URLhaus." if q=="no_results"
                              else f"URLhaus status: {q}")
    except Exception as e:
        out["sources"]["urlhaus_error"] = str(e)
    if "summary" not in out:
        out["summary"] = "No third-party intel available (provider down or blocked)."
    return {"success": True, "reply": f"URL intelligence fetched for {url}.", "data": out, "actions": []}

def fetch_logs(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = FetchLogsIn(**payload)
    return {"success": True, "reply": f"Fetched logs from {p.source} for {p.window}.",
            "data": {"query": p.query, "filters": p.filters, "context_used": list(context.keys())}, "actions": []}

def containment(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = ContainmentIn(**payload)
    return {"success": True, "reply": f"Containment {p.mode} for host {p.host}.",
            "data": {"host": p.host, "mode": p.mode}, "actions": []}

def notify(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = NotifyIn(**payload)
    return {"success": True, "reply": f"Notified via {p.channel}.",
            "data": {"message": p.message, "metadata": p.metadata, "context_summary": list(context.keys())}, "actions": []}

def ticket(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    p = TicketIn(**payload)
    return {"success": True, "reply": "Ticket action accepted.",
            "data": {"project": p.project, "issue_type": p.issue_type, "summary": p.summary,
                     "description": p.description, "fields": p.fields}, "actions": []}

# NEW: generic Groq execution for any arbitrary option
def groq_exec(payload: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use when an option represents an ad-hoc action/instruction.
    payload should contain either:
      - {"action": "<name>", "params": {...}}
      - or any dict; we'll pass it through to Groq with context.
    """
    from rt_agent import GroqAgent   # local import to avoid cycles
    act  = payload.get("action") or payload.get("type") or "ad_hoc"
    data = payload.get("params") or {k:v for k,v in payload.items() if k not in ("action","type")}
    agent = GroqAgent()
    res = agent.execute_unknown(act, data, context)
    # ensure empty actions array for UI consistency (execution step)
    res["actions"] = res.get("actions") or []
    return res

# ---------- Registry & Capabilities ----------
REGISTRY: dict[str, Callable[[Dict[str,Any], Dict[str,Any]], Dict[str,Any]]] = {
    "deep_analysis": deep_analysis,
    "generate_report": generate_report,
    "check_ip": check_ip,
    "check_url": check_url,
    "fetch_logs": fetch_logs,
    "containment": containment,
    "notify": notify,
    "ticket": ticket,
    "groq_exec": groq_exec,          
}

CAPABILITIES: Dict[str, Dict[str, Any]] = {
    "deep_analysis":   {"inputs": {"hosts":"[ip]", "window":"str", "sources":"[str]", "tags":"[str]"}},
    "generate_report": {"inputs": {"incident_id":"str","type":"str","status":"str","source_ip":"ip","notes":"str","artifacts":"object"}},
    "check_ip":        {"inputs": {"ip":"ip"}},
    "check_url":       {"inputs": {"url":"url"}},
    "fetch_logs":      {"inputs": {"source":"str","window":"str","query":"str?","filters":"object"}},
    "containment":     {"inputs": {"host":"ip","mode":"simulate|enforce"}},
    "notify":          {"inputs": {"channel":"str","message":"str?","metadata":"object"}},
    "ticket":          {"inputs": {"project":"str","issue_type":"str","summary":"str?","description":"str?","fields":"object"}},
    "groq_exec":       {"inputs": {"action":"str","params":"object"}},  # generic, Groq-powered
}
