import Groq from 'groq-sdk';

// Initialize Groq client with API key from environment variables
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

class GroqService {
  constructor() {
    this.client = groq;
  }

  /**
   * Analyze security events using Groq AI
   * @param {Object} eventData - Security event data to analyze
   * @returns {Object} AI analysis of the security event
   */
  async analyzeSecurityEvent(eventData) {
    try {
      const prompt = `
        Analyze this security event and provide insights:
        
        Source IP: ${eventData?.sourceIp}
        Destination IP: ${eventData?.destinationIp}
        Event Type: ${eventData?.eventType}
        Timestamp: ${eventData?.timestamp}
        Additional Info: ${JSON.stringify(eventData?.additionalInfo || {})}
        
        Please provide:
        1. Threat severity assessment (High, Medium, Low)
        2. Attack type classification
        3. Recommended actions
        4. Brief explanation of the threat
        
        Format your response as a JSON object with keys: severity, attackType, actions, explanation
      `;

      const response = await this.client?.chat?.completions?.create({
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert analyzing security events. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'meta-llama/llama-guard-4-12b',
        temperature: 0.1,
        max_tokens: 1000
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      // Handle responses wrapped in markdown code blocks
      let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();

      // Extract JSON from response if it contains extra text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      const aiAnalysis = JSON.parse(cleanedContent);

      return {
        success: true,
        data: aiAnalysis
      };
    } catch (error) {
      console.error('Groq AI analysis error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to analyze security event'
      };
    }
  }

  /**
   * Generate security incident report using AI
   * @param {Array} incidents - Array of security incidents
   * @returns {Object} AI-generated report
   */
  async generateIncidentReport(incidents) {
    try {
      const incidentSummary = incidents?.map(incident => ({
        eventId: incident?.eventId,
        severity: incident?.severity,
        attackType: incident?.attackType,
        status: incident?.status,
        timestamp: incident?.timestamp
      }));

      const prompt = `
        Generate a comprehensive security incident report based on these incidents:
        
        ${JSON.stringify(incidentSummary, null, 2)}
        
        Please provide:
        1. Executive summary
        2. Incident statistics
        3. Top threats identified
        4. Recommended actions
        5. Risk assessment
        
        Format as JSON with keys: executiveSummary, statistics, topThreats, recommendations, riskAssessment
      `;

      const response = await this.client?.chat?.completions?.create({
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity analyst creating incident reports. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 2000
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      // Handle responses wrapped in markdown code blocks
      let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();

      // Extract JSON from response if it contains extra text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      const report = JSON.parse(cleanedContent);

      return {
        success: true,
        data: report
      };
    } catch (error) {
      console.error('Groq report generation error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to generate incident report'
      };
    }
  }

  /**
   * Get threat intelligence insights
   * @param {string} threatType - Type of threat to analyze
   * @returns {Object} AI-generated threat intelligence
   */
  async getThreatIntelligence(threatType) {
    try {
      const prompt = `
        Provide threat intelligence information about: ${threatType}
        
        Include:
        1. Common attack patterns
        2. Indicators of compromise (IOCs)
        3. Prevention strategies
        4. Current threat landscape
        5. Risk level assessment
        
        Format as JSON with keys: attackPatterns, iocs, prevention, threatLandscape, riskLevel
      `;

      const response = await this.client?.chat?.completions?.create({
        messages: [
          {
            role: 'system',
            content: 'You are a threat intelligence expert. Provide accurate and actionable security information. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 1500
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      // Handle responses wrapped in markdown code blocks
      let cleanedContent = content.replace(/```json\s*|\s*```/g, '').trim();

      // Extract JSON from response if it contains extra text
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
      }

      const intelligence = JSON.parse(cleanedContent);

      return {
        success: true,
        data: intelligence
      };
    } catch (error) {
      console.error('Groq threat intelligence error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to get threat intelligence'
      };
    }
  }
}

export default new GroqService();