import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import backendService from '../../../services/backend';

const TrafficFlowVisualization = ({ incidents, loading }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLive, setIsLive] = useState(true);
  const [trafficData, setTrafficData] = useState([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficError, setTrafficError] = useState(null);

  const filterOptions = [
    { value: 'all', label: 'All Traffic', icon: 'Activity' },
    { value: 'blocked', label: 'Blocked', icon: 'Shield' },
    { value: 'allowed', label: 'Allowed', icon: 'CheckCircle' },
    { value: 'suspicious', label: 'Suspicious', icon: 'AlertTriangle' }
  ];

  // Fetch traffic data from IDS logs
  const fetchTrafficData = async () => {
    try {
      setTrafficLoading(true);
      setTrafficError(null);
      const result = await backendService.getIDSLogs(1000); // Get last 100 logs
      if (result.success && result.data) {
        // Map IDS logs to connection format
        const connections = result.data.map((log, idx) => ({
          id: log.timestamp + idx, // Create unique ID
          source: log.source_ip || 'Unknown',
          destination: log.destination_ip || 'Unknown',
          protocol: log.protocol || 'N/A',
          status: log.status || 'allowed', // Default to allowed if not specified
          bytes: log.packet_size || 0,
          timestamp: log.timestamp ? new Date(log.timestamp.replace(' ', 'T')) : new Date(),
          port: log.source_port || 'N/A',
          country: 'N/A', // Could be enhanced with IP geolocation
          alert_level: log.alert_level || 'normal',
          detection: log.detection || ''
        }));
        setTrafficData(connections);
      } else {
        setTrafficError('Failed to fetch traffic data');
      }
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      setTrafficError('Error loading traffic data');
    } finally {
      setTrafficLoading(false);
    }
  };

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchTrafficData(); // Initial fetch

    if (isLive) {
      const interval = setInterval(fetchTrafficData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const filteredConnections = trafficData?.filter(conn => {
    if (selectedFilter === 'all') return true;
    return conn?.status === selectedFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'allowed': return 'text-success';
      case 'blocked': return 'text-error';
      case 'suspicious': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'allowed': return 'bg-success/10';
      case 'blocked': return 'bg-error/10';
      case 'suspicious': return 'bg-warning/10';
      default: return 'bg-muted/10';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-1 mb-8">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Activity" size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Live Traffic Flow</h2>
              <p className="text-sm text-muted-foreground">Real-time network connections and blocking status</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>
            
            <Button
              variant={isLive ? "outline" : "default"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              iconName={isLive ? "Pause" : "Play"}
              iconPosition="left"
            >
              {isLive ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {filterOptions?.map((option) => {
            const count = trafficData?.filter(conn => option?.value === 'all' || conn?.status === option?.value)?.length || 0;
            return (
              <button
                key={option?.value}
                onClick={() => setSelectedFilter(option?.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-hover ${
                  selectedFilter === option?.value
                    ? 'bg-accent text-accent-foreground shadow-elevation-1'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon name={option?.icon} size={16} />
                <span>{option?.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedFilter === option?.value ? 'bg-accent-foreground/20' : 'bg-muted-foreground/20'
                }`}>
                  {trafficLoading ? '...' : count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
        {/* Traffic Visualization */}
      <div className="p-6">
        {trafficError && (
          <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" size={16} className="text-error" />
              <span className="text-sm text-error">{trafficError}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Flow Chart */}
          <div className="lg:col-span-2">
            <div className="h-80 bg-muted/20 rounded-lg border-2 border-dashed border-muted/40 flex items-center justify-center relative overflow-hidden">
              {trafficLoading ? (
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading traffic data...</p>
                </div>
              ) : trafficData.length === 0 ? (
                <div className="text-center">
                  <Icon name="Activity" size={48} className="text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Traffic Data</h3>
                  <p className="text-sm text-muted-foreground">
                    {isLive ? 'Waiting for network traffic...' : 'Enable live monitoring to see real-time connections'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Icon name="Activity" size={48} className="text-accent mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Live Network Traffic</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredConnections.length} connections • {isLive ? 'Live' : 'Paused'}
                  </p>
                </div>
              )}

              {/* Animated connection lines when live and has data */}
              {isLive && trafficData.length > 0 && (
                <div className="absolute inset-0">
                  {[...Array(Math.min(filteredConnections.length, 8))]?.map((_, i) => {
                    const connection = filteredConnections[i];
                    return (
                      <div
                        key={i}
                        className={`absolute w-1 h-1 rounded-full animate-pulse ${
                          connection?.status === 'blocked' ? 'bg-error' :
                          connection?.status === 'suspicious' ? 'bg-warning' : 'bg-accent'
                        }`}
                        style={{
                          left: `${10 + (i % 4) * 20}%`,
                          top: `${20 + Math.floor(i / 4) * 25}%`,
                          animationDelay: `${i * 0.3}s`
                        }}
                        title={`${connection?.source} → ${connection?.destination} (${connection?.status})`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Connections */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Recent Connections {filteredConnections.length > 0 && `(${filteredConnections.length})`}
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {trafficLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Icon name="Inbox" size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No connections found</p>
                </div>
              ) : (
                filteredConnections?.slice(0, 10)?.map((connection) => (
                  <div key={connection?.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusBg(connection?.status)} ${getStatusColor(connection?.status)}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {connection?.source}:{connection?.port}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          → {connection?.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium capitalize ${getStatusColor(connection?.status)}`}>
                        {connection?.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {connection?.bytes}B
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficFlowVisualization;
