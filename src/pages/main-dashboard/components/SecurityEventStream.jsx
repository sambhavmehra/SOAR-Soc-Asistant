import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import {Button} from '../../../components/ui/Button';
import backendService from '../../../services/backend';

const SecurityEventStream = ({ isConnected = true }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real security events from incidents
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await backendService.getIncidents();
      if (result.success && result.data) {
        // Transform incidents to events format
        const transformedEvents = result.data.slice(0, 10).map((incident, index) => ({
          id: incident.id || index + 1,
          timestamp: new Date(incident.timestamp || incident.createdAt || Date.now() - (index * 120000)),
          severity: (incident.severity || 'medium').toLowerCase(),
          type: incident.eventType || incident.type || 'Security Event',
          source: incident.sourceIP || incident.source || 'Unknown',
          description: incident.description || incident.details || 'Security incident detected',
          status: (incident.status || 'active').toLowerCase(),
          actions: getActionsForIncident(incident)
        }));

        setEvents(transformedEvents);
      } else {
        throw new Error(result.error || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching security events:', err);
      setError(err.message);
      // Fallback to empty array
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine actions based on incident type
  const getActionsForIncident = (incident) => {
    const severity = (incident.severity || 'medium').toLowerCase();
    const type = (incident.eventType || incident.type || '').toLowerCase();

    if (severity === 'critical' || type.includes('malware')) {
      return ['isolate', 'quarantine'];
    } else if (type.includes('login') || type.includes('auth')) {
      return ['block', 'monitor'];
    } else if (type.includes('phishing') || type.includes('email')) {
      return ['quarantine', 'notify'];
    } else {
      return ['monitor'];
    }
  };

  useEffect(() => {
    fetchEvents();

    // Refresh events every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-error border-error bg-error/10';
      case 'high': return 'text-warning border-warning bg-warning/10';
      case 'medium': return 'text-accent border-accent bg-accent/10';
      case 'low': return 'text-success border-success bg-success/10';
      default: return 'text-muted-foreground border-border bg-muted/10';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-error text-error-foreground';
      case 'investigating': return 'bg-warning text-warning-foreground';
      case 'resolved': return 'bg-success text-success-foreground';
      case 'blocked': return 'bg-secondary text-secondary-foreground';
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

  const handleQuickAction = (eventId, action) => {
    console.log(`Executing ${action} for event ${eventId}`);
    // Mock action execution
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon name="Activity" size={20} className="text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Security Event Stream</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchEvents}
              iconName="RefreshCw"
              iconSize={16}
              disabled={isLoading}
            >
              <span className="sr-only">Refresh events</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {!isConnected ? (
          <div className="p-8 text-center">
            <Icon name="WifiOff" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Connection lost. Events will resume when n8n reconnects.</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center">
            <Icon name="Loader2" size={32} className="text-accent animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading security events...</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events?.map((event) => (
              <div key={event?.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(event?.severity)}`}>
                        {event?.severity?.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event?.status)}`}>
                        {event?.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(event?.timestamp)}
                      </span>
                    </div>
                    
                    <h3 className="font-medium text-foreground mb-1">{event?.type}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {event?.description}
                    </p>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Icon name="MapPin" size={12} />
                      <span>Source: {event?.source}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    {event?.actions?.map((action) => (
                      <Button
                        key={action}
                        variant="outline"
                        size="xs"
                        onClick={() => handleQuickAction(event?.id, action)}
                        className="text-xs"
                      >
                        {action}
                      </Button>
                    ))}
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
          iconName="ExternalLink"
          iconPosition="right"
        >
          View All Events
        </Button>
      </div>
    </div>
  );
};

export default SecurityEventStream;