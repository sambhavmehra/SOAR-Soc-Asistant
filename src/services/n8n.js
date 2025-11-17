export async function triggerN8n(payload, headers = {}) {
  // Use backend proxy instead of direct n8n call to avoid CORS
  const backendUrl = 'http://localhost:5000/api/n8n/webhook';

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload ?? {}),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    // Provide user-friendly error messages
    if (response.status === 504 || response.status === 502) {
      throw new Error('N8n service is temporarily unavailable. Using local AI assistant instead.');
    } else if (response.status >= 500) {
      throw new Error('N8n service is experiencing issues. Using local AI assistant instead.');
    } else {
      throw new Error(`Service error: ${response.status}`);
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function getN8nWebhookUrl() {
  return import.meta.env.VITE_N8N_WEBHOOK_URL;
}

export async function callN8nAgent(input, headers = {}) {
  // Use backend proxy instead of direct n8n call to avoid CORS
  const backendUrl = 'http://localhost:5000/api/n8n/agent';

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input ?? {}),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    // Provide user-friendly error messages
    if (response.status === 504 || response.status === 502) {
      throw new Error('N8n service is temporarily unavailable. Using local AI assistant instead.');
    } else if (response.status >= 500) {
      throw new Error('N8n service is experiencing issues. Using local AI assistant instead.');
    } else {
      throw new Error(`Service error: ${response.status}`);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return { reply: text };
  }
}

export async function pingN8n() {
  try {
    // Use backend proxy instead of direct n8n call to avoid CORS
    const backendUrl = 'http://localhost:5000/api/n8n/ping';
    const response = await fetch(backendUrl, { method: 'GET' }).catch(() => null);
    if (!response) return { ok: false };
    const data = await response.json().catch(() => ({ ok: false }));
    return data;
  } catch {
    return { ok: false };
  }
}

export async function testIntegration(integration, headers = {}) {
  const url = import.meta.env.VITE_N8N_TEST_URL || import.meta.env.VITE_N8N_AGENT_URL;
  if (!url) {
    throw new Error('VITE_N8N_TEST_URL or VITE_N8N_AGENT_URL is not set');
  }
  const payload = import.meta.env.VITE_N8N_TEST_URL
    ? integration
    : { action: 'test_integration', integration };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    // Provide user-friendly error messages
    if (response.status === 504 || response.status === 502) {
      throw new Error('Integration test failed: N8n service temporarily unavailable');
    } else if (response.status >= 500) {
      throw new Error('Integration test failed: N8n service experiencing issues');
    } else {
      throw new Error(`Integration test error: ${response.status}`);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, reply: text };
  }
}
