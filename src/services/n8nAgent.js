/**
 * N8nAgentService - A dedicated service for interacting with n8n agents
 * This service provides methods to communicate with n8n workflows configured as agents
 */

class N8nAgentService {
  constructor() {
    // Use backend proxy instead of direct n8n call to avoid CORS
    this.agentUrl = 'http://localhost:5000/api/n8n/agent';
    this.webhookUrl = 'http://localhost:5000/api/n8n/webhook';
  }

  /**
   * Send a message to the n8n agent
   * @param {Object} message - The message to send to the agent
   * @param {Object} options - Additional options for the request
   * @returns {Promise<Object>} - The agent's response
   */
  async sendMessage(message, options = {}) {
    if (!this.agentUrl) {
      throw new Error('N8nAgentService: Agent URL is not set');
    }

    const { headers = {}, context = {} } = options;

    console.log('N8nAgentService: Sending message to agent:', message);

    const payload = {
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(this.agentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text().catch(() => '');

      if (!response.ok) {
        console.error(`N8nAgentService: Error ${response.status}:`, text);
        throw new Error(`N8nAgentService: Error ${response.status}: ${text}`);
      }

      try {
        const data = JSON.parse(text);
        console.log('N8nAgentService: Received response:', data);
        return data;
      } catch (e) {
        console.log('N8nAgentService: Received non-JSON response:', text);
        return { reply: text };
      }
    } catch (error) {
      console.error('N8nAgentService: Request failed:', error);
      throw error;
    }
  }

  /**
   * Execute a specific action with the n8n agent
   * @param {string} action - The action to execute
   * @param {Object} data - The data for the action
   * @returns {Promise<Object>} - The result of the action
   */
  async executeAction(action, data = {}) {
    return this.sendMessage({
      action,
      data,
    });
  }

  /**
   * Check if the n8n agent is available
   * @returns {Promise<boolean>} - True if the agent is available
   */
  async isAvailable() {
    try {
      // Use ping endpoint for availability check
      const pingUrl = 'http://localhost:5000/api/n8n/ping';
      const response = await fetch(pingUrl, { method: 'GET' }).catch(() => null);
      if (!response) return false;
      const data = await response.json().catch(() => ({ ok: false }));
      return data.ok === true;
    } catch {
      return false;
    }
  }

  /**
   * Run a security analysis using the n8n agent
   * @param {Object} incident - The security incident to analyze
   * @returns {Promise<Object>} - The analysis results
   */
  async analyzeSecurityIncident(incident) {
    return this.executeAction('analyze_security_incident', { incident });
  }

  /**
   * Generate a security report using the n8n agent
   * @param {Object} data - The data to include in the report
   * @returns {Promise<Object>} - The generated report
   */
  async generateSecurityReport(data) {
    return this.executeAction('generate_security_report', data);
  }

  /**
   * Trigger an automated response to a security incident
   * @param {Object} incident - The security incident
   * @param {string} responseType - The type of response to trigger
   * @returns {Promise<Object>} - The response results
   */
  async triggerAutomatedResponse(incident, responseType) {
    return this.executeAction('trigger_response', {
      incident,
      responseType
    });
  }

  /**
   * Submit a security alert to the SOAR Security Agent workflow
   * @param {Object} alertData - The security alert data
   * @returns {Promise<Object>} - The workflow response
   */
  async submitSecurityAlert(alertData) {
    return this.sendMessage({
      action: 'submit_security_alert',
      data: alertData,
    });
  }

  /**
   * Send a chat message to the SOAR Security Agent chatbot
   * @param {string} message - The chat message content
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} - The chatbot response
   */
  async sendChatMessage(message, conversationId = 'default') {
    return this.sendMessage({
      message,
      conversationId,
    });
  }

  /**
   * Execute a specific action requested by the chatbot
   * @param {string} action - The action to execute
   * @param {Object} data - The data for the action
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} - The result of the action
   */
  async executeChatAction(action, data, conversationId = 'default') {
    return this.sendMessage({
      action,
      data,
      conversationId,
    });
  }
}

// Create and export a singleton instance
const n8nAgentService = new N8nAgentService();
export default n8nAgentService;

// Also export the class for testing or custom instances
export { N8nAgentService };
