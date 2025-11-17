/**
 * BackendService - Service for communicating with the backend API
 */

class BackendService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  }

  /**
   * Make a request to the backend API
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - The response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const { method = 'GET', headers = {}, body, ...rest } = options;

    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...rest,
    };

    if (body && typeof body === 'object') {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const text = await response.text().catch(() => '');

      if (!response.ok) {
        throw new Error(`Backend error ${response.status}: ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        return { reply: text };
      }
    } catch (error) {
      console.error(`Backend request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Send a chat message to the backend AI
   * @param {string} message - The message content
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - The AI response
   */
  async sendChatMessage(message, conversationHistory = [], context = {}) {
    // Get Firebase ID token for authentication
    const token = await this.getFirebaseToken();

    return this.request('/ai/chat', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: {
        message,
        conversationHistory,
        context,
      },
    });
  }

  /**
   * Get Firebase ID token for authentication
   * @returns {Promise<string|null>} - The Firebase ID token
   */
  async getFirebaseToken() {
    try {
      const { auth } = await import('../firebase');
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  }

  /**
   * Check if backend is available
   * @returns {Promise<boolean>} - True if backend is available
   */
  async isAvailable() {
    try {
      const response = await this.request('/health');
      return response.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Analyze a security event
   * @param {Object} eventData - Event data to analyze
   * @returns {Promise<Object>} - Analysis result
   */
  async analyzeSecurityEvent(eventData) {
    return this.request('/ai/analyze', {
      method: 'POST',
      body: eventData,
    });
  }

  /**
   * Generate an incident report
   * @param {Array} incidents - Incidents to include in report
   * @returns {Promise<Object>} - Report data
   */
  async generateIncidentReport(incidents) {
    return this.request('/ai/report', {
      method: 'POST',
      body: { incidents },
    });
  }

  /**
   * Get threat intelligence
   * @param {string} threatType - Type of threat
   * @returns {Promise<Object>} - Threat intelligence data
   */
  async getThreatIntelligence(threatType) {
    return this.request('/ai/threat-intelligence', {
      method: 'POST',
      body: { threatType },
    });
  }

  /**
   * Get security incidents
   * @returns {Promise<Object>} - Incidents data
   */
  async getIncidents() {
    const token = await this.getFirebaseToken();

    return this.request('/incidents', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get security incidents from JSON file
   * @returns {Promise<Object>} - Incidents data from JSON file
   */
  async getIncidentsFromJSON() {
    const token = await this.getFirebaseToken();

    return this.request('/incidents/json', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }


  /**
   * Add a security incident
   * @param {Object} incident - Incident data
   * @returns {Promise<Object>} - Result
   */
  async addIncident(incident) {
    return this.request('/incidents', {
      method: 'POST',
      body: incident,
    });
  }

  /**
   * Get dashboard metrics
   * @returns {Promise<Object>} - Metrics data
   */
  async getMetrics() {
    const token = await this.getFirebaseToken();

    return this.request('/metrics', {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get configuration value from backend
   * @param {string} key - Configuration key
   * @returns {Promise<any>} - Configuration value
   */
  async getConfigValue(key) {
    try {
      const response = await this.request(`/config/${key}`);
      return response.value;
    } catch (error) {
      console.error(`Error getting config ${key}:`, error);
      return null;
    }
  }

  /**
   * Enhance n8n response using Groq AI
   * @param {Object} n8nResponse - Original n8n response
   * @param {string} userMessage - User's original message
   * @param {Array} conversationHistory - Conversation history
   * @returns {Promise<Object>} - Enhanced response
   */
  async enhanceN8nResponse(n8nResponse, userMessage, conversationHistory) {
    const token = await this.getFirebaseToken();

    return this.request('/ai/enhance-n8n-response', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: {
        n8nResponse,
        userMessage,
        conversationHistory,
      },
    });
  }

  /**
   * Get all conversations for the authenticated user
   * @returns {Promise<Object>} - Conversations data
   */
  async getConversations() {
    const token = await this.getFirebaseToken();

    return this.request('/chat/conversations', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Create a new conversation
   * @param {string} message - First message content
   * @param {string} title - Optional conversation title
   * @returns {Promise<Object>} - Created conversation
   */
  async createConversation(message, title = null) {
    const token = await this.getFirebaseToken();

    return this.request('/chat/conversations', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: {
        message,
        title,
      },
    });
  }

  /**
   * Get a specific conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation data
   */
  async getConversation(conversationId) {
    const token = await this.getFirebaseToken();

    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} sender - Message sender ('user' or 'assistant')
   * @param {string} content - Message content
   * @returns {Promise<Object>} - Updated conversation
   */
  async addMessageToConversation(conversationId, sender, content) {
    const token = await this.getFirebaseToken();

    return this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: {
        sender,
        content,
      },
    });
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Result
   */
  async deleteConversation(conversationId) {
    const token = await this.getFirebaseToken();

    return this.request(`/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Update conversation title
   * @param {string} conversationId - Conversation ID
   * @param {string} title - New title
   * @returns {Promise<Object>} - Result
   */
  async updateConversationTitle(conversationId, title) {
    const token = await this.getFirebaseToken();

    return this.request(`/chat/conversations/${conversationId}/title`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: {
        title,
      },
    });
  }

  /**
   * Get integrations status
   * @returns {Promise<Object>} - Integrations status data
   */
  async getIntegrationsStatus() {
    const token = await this.getFirebaseToken();

    return this.request('/integrations/status', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get auto-detected integrations
   * @returns {Promise<Object>} - Auto-detected integrations data
   */
  async getAutoDetectedIntegrations() {
    const token = await this.getFirebaseToken();

    return this.request('/integrations/auto-detect', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Start IDS monitoring
   * @returns {Promise<Object>} - Start result
   */
  async startIDSMonitoring() {
    const token = await this.getFirebaseToken();

    return this.request('/ids/start', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Stop IDS monitoring
   * @returns {Promise<Object>} - Stop result
   */
  async stopIDSMonitoring() {
    const token = await this.getFirebaseToken();

    return this.request('/ids/stop', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get IDS monitoring status
   * @returns {Promise<Object>} - Status data
   */
  async getIDSStatus() {
    const token = await this.getFirebaseToken();

    return this.request('/ids/status', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get IDS logs
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<Object>} - Logs data
   */
  async getIDSLogs(limit = 50) {
    const token = await this.getFirebaseToken();

    return this.request(`/ids/logs?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get IDS logs for specific IP address
   * @param {string} ipAddress - IP address to filter logs
   * @param {number} limit - Number of logs to retrieve
   * @returns {Promise<Object>} - Filtered logs data
   */
  async getIDSLogsByIP(ipAddress, limit = 20) {
    const token = await this.getFirebaseToken();

    return this.request(`/ids/logs/ip/${ipAddress}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get IDS alerts summary
   * @returns {Promise<Object>} - Alerts summary data
   */
  async getIDSAlerts() {
    const token = await this.getFirebaseToken();

    return this.request('/ids/alerts', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get scheduled tasks
   * @param {Object} filters - Optional filters (type, status)
   * @returns {Promise<Object>} - Scheduled tasks data
   */
  async getScheduledTasks(filters = {}) {
    const token = await this.getFirebaseToken();

    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = `/scheduler/tasks${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Create a scheduled task
   * @param {Object} taskData - Task configuration
   * @returns {Promise<Object>} - Created task data
   */
  async createScheduledTask(taskData) {
    const token = await this.getFirebaseToken();

    return this.request('/scheduler/tasks', {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: taskData,
    });
  }

  /**
   * Get a specific scheduled task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} - Task data
   */
  async getScheduledTask(taskId) {
    const token = await this.getFirebaseToken();

    return this.request(`/scheduler/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Update a scheduled task
   * @param {string} taskId - Task ID
   * @param {Object} updates - Task updates
   * @returns {Promise<Object>} - Updated task data
   */
  async updateScheduledTask(taskId, updates) {
    const token = await this.getFirebaseToken();

    return this.request(`/scheduler/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
      body: updates,
    });
  }

  /**
   * Delete a scheduled task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteScheduledTask(taskId) {
    const token = await this.getFirebaseToken();

    return this.request(`/scheduler/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Pause a scheduled task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} - Pause result
   */
  async pauseScheduledTask(taskId) {
    const token = await this.getFirebaseToken();

    return this.request(`/scheduler/tasks/${taskId}/pause`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Resume a scheduled task
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} - Resume result
   */
  async resumeScheduledTask(taskId) {
    const token = await this.getFirebaseToken();

    return this.request(`/scheduler/tasks/${taskId}/resume`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }

  /**
   * Get scheduler status
   * @returns {Promise<Object>} - Scheduler status data
   */
  async getSchedulerStatus() {
    const token = await this.getFirebaseToken();

    return this.request('/scheduler/status', {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined,
      },
    });
  }
}

// Create and export a singleton instance
const backendService = new BackendService();
export default backendService;

// Also export the class for testing or custom instances
export { BackendService };
