import os, json
from typing import Dict, Any, Optional
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

class GroqAgent:
    def __init__(self, api_key: Optional[str] = None, model: str = GROQ_MODEL):
        self.client = Groq(api_key=api_key or GROQ_API_KEY)
        self.model  = model

    def propose(self, user_message: str, capabilities: Dict[str, Dict], context: Optional[Dict]=None) -> Dict[str, Any]:
        """
        Return ONLY JSON:
          { success, reply, data, actions:[{type,label,data?}] }
        """
        sys = (
            "You are a SOAR/SOC assistant. Respond BRIEFLY and return VALID JSON only.\n"
            "Schema: { 'success': true, 'reply': str, 'data': object|null, "
            "'actions': [ {'type': str, 'label': str, 'data': object|null } ] }\n"
            "Prefer actions whose 'type' is in CAPABILITIES; include minimal 'data' needed to execute."
        )
        usr = (
            f"USER:\n{user_message}\n\n"
            f"CONTEXT:\n{json.dumps(context or {}, ensure_ascii=False)}\n\n"
            f"CAPABILITIES:\n{json.dumps(capabilities, ensure_ascii=False)}"
        )
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.2,
            response_format={"type":"json_object"},
            messages=[{"role":"system","content":sys},{"role":"user","content":usr}],
        )
        content = resp.choices[0].message.content
        try:
            out = json.loads(content)
            out.setdefault("success", True)
            out.setdefault("reply", "")
            out.setdefault("data", None)
            out.setdefault("actions", [])
            return out
        except Exception as e:
            return {"success": False, "reply": f"Parse error: {e}", "data": None, "actions": []}

    def execute_unknown(self, action: str, payload: Dict, context: Optional[Dict]=None) -> Dict[str, Any]:
        """
        Ask Groq to generate a structured execution result for an unknown action.
        """
        sys = (
            "Execute the SOC action using ONLY the payload/context; do not hallucinate new facts.\n"
            "Return VALID JSON only: { 'success': true|false, 'reply': str, 'data': object|null, 'actions': [] }"
        )
        usr = f"ACTION: {action}\nPAYLOAD:\n{json.dumps(payload)}\nCONTEXT:\n{json.dumps(context or {})}"
        resp = self.client.chat.completions.create(
            model=self.model,
            temperature=0.1,
            response_format={"type":"json_object"},
            messages=[{"role":"system","content":sys},{"role":"user","content":usr}],
        )
        content = resp.choices[0].message.content
        try:
            out = json.loads(content)
            out.setdefault("success", True)
            out.setdefault("reply", "")
            out.setdefault("data", None)
            out.setdefault("actions", [])
            return out
        except Exception as e:
            return {"success": False, "reply": f"Execution parse error: {e}", "data": None, "actions": []}
