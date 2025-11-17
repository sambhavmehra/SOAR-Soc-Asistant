# backend/services/n8n.py
import logging
import time
import json
import zlib
import gzip
import requests
import re
import socket
from urllib.parse import urlencode, urlparse, parse_qsl, urlunparse
from typing import Optional, Tuple, Dict, Any

from config import Config

logger = logging.getLogger(__name__)

# ---------- HTTP defaults ----------
# Allow compression; we'll decode ourselves (handles Cloudflare's Brotli).
DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br",
    # Some edges/CDNs reject requests without a browsery UA.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
}

# Optional brotli support (recommended: pip install brotli or brotlicffi)
try:
    import brotli as _brotli  # pip install brotli
except Exception:  # pragma: no cover
    _brotli = None


def _decode_bytes(content: bytes, encoding: Optional[str], fallback_charset: str = "utf-8") -> str:
    """Decode response bytes using Content-Encoding, with graceful fallbacks."""
    enc = (encoding or "").lower()
    try:
        if enc == "br":
            if not _brotli:
                try:
                    return content.decode(fallback_charset, errors="replace")
                finally:
                    logger.warning("Brotli response seen but 'brotli' not installed. Run: pip install brotli")
            data = _brotli.decompress(content)
            return data.decode(fallback_charset, errors="replace")
        elif enc == "gzip":
            return gzip.decompress(content).decode(fallback_charset, errors="replace")
        elif enc == "deflate":
            try:
                return zlib.decompress(content, -zlib.MAX_WBITS).decode(fallback_charset, errors="replace")
            except zlib.error:
                return zlib.decompress(content).decode(fallback_charset, errors="replace")
        else:
            return content.decode(fallback_charset, errors="replace")
    except Exception:
        try:
            return content.decode(fallback_charset, errors="replace")
        except Exception:
            return content.decode("latin-1", errors="replace")


def _add_query_params(base_url: str, extra: dict) -> str:
    """Safely append/override query params to a URL."""
    parts = list(urlparse(base_url))
    q = dict(parse_qsl(parts[4]))
    q.update({k: v for k, v in extra.items() if v is not None})
    parts[4] = urlencode(q, doseq=True)
    return urlunparse(parts)


class N8nService:
    def __init__(self):
        # Core endpoints
        self.agent_url: Optional[str] = getattr(Config, "N8N_AGENT_URL", None)
        self.ping_url: Optional[str] = getattr(Config, "N8N_PING_URL", None)

        # Support either name for IP scanning URL (your config/env may use one or the other).
        ip_scan_url = getattr(Config, "N8N_WEBHOOK_IP_SCAN", None) or getattr(Config, "N8N_WEBHOOK_IPSCANNING", None)

        self.workflow_urls: Dict[str, Optional[str]] = {
            "chatbot": getattr(Config, "N8N_WEBHOOK_CHATBOT", None),
            "phishing-analysis": getattr(Config, "N8N_WEBHOOK_PHISHING", None),
            "ip-scanning": ip_scan_url,  # NOTE: path is case-sensitive (/IPscanning vs /ip-scanning)
            # "security-reports": getattr(Config, "N8N_WEBHOOK_SECURITY_REPORTS", None),
        }

        # Behavior toggles
        self.timeout_seconds: int = int(getattr(Config, "N8N_TIMEOUT_SECONDS", 25))
        self.max_retries: int = int(getattr(Config, "N8N_MAX_RETRIES", 3))
        self.retry_delay: float = float(getattr(Config, "N8N_RETRY_DELAY", 2))
        self.verify_ssl: bool = bool(getattr(Config, "N8N_VERIFY_SSL", True))

        # Optional auth header if you protect webhooks behind a gateway
        # e.g., N8N_AUTH_HEADER=Authorization, N8N_AUTH_VALUE=Bearer <token>
        self.auth_header_name: Optional[str] = getattr(Config, "N8N_AUTH_HEADER", None)
        self.auth_header_value: Optional[str] = getattr(Config, "N8N_AUTH_VALUE", None)

    # ---------- Public API ----------

    def trigger_webhook(self, payload: dict, headers: Optional[dict] = None) -> dict:
        """Legacy helper: POST to self.agent_url (typically your chatbot webhook)."""
        if not self.agent_url:
            return {"success": False, "error": "N8N_AGENT_URL not configured"}
        return self._request_with_retry("POST", self.agent_url, self._merge_headers(headers), json_payload=payload)

    def call_agent(self, input_data: dict, headers: Optional[dict] = None) -> dict:
        """Alias to agent webhook."""
        return self.trigger_webhook(input_data, headers=headers)

    def trigger_workflow(self, workflow_name: str, payload: Any, headers: Optional[dict] = None) -> dict:
        """
        Trigger n8n workflow with validation and extraction.
        - ip-scanning: uses GET with ?ip=<IP> (your webhook expects this)
        - phishing-analysis: default POST JSON (can switch to GET if you want)
        """
        full_url = self.workflow_urls.get(workflow_name)
        if not full_url:
            return {"success": False, "error": f"Unknown or unconfigured workflow: {workflow_name}"}

        headers = self._merge_headers(headers)

        # Validate and extract entities based on workflow type
        if workflow_name == "ip-scanning":
            ip, error = self._extract_and_validate_ip(payload)
            if not ip:
                return {"success": False, "error": f"IP scanning requires a valid IP address: {error}"}
            # Build GET with ?ip=...
            url = _add_query_params(full_url, {"ip": ip})
            return self._request_with_retry("GET", url, headers)

        elif workflow_name == "phishing-analysis":
            url_val, error = self._extract_and_validate_url(payload)
            if not url_val:
                return {"success": False, "error": f"Phishing analysis requires a valid URL: {error}"}
            # If you later want GET with ?url=..., replace POST with:
            # url_with_param = _add_query_params(full_url, {"url": url_val})
            # return self._request_with_retry("GET", url_with_param, headers)
            return self._request_with_retry("POST", full_url, headers, json_payload={"url": url_val})

        # Default: POST JSON (for chatbot and other workflows)
        return self._request_with_retry("POST", full_url, headers, json_payload=payload)

    def request_chatbot_report(self, message: str, headers: Optional[dict] = None) -> dict:
        """Convenience helper to call the 'chatbot' workflow."""
        return self.trigger_workflow("chatbot", {"message": message}, headers)

    def generate_security_report(self, headers: Optional[dict] = None) -> dict:
        """Enable once you configure the 'security-reports' webhook in Config."""
        url = self.workflow_urls.get("security-reports")
        if not url:
            return {"success": False, "error": "security-reports webhook not configured"}
        return self._request_with_retry("POST", url, self._merge_headers(headers), json_payload={})

    def ping(self):
      url = self.ping_url or self.agent_url or self.workflow_urls.get("chatbot")
      if not url:
        return {"ok": False, "reason": "no_url_configured"}

      probe = self._tcp_probe(url)
      if not probe["ok"]:
        return {"ok": False, "reason": f"tcp_failed: {probe.get('error')}", "url": url}

      try:
        headers = self._merge_headers(None)
        # Try HEAD first (fast), then POST (some webhooks expect POST)
        try:
            r = requests.head(url, headers=headers, timeout=5, verify=self.verify_ssl, allow_redirects=True)
        except Exception:
            r = requests.post(url, headers=headers, json={"_ping": True}, timeout=10, verify=self.verify_ssl)

        ok_statuses = {200, 400, 401, 403, 404, 405}
        is_ok = (r.status_code in ok_statuses) or (100 <= r.status_code < 500)
        return {"ok": bool(is_ok), "status": r.status_code, "reason": r.reason, "url": url}
      except requests.exceptions.SSLError as e:
        return {"ok": False, "reason": f"ssl_error: {e.__class__.__name__}", "url": url}
      except requests.exceptions.ConnectionError as e:
        return {"ok": False, "reason": f"connection_error: {e.__class__.__name__}", "url": url}
      except requests.exceptions.Timeout:
        return {"ok": False, "reason": "timeout", "url": url}
      except Exception as e:
        return {"ok": False, "reason": f"error: {str(e)}", "url": url}


    # ---------- Internals ----------

    def _merge_headers(self, headers: Optional[dict]) -> dict:
        merged = dict(DEFAULT_HEADERS)
        if self.auth_header_name and self.auth_header_value:
            merged[self.auth_header_name] = self.auth_header_value
        if headers:
            merged.update(headers)
        return merged

    # ---------- Inline option parsing (e.g., "[Investigate IP]") ----------

    def _parse_options_from_text(self, text: Any) -> Tuple[Any, list]:
        """
        Parse embedded options from n8n response text.
        Looks for patterns like [Investigate IP], [Investigate URL], etc.
        Returns tuple: (cleaned_text, actions_list WITHOUT API payload yet)
        """
        if not text or not isinstance(text, str):
            return text, []

        option_pattern = r'\[([^\]]+)\]'
        matches = re.findall(option_pattern, text)

        if not matches:
            return text, []

        cleaned_text = re.sub(option_pattern, '', text).strip()

        actions = []
        for match in matches:
            option_text = match.strip()
            if not option_text:
                continue
            actions.append({
                "type": "n8n_option",
                "label": option_text,
                "data": option_text,    # raw option text; we’ll enrich later if we detect entity
                "icon": "MousePointer"
            })
        return cleaned_text, actions

    # ---------- Entity extraction for context ----------

    def _extract_entities(self, text: Any) -> dict:
        """Extract common IOC-like entities for tailored actions."""
        if not text or not isinstance(text, str):
            return {"ips": [], "urls": [], "hashes": []}

        ip_re = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        url_re = r'\bhttps?://[^\s)>\]]+'
        hash_re = r'\b[a-fA-F0-9]{32}\b|\b[a-fA-F0-9]{40}\b|\b[a-fA-F0-9]{64}\b'  # MD5/SHA1/SHA256

        ips = re.findall(ip_re, text)
        urls = re.findall(url_re, text)
        hashes = re.findall(hash_re, text)

        def _dedupe_keep_order(items, cap=5):
            out, seen = [], set()
            for i in items:
                if i in seen:
                    continue
                seen.add(i)
                out.append(i)
                if len(out) >= cap:
                    break
            return out

        return {
            "ips": _dedupe_keep_order(ips),
            "urls": _dedupe_keep_order(urls),
            "hashes": _dedupe_keep_order(hashes),
        }

    # ---------- Validation and extraction helpers ----------

    def _validate_ip(self, ip_str: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate IPv4 address format."""
        if not ip_str or not isinstance(ip_str, str):
            return False, "Invalid IP format"

        ip_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        if not re.match(ip_pattern, ip_str):
            return False, "Invalid IPv4 format"

        # Block obviously invalid IPs
        if ip_str in ['0.0.0.0', '255.255.255.255']:
            return False, "Invalid IP address"

        return True, None

    def _validate_url(self, url_str: Optional[str]) -> Tuple[bool, Optional[str]]:
        """Validate URL format and basic structure."""
        if not url_str or not isinstance(url_str, str):
            return False, "Invalid URL format"

        try:
            parsed = urlparse(url_str)
            if not parsed.scheme or not parsed.netloc:
                return False, "Missing scheme or domain"

            # Must be http or https
            if parsed.scheme.lower() not in ['http', 'https']:
                return False, "Only HTTP/HTTPS URLs allowed"

            # Basic domain validation
            domain = parsed.netloc.lower()
            if not domain or len(domain) > 253:
                return False, "Invalid domain length"

            # Check for IP in domain (optional)
            if re.match(r'^\d+\.\d+\.\d+\.\d+', domain):
                is_valid, error = self._validate_ip(domain.split(':')[0])  # Remove port if present
                if not is_valid:
                    return False, f"Invalid IP in URL: {error}"

            return True, None

        except Exception as e:
            return False, f"URL parsing error: {str(e)}"

    def _extract_and_validate_ip(self, text_or_payload: Any) -> Tuple[Optional[str], Optional[str]]:
        """Extract and validate IP from text or payload dict."""
        if isinstance(text_or_payload, dict):
            ip = text_or_payload.get('ip')
            if ip:
                is_valid, error = self._validate_ip(ip)
                return (ip if is_valid else None), error
            # If no IP in payload, try to extract from message
            message = text_or_payload.get('message', '')
            if message:
                entities = self._extract_entities(message)
                if entities['ips']:
                    ip = entities['ips'][0]
                    is_valid, error = self._validate_ip(ip)
                    return (ip if is_valid else None), error
            return None, "No valid IP found in payload or message"

        elif isinstance(text_or_payload, str):
            entities = self._extract_entities(text_or_payload)
            if entities['ips']:
                ip = entities['ips'][0]
                is_valid, error = self._validate_ip(ip)
                return (ip if is_valid else None), error
            return None, "No IP found in text"

        return None, "Invalid input type"

    def _extract_and_validate_url(self, text_or_payload: Any) -> Tuple[Optional[str], Optional[str]]:
        """Extract and validate URL from text or payload dict."""
        if isinstance(text_or_payload, dict):
            url_val = text_or_payload.get('url')
            if url_val:
                is_valid, error = self._validate_url(url_val)
                return (url_val if is_valid else None), error
            # If no URL in payload, try to extract from message
            message = text_or_payload.get('message', '')
            if message:
                entities = self._extract_entities(message)
                if entities['urls']:
                    url_val = entities['urls'][0]
                    is_valid, error = self._validate_url(url_val)
                    return (url_val if is_valid else None), error
            return None, "No valid URL found in payload or message"

        elif isinstance(text_or_payload, str):
            entities = self._extract_entities(text_or_payload)
            if entities['urls']:
                url_val = entities['urls'][0]
                is_valid, error = self._validate_url(url_val)
                return (url_val if is_valid else None), error
            return None, "No URL found in text"

        return None, "Invalid input type"

    # ---------- Action selection (context-aware, max 4) ----------

    def _dedupe_actions(self, actions: list) -> list:
        """Deduplicate by (type, label) while preserving order."""
        seen = set()
        out = []
        for a in actions:
            key = (a.get("type"), a.get("label"))
            if key in seen:
                continue
            seen.add(key)
            out.append(a)
        return out

    def _select_top_actions(self, actions: list, limit: int = 4) -> list:
        """Pick up to `limit` actions by descending 'score'. Strip 'score' in output."""
        sorted_actions = sorted(actions, key=lambda a: a.get("score", 0), reverse=True)
        picked, seen = [], set()
        for a in sorted_actions:
            key = (a.get("type"), a.get("label"))
            if key in seen:
                continue
            seen.add(key)
            a = dict(a)
            a.pop("score", None)
            picked.append(a)
            if len(picked) >= limit:
                break
        return picked

    def _make_investigate_action(self, kind: str, value: str) -> dict:
        """
        Build an action that:
        - has a direct n8n link (href)
        - also carries backend API hint (/n8n/trigger-workflow) to trigger programmatically
        """
        if kind == "ip":
            base = self.workflow_urls.get("ip-scanning")
            href = _add_query_params(base, {"ip": value}) if base else None
            workflow = "ip-scanning"
            label = "Investigate IP"
            icon = "Shield"
            payload = {"ip": value}
        else:
            base = self.workflow_urls.get("phishing-analysis")
            # If you later switch phishing to GET with ?url=:
            # href = _add_query_params(base, {"url": value}) if base else None
            href = None
            workflow = "phishing-analysis"
            label = "Investigate URL"
            icon = "Link"
            payload = {"url": value}

        action = {
            "type": f"investigate_{kind}",
            "label": label,
            "data": value,
            "icon": icon,
            "href": href,  # direct n8n GET link (works in browser / new tab)
            "api": {       # optional programmatic trigger via your backend
                "method": "POST",
                "endpoint": "/n8n/trigger-workflow",
                "body": {"workflow": workflow, "payload": payload}
            }
        }
        return action

    def _bind_investigate_actions(self, inline_actions: list, ents: dict) -> list:
        """If inline options include Investigate IP/URL, convert them to real linked actions with entities."""
        out = []
        for a in inline_actions:
            lbl = str(a.get("label", "")).lower()
            if "investigate ip" in lbl and ents["ips"]:
                out.append(self._make_investigate_action("ip", ents["ips"][0]))
            elif "investigate url" in lbl and ents["urls"]:
                out.append(self._make_investigate_action("url", ents["urls"][0]))
            else:
                out.append(a)
        return out

    def _generate_scored_actions(self, text: Any) -> list:
        """
        Return candidate actions with 'score' using content/entities.
        We prioritize "check|investigate ip/url" style queries.
        """
        if not text or not isinstance(text, str):
            return []

        t = text.lower()
        actions = []
        ents = self._extract_entities(text)
        has_ip   = len(ents["ips"])   > 0
        has_url  = len(ents["urls"])  > 0
        has_hash = len(ents["hashes"])> 0

        # Direct intent detection for IP / URL investigations
        wants_ip_check  = any(kw in t for kw in ["check ip", "investigate ip", "scan ip", "ip reputation"])
        wants_url_check = any(kw in t for kw in ["check url", "investigate url", "scan url", "url reputation", "phishing"])

        if has_ip or wants_ip_check:
            ip0 = ents["ips"][0] if has_ip else "suspicious ip"
            act = self._make_investigate_action("ip", ip0)
            act["score"] = 100  # top priority
            actions.append(act)

        if has_url or wants_url_check:
            url0 = ents["urls"][0] if has_url else "latest url"
            act = self._make_investigate_action("url", url0)
            act["score"] = 100  # top priority
            actions.append(act)

        # Secondary actions (only if strongly relevant)
        if any(k in t for k in ["threat", "attack", "incident", "compromise", "ioc", "breach", "ransom"]):
            actions += [
                {"type": "deep_analysis",   "label": "Deep Analysis",   "data": "Perform deep security analysis",
                 "icon": "Search", "score": 80},
                {"type": "generate_report", "label": "Generate Report", "data": "Generate security incident report",
                 "icon": "FileText", "score": 60},
            ]

        if has_hash or any(k in t for k in ["malware", "virus", "trojan", "worm", "payload", "ransom"]):
            hash_data = ents["hashes"][0] if has_hash else "latest sample"
            actions += [
                {"type": "yara_scan",     "label": "YARA Scan",      "data": hash_data, "icon": "Scan",        "score": 55},
                {"type": "av_reputation", "label": "AV Reputation",  "data": hash_data, "icon": "ShieldCheck", "score": 50},
            ]

        # Deduplicate and return (selection to top-4 happens later)
        return self._dedupe_actions(actions)

    # ---------- Request / retry / decode ----------

    def _request_with_retry(
        self,
        method: str,
        url: str,
        headers: dict,
        json_payload: Optional[dict] = None,
        params: Optional[dict] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None
    ) -> dict:
        """
        Generic retry wrapper for GET/POST with decode + context-aware actions.
        Retries: connection errors, timeouts, and all 5xx (including 502/504).
        """
        if timeout is None:
            timeout = self.timeout_seconds
        if max_retries is None:
            max_retries = self.max_retries

        last_error = None
        for attempt in range(max_retries + 1):
            try:
                logger.info("N8n %s attempt %s/%s to %s", method, attempt + 1, max_retries + 1, url)
                if method.upper() == "GET":
                    response = requests.get(url, headers=headers, params=params, timeout=timeout, verify=self.verify_ssl)
                else:
                    response = requests.post(url, headers=headers, json=json_payload, params=params,
                                             timeout=timeout, verify=self.verify_ssl)

                # Decode early (so logs and returns are readable).
                content_encoding = response.headers.get("Content-Encoding")
                ct = response.headers.get("Content-Type", "")
                charset = None
                if "charset=" in ct:
                    try:
                        charset = ct.split("charset=", 1)[1].split(";", 1)[0].strip()
                    except Exception:
                        charset = None
                decoded_text = _decode_bytes(response.content, content_encoding, charset or response.encoding or "utf-8")

                # Server errors (retryable)
                if response.status_code >= 500:
                    last_error = f"{response.status_code} server error"
                    if attempt < max_retries:
                        logger.warning("N8n %s, retrying...", response.status_code)
                        time.sleep(self.retry_delay * (attempt + 1))
                        continue
                    logger.error("N8n server error %s: %s", response.status_code, decoded_text)
                    return {
                        "success": False,
                        "error": f"n8n service error {response.status_code}",
                        "details": decoded_text[:2000],
                        "status": response.status_code,
                    }

                # Client errors (do not retry)
                if response.status_code >= 400:
                    logger.error("N8n %s: %s", response.status_code, decoded_text[:1000])
                    return {
                        "success": False,
                        "error": f"n8n service error {response.status_code}",
                        "details": decoded_text[:2000],
                        "status": response.status_code,
                    }

                # Try to parse JSON; otherwise keep text
                try:
                    json_data = json.loads(decoded_text)
                except Exception:
                    json_data = {"reply": decoded_text}

                # ---------- Hook: inline options + context actions ----------
                if isinstance(json_data, dict):
                    reply_text = json_data.get("reply", "")
                    cleaned_reply, inline_actions = self._parse_options_from_text(reply_text)

                    if inline_actions:
                        ents = self._extract_entities(cleaned_reply)
                        final_actions = self._bind_investigate_actions(inline_actions, ents)
                        final_actions = self._dedupe_actions(final_actions)[:4]
                    else:
                        scored = self._generate_scored_actions(cleaned_reply if isinstance(cleaned_reply, str) else decoded_text)
                        final_actions = self._select_top_actions(scored, limit=4)

                    if isinstance(cleaned_reply, str):
                        json_data["reply"] = cleaned_reply
                    if final_actions:
                        json_data["actions"] = final_actions

                return {"success": True, "data": json_data}

            except requests.exceptions.Timeout:
                last_error = "timeout"
                if attempt < max_retries:
                    logger.warning("N8n request timeout, retrying... (%s/%s)", attempt + 1, max_retries + 1)
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                logger.error("N8n request timeout after all retries")
                return {"success": False, "error": "n8n service timeout"}

            except requests.exceptions.ConnectionError:
                last_error = "connection error"
                if attempt < max_retries:
                    logger.warning("N8n connection error, retrying... (%s/%s)", attempt + 1, max_retries + 1)
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                logger.error("N8n connection error after all retries")
                return {"success": False, "error": "n8n service unavailable"}

            except requests.RequestException as e:
                last_error = str(e)
                if attempt < max_retries:
                    logger.warning("N8n request error, retrying... (%s/%s): %s", attempt + 1, max_retries + 1, e)
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                logger.error("N8n request error after all retries: %s", e)
                return {"success": False, "error": str(e)}

        return {"success": False, "error": f"n8n service {last_error} after {max_retries + 1} attempts"}

    # ---------- Networking helpers ----------

    def _tcp_probe(self, url: str, timeout: int = 5) -> dict:
        """Quick host:port reachability check to separate DNS/port failures from HTTP issues."""
        try:
            u = urlparse(url)
            host = u.hostname
            if not host:
                return {"ok": False, "error": "no_host_in_url"}
            port = u.port or (443 if u.scheme == "https" else 80)
            with socket.create_connection((host, port), timeout=timeout):
                return {"ok": True, "host": host, "port": port}
        except Exception as e:
            return {"ok": False, "error": str(e)}

# Run from project root:
#   python -m backend.services.n8n
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    svc = N8nService()

    print("=== Testing Validation and Extraction ===")

    # Test _validate_ip
    print("\n--- IP Validation Tests ---")
    test_ips = ["192.168.1.1", "999.999.999.999", "abc.def.ghi.jkl", "8.8.8.8", "0.0.0.0", "255.255.255.255"]
    for ip in test_ips:
        valid, error = svc._validate_ip(ip)
        print(f"IP '{ip}': Valid={valid}, Error='{error}'")

    # Test _validate_url
    print("\n--- URL Validation Tests ---")
    test_urls = [
        "https://example.com", "http://test.com", "ftp://example.com", "not-a-url",
        "https://192.168.1.1", "https://invalid..domain"
    ]
    for url in test_urls:
        valid, error = svc._validate_url(url)
        print(f"URL '{url}': Valid={valid}, Error='{error}'")

    # Test _extract_and_validate_ip
    print("\n--- IP Extraction Tests ---")
    
 
    # Test _extract_and_validate_url
    print("\n--- URL Extraction Tests ---")
    test_payloads_url = [
        {"url": "https://example.com"},
        {"message": "Analyze https://suspicious-site.com for phishing"},
        "Visit http://test.com",
        {"message": "no url here"},
        "invalid input"
    ]
    for payload in test_payloads_url:
        url, error = svc._extract_and_validate_url(payload)
        print(f"Payload {payload}: URL='{url}', Error='{error}'")

    print("\n=== Connectivity & Workflow Tests ===")

    # Ping includes TCP probe and returns status/reason
    print("\nPing:", svc.ping())

    try:
        print("\nChatbot test:")
        print(svc.trigger_workflow("chatbot", {"message": "hello from n8n.py __main__"}))
    except Exception as e:
        print("Chatbot test error:", e)

    try:
        print("\nPhishing test:")
        print(svc.trigger_workflow("phishing-analysis", {"url": "http://example.com"}))
    except Exception as e:
        print("Phishing test error:", e)

    try:
        print("\nIP scanning test:")
        print(svc.trigger_workflow("ip-scanning", {"ip": "1.1.1.1"}))
    except Exception as e:
        print("IP scanning test error:", e)
