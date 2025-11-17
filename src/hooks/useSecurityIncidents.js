import { useState, useEffect, useCallback } from 'react';
import GroqService from '../services/groq';
import GoogleSheetsService from '../services/googleSheets';
import DatabaseService from '../services/database';
import { requestGoogleToken } from '../services/googleAuth';
import backendService from '../services/backend';

export const useSecurityIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiReport, setAiReport] = useState(null);

  /**
   * Fetch incidents from IDS logs (only actual incidents)
   */
  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await backendService.request('/incidents/ids');

      if (response?.success) {
        setIncidents(response?.data || []);
      } else {
        setError(response?.error || 'Failed to fetch incidents from IDS logs');
      }
    } catch (err) {
      setError(err?.message || 'An unexpected error occurred while fetching from IDS logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectGoogle = useCallback(async () => {
    try {
      await requestGoogleToken();
      await fetchIncidents();
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message };
    }
  }, [fetchIncidents]);

  /**
   * Add a new security incident with AI analysis
   */
  const addIncident = useCallback(async (incidentData) => {
    setLoading(true);
    setError(null);

    try {
      // First, analyze the incident using Groq AI
      const aiAnalysis = await GroqService?.analyzeSecurityEvent(incidentData);

      let enrichedIncident = { ...incidentData };

      if (aiAnalysis?.success) {
        enrichedIncident = {
          ...enrichedIncident,
          severity: aiAnalysis?.data?.severity || incidentData?.severity || 'Medium',
          attackType: aiAnalysis?.data?.attackType || incidentData?.attackType || 'Unknown',
          actionTaken: aiAnalysis?.data?.actions || incidentData?.actionTaken || 'Alert Sent'
        };
      }

      // Add to Google Sheets
      const sheetsResponse = await GoogleSheetsService?.addSecurityIncident(enrichedIncident);

      if (sheetsResponse?.success) {
        // Update local state
        setIncidents(prev => [...prev, sheetsResponse?.data?.incident]);
        return {
          success: true,
          data: sheetsResponse?.data?.incident,
          aiAnalysis: aiAnalysis?.success ? aiAnalysis?.data : null
        };
      } else {
        setError(sheetsResponse?.error || 'Failed to add incident to Google Sheets');
        return {
          success: false,
          error: sheetsResponse?.error
        };
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update incident status
   */
  const updateIncidentStatus = useCallback(async (eventId, newStatus, actionTaken) => {
    setLoading(true);
    setError(null);

    try {
      // Find the incident by eventId
      const incident = incidents.find(inc => inc.eventid === eventId);
      if (!incident) {
        throw new Error('Incident not found');
      }

      // Update in Google Sheets
      const response = await GoogleSheetsService?.updateIncidentStatus(eventId, newStatus, actionTaken);

      if (response?.success) {
        // Update local state
        setIncidents(prev =>
          prev?.map(incident =>
            incident?.eventid === eventId
              ? { ...incident, status: newStatus, actiontaken: actionTaken }
              : incident
          )
        );
        return { success: true };
      } else {
        setError(response?.error || 'Failed to update incident in Google Sheets');
        return { success: false, error: response?.error };
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [incidents]);

  /**
   * Generate AI report for current incidents or selected ones
   */
  const generateAIReport = useCallback(async (selectedIncidents = null) => {
    setLoading(true);
    setError(null);

    try {
      const incidentsToReport = selectedIncidents || incidents;
      const reportResponse = await GroqService?.generateIncidentReport(incidentsToReport);

      if (reportResponse?.success) {
        setAiReport(reportResponse?.data);

        // Save AI report to database
        const isSelected = selectedIncidents && selectedIncidents.length > 0;
        const aiReportData = {
          title: isSelected ? 'AI Security Report (Selected Logs)' : 'AI Security Report',
          description: reportResponse?.data?.executiveSummary || `Automated security analysis report${isSelected ? ' for selected logs' : ''}`,
          content: JSON.stringify(reportResponse?.data),
          generatedAt: new Date().toISOString(),
          type: 'ai-report',
          status: 'completed',
          format: 'json',
          icon: 'Brain'
        };

        const saveResponse = await DatabaseService?.addReport(aiReportData);
        if (!saveResponse?.success) {
          console.error('Failed to save AI report to database:', saveResponse?.error);
        }

        // Also save to localStorage for reports dashboard
        const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
        const localReport = {
          id: Date.now(),
          title: aiReportData.title,
          description: aiReportData.description,
          icon: aiReportData.icon,
          status: aiReportData.status,
          lastGenerated: new Date().toLocaleString(),
          size: `${(JSON.stringify(reportResponse?.data).length / 1024 / 1024).toFixed(1)} MB`,
          format: aiReportData.format,
          content: aiReportData.content
        };
        existingReports.push(localReport);
        localStorage.setItem('reports', JSON.stringify(existingReports));

        return {
          success: true,
          data: reportResponse?.data
        };
      } else {
        setError(reportResponse?.error || 'Failed to generate AI report');
        return {
          success: false,
          error: reportResponse?.error
        };
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [incidents]);

  /**
   * Bulk import incidents
   */
  const bulkImportIncidents = useCallback(async (incidentsData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await GoogleSheetsService?.bulkAddIncidents(incidentsData);

      if (response?.success) {
        // Refresh incidents after bulk import
        await fetchIncidents();
        return { success: true, data: response?.data };
      } else {
        setError(response?.error || 'Failed to bulk import incidents to Google Sheets');
        return { success: false, error: response?.error };
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchIncidents]);

  /**
   * Get threat intelligence for specific attack type
   */
  const getThreatIntelligence = useCallback(async (threatType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await GroqService?.getThreatIntelligence(threatType);
      
      if (response?.success) {
        return { success: true, data: response?.data };
      } else {
        setError(response?.error || 'Failed to get threat intelligence');
        return { success: false, error: response?.error };
      }
    } catch (err) {
      const errorMessage = err?.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch incidents on mount
  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return {
    incidents,
    loading,
    error,
    aiReport,
    fetchIncidents,
    connectGoogle,
    addIncident,
    updateIncidentStatus,
    generateAIReport,
    bulkImportIncidents,
    getThreatIntelligence,
    // Statistics
    stats: {
      total: incidents?.length || 0,
      high: incidents?.filter(i => i?.severity?.toLowerCase() === 'high')?.length || 0,
      medium: incidents?.filter(i => i?.severity?.toLowerCase() === 'medium')?.length || 0,
      low: incidents?.filter(i => i?.severity?.toLowerCase() === 'low')?.length || 0,
      investigating: incidents?.filter(i => i?.status?.toLowerCase()?.includes('investigating'))?.length || 0,
      mitigated: incidents?.filter(i => i?.status?.toLowerCase()?.includes('mitigated'))?.length || 0
    }
  };
};
