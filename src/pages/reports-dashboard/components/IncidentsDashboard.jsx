import React, { useState } from 'react';
import { useSecurityIncidents } from '../../../hooks/useSecurityIncidents';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import IncidentLogger from './IncidentLogger';

const IncidentsDashboard = () => {
  const { 
    incidents, 
    loading, 
    error, 
    stats, 
    updateIncidentStatus, 
    generateAIReport,
    getThreatIntelligence,
    connectGoogle
  } = useSecurityIncidents();
  
  const [showLogger, setShowLogger] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [threatIntel, setThreatIntel] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});

  const handleStatusUpdate = async (eventId, newStatus) => {
    setLoadingStates(prev => ({ ...prev, [eventId]: true }));
    
    const result = await updateIncidentStatus(eventId, newStatus, 'Status Updated');
    
    setLoadingStates(prev => ({ ...prev, [eventId]: false }));
    
    if (!result?.success) {
      console.error('Failed to update status:', result?.error);
    }
  };

  const handleGenerateAIReport = async () => {
    setLoadingStates(prev => ({ ...prev, aiReport: true }));

    const result = await generateAIReport();

    if (result?.success) {
      setAiReport(result?.data);

      // Save AI report to localStorage
      const aiReportData = {
        id: Date.now(),
        title: 'AI Security Report',
        description: result?.data?.executiveSummary || 'Automated security analysis report',
        content: result?.data,
        generatedAt: new Date().toISOString(),
        type: 'ai-report',
        status: 'completed',
        format: 'json',
        icon: 'Brain'
      };

      const existingReports = JSON.parse(localStorage.getItem('reports') || '[]');
      const updatedReports = [aiReportData, ...existingReports];
      localStorage.setItem('reports', JSON.stringify(updatedReports));
    }

    setLoadingStates(prev => ({ ...prev, aiReport: false }));
  };

  const handleGetThreatIntel = async (attackType) => {
    setLoadingStates(prev => ({ ...prev, threatIntel: true }));
    
    const result = await getThreatIntelligence(attackType);
    
    if (result?.success) {
      setThreatIntel(result?.data);
    }
    
    setLoadingStates(prev => ({ ...prev, threatIntel: false }));
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors?.[severity?.toLowerCase()] || colors?.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      investigating: 'text-blue-600 bg-blue-100',
      mitigated: 'text-green-600 bg-green-100',
      resolved: 'text-green-600 bg-green-100',
      escalated: 'text-red-600 bg-red-100'
    };
    return colors?.[status?.toLowerCase()] || colors?.investigating;
  };

  if (loading && incidents?.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Icon name="Loader2" size={32} className="text-muted-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading security incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center">
          <Icon name="AlertTriangle" size={32} className="text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Incidents</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button
            variant="outline"
            iconName="RefreshCw"
            iconPosition="left"
            onClick={() => window.location?.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Security Incidents</h2>
          <p className="text-muted-foreground">
            Integrated with Google Sheets and AI-powered analysis
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            iconName="FileText"
            iconPosition="left"
            onClick={handleGenerateAIReport}
            disabled={loadingStates?.aiReport}
          >
            {loadingStates?.aiReport ? 'Generating...' : 'AI Report'}
          </Button>
          <Button
            variant="outline"
            iconName="Link"
            iconPosition="left"
            onClick={connectGoogle}
          >
            Connect Google
          </Button>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setShowLogger(true)}
          >
            Log Incident
          </Button>
        </div>
      </div>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{stats?.total}</div>
          <div className="text-xs text-muted-foreground">Total Incidents</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats?.high}</div>
          <div className="text-xs text-muted-foreground">High Severity</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats?.medium}</div>
          <div className="text-xs text-muted-foreground">Medium Severity</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats?.low}</div>
          <div className="text-xs text-muted-foreground">Low Severity</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats?.investigating}</div>
          <div className="text-xs text-muted-foreground">Investigating</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats?.mitigated}</div>
          <div className="text-xs text-muted-foreground">Mitigated</div>
        </div>
      </div>
      {/* Incidents Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Incidents</h3>
        </div>
        
        {incidents?.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Shield" size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No incidents logged yet</h3>
            <p className="text-muted-foreground mb-4">
              Start logging security incidents to track and analyze threats
            </p>
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={() => setShowLogger(true)}
            >
              Log First Incident
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Timestamp</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Event ID</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Severity</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Source IP</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Attack Type</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents?.slice(0, 10)?.map((incident, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/10">
                    <td className="px-6 py-4 text-sm text-foreground">
                      {incident?.timestamp}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                      {incident?.eventid}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident?.severity)}`}>
                        {incident?.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground">
                      {incident?.sourceip}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      <button
                        onClick={() => handleGetThreatIntel(incident?.attacktype)}
                        className="text-accent hover:underline"
                      >
                        {incident?.attacktype}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(incident?.status)}`}>
                        {incident?.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {incident?.status?.toLowerCase() === 'investigating' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(incident?.eventid, 'Mitigated')}
                            disabled={loadingStates?.[incident?.eventid]}
                          >
                            {loadingStates?.[incident?.eventid] ? 'Updating...' : 'Mitigate'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          iconName="ExternalLink"
                          onClick={() => setSelectedIncident(incident)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* AI Report Modal */}
      {aiReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">AI Security Report</h2>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={() => setAiReport(null)}
              />
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Executive Summary</h3>
                <p className="text-muted-foreground">{aiReport?.executiveSummary}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Key Statistics</h3>
                <p className="text-muted-foreground">{aiReport?.statistics}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Top Threats</h3>
                <p className="text-muted-foreground">{aiReport?.topThreats}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Recommendations</h3>
                <p className="text-muted-foreground">{aiReport?.recommendations}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Threat Intelligence Modal */}
      {threatIntel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Threat Intelligence</h2>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={() => setThreatIntel(null)}
              />
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Attack Patterns</h3>
                <p className="text-muted-foreground">{threatIntel?.attackPatterns}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Prevention Strategies</h3>
                <p className="text-muted-foreground">{threatIntel?.prevention}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Risk Level</h3>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(threatIntel?.riskLevel)}`}>
                  {threatIntel?.riskLevel}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Incident Logger Modal */}
      <IncidentLogger
        isOpen={showLogger}
        onClose={() => setShowLogger(false)}
      />
    </div>
  );
};

export default IncidentsDashboard;