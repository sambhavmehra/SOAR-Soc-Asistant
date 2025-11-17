export async function askAgent(message, context = {}) {
  const r = await fetch("http://localhost:5000/chat/agent", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ message, context })
  });
  const j = await r.json();
  if (!r.ok || j.success === false) throw new Error(j.reply || "Agent error");
  return j;
}

export async function executeOption(action, data = {}, context = {}) {
  const r = await fetch("http://localhost:5000/chat/execute", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ action, data, context })
  });
  const j = await r.json();
  if (!r.ok || j.success === false) throw new Error(j.reply || "Execute error");
  return j;
}
