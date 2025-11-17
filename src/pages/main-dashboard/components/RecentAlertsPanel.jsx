import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import {Button} from '../../../components/ui/Button';
import backendService from '../../../services/backend';

const RecentAlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real alerts from incidents
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await backendService.getIncidents();
      if (result.success && result.data) {
        // Transform incidents to alerts format and filter for active/investigating
        const transformedAlerts = result.data
          .filter(incident => {
            const status = (incident.status || '').toLowerCase();
            return status === 'active' || status === 'investigating' || status === 'open';
          })
          .slice(0, 5) // Limit to 5 most recent
          .map((incident, index) => ({
            id: incident.id || index + 1,
            title: getAlertTitle(incident),
            description: incident.description || incident.details || 'Security incident detected',
            severity: (incident.severity || 'medium').toLowerCase(),
            timestamp: new Date(incident.timestamp || incident.createdAt || Date.now() - (index * 300000)),
            source: getAlertSource(incident),
            affected: incident.affectedEndpoints || incident.affectedSystems || 1,
            status: (incident.status || 'active').toLowerCase()
          }));

        setAlerts(transformedAlerts);
      } else {
        throw new Error(result.error || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to generate alert title from incident
  const getAlertTitle = (incident) => {
    const type = incident.eventType || incident.type || '';
    const severity = incident.severity || '';

    if (type.toLowerCase().includes('malware')) {
      return 'Malware Detected';
    } else if (type.toLowerCase().includes('phishing')) {
      return 'Phishing Attempt Blocked';
    } else if (type.toLowerCase().includes('login') || type.toLowerCase().includes('auth')) {
      return 'Suspicious Login Activity';
    } else if (type.toLowerCase().includes('network')) {
      return 'Network Anomaly Detected';
    } else {
      return `${severity} ${type || 'Security'} Alert`;
    }
  };

  // Helper function to determine alert source
  const getAlertSource = (incident) => {
    const type = (incident.eventType || incident.type || '').toLowerCase();

    if (type.includes('malware') || type.includes('endpoint')) {
      return 'EDR';
    } else if (type.includes('network') || type.includes('firewall')) {
      return 'Firewall';
    } else if (type.includes('email') || type.includes('phishing')) {
      return 'Email Security';
    } else {
      return 'SIEM';
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-error';
      case 'high': return 'text-warning';
      case 'medium': return 'text-accent';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-error';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-accent';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-error text-error-foreground';
      case 'investigating': return 'bg-warning text-warning-foreground';
      case 'monitoring': return 'bg-accent text-accent-foreground';
      case 'acknowledged': return 'bg-secondary text-secondary-foreground';
      case 'resolved': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return timestamp?.toLocaleDateString();
  };

  const activeAlerts = alerts?.filter(alert => alert?.status === 'active' || alert?.status === 'investigating')?.length;

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1">
      <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
            </div>
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <span className="text-sm text-muted-foreground">Loading...</span>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {activeAlerts} Active
                  </span>
                  <div className={`w-2 h-2 rounded-full ${activeAlerts > 0 ? 'bg-error animate-pulse' : 'bg-success'}`} />
                </>
              )}
            </div>
          </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Icon name="Loader2" size={32} className="text-accent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <Icon name="AlertTriangle" size={32} className="text-error mx-auto mb-4" />
            <p className="text-muted-foreground">Error loading alerts: {error}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="CheckCircle" size={32} className="text-success mx-auto mb-4" />
            <p className="text-muted-foreground">No active alerts</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {alerts?.map((alert) => (
              <div key={alert?.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`w-1 h-12 rounded-full ${getSeverityBg(alert?.severity)} flex-shrink-0 mt-1`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground text-sm truncate">
                        {alert?.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatTimestamp(alert?.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {alert?.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert?.status)}`}>
                          {alert?.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {alert?.source}
                        </span>
                        {alert?.affected > 1 && (
                          <span className="text-xs text-muted-foreground">
                            {alert?.affected} affected
                          </span>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="xs"
                        iconName="ExternalLink"
                        iconSize={12}
                      >
                        <span className="sr-only">View alert details</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          fullWidth
          iconName="AlertTriangle"
          iconPosition="left"
        >
          View All Alerts
        </Button>
      </div>
    </div>
  );
};

export default RecentAlertsPanel;