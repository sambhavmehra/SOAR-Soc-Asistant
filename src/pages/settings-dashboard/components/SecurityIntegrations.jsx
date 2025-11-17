import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { testIntegration } from '../../../services/n8n';
import backendService from '../../../services/backend';

const IDSMonitor = () => {
  const [idsStatus, setIdsStatus] = useState(null);
  const [idsLogs, setIdsLogs] = useState([]);
  const [idsAlerts, setIdsAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    loadIDSStatus();
  }, []);

  const loadIDSStatus = async () => {
    try {
      const result = await backendService.getIDSStatus();
      if (result.success) {
        setIdsStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading IDS status:', error);
    }
  };

  const loadIDSLogs = async () => {
    try {
      setLoading(true);
      const result = await backendService.getIDSLogs(50);
      if (result.success) {
        setIdsLogs(result.data);
      }
    } catch (error) {
      console.error('Error loading IDS logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIDSAlerts = async () => {
    try {
      setLoading(true);
      const result = await backendService.getIDSAlerts();
      if (result.success) {
        setIdsAlerts(result.data);
      }
    } catch (error) {
      console.error('Error loading IDS alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      setLoading(true);
      const result = await backendService.startIDSMonitoring();
      if (result.success) {
        await loadIDSStatus();
        // Automatically switch to logs tab and load logs when monitoring starts
        setActiveTab('logs');
        await loadIDSLogs();
      }
    } catch (error) {
      console.error('Error starting IDS monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      setLoading(true);
      const result = await backendService.stopIDSMonitoring();
      if (result.success) {
        await loadIDSStatus();
      }
    } catch (error) {
      console.error('Error stopping IDS monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'logs' && idsLogs.length === 0) {
      loadIDSLogs();
    } else if (tab === 'alerts' && !idsAlerts) {
      loadIDSAlerts();
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getAlertLevelColor = (level) => {
    switch (level) {
      case 'alert': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Intrusion Detection System (IDS)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor network traffic and detect security threats in real-time
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {idsStatus?.is_monitoring ? (
            <Button
              variant="destructive"
              iconName="StopCircle"
              loading={loading}
              onClick={handleStopMonitoring}
            >
              Stop Monitoring
            </Button>
          ) : (
            <Button
              variant="default"
              iconName="Play"
              loading={loading}
              onClick={handleStartMonitoring}
            >
              Start Monitoring
            </Button>
          )}
          <Button
            variant="outline"
            iconName="RefreshCw"
            onClick={loadIDSStatus}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {idsStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Activity" className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <p className={`text-lg font-semibold mt-2 ${idsStatus.is_monitoring ? 'text-green-600' : 'text-red-600'}`}>
              {idsStatus.is_monitoring ? 'Active' : 'Inactive'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Package" className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium">Packets Processed</span>
            </div>
            <p className="text-lg font-semibold mt-2">{idsStatus.stats?.packets_processed?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="AlertTriangle" className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">Alerts Generated</span>
            </div>
            <p className="text-lg font-semibold mt-2">{idsStatus.stats?.alerts_generated?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Icon name="Gauge" className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">System Health</span>
            </div>
            <p className="text-lg font-semibold mt-2">{idsStatus.stats?.system_health || 0}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'status', label: 'Status', icon: 'Activity' },
            { id: 'logs', label: 'Logs', icon: 'FileText' },
            { id: 'alerts', label: 'Alerts', icon: 'AlertTriangle' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'status' && idsStatus && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">System Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium mb-2">Monitoring Stats</h5>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Uptime:</dt>
                    <dd className="text-sm">{Math.floor((idsStatus.stats?.uptime || 0) / 60)}m {((idsStatus.stats?.uptime || 0) % 60)}s</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">CPU Usage:</dt>
                    <dd className="text-sm">{idsStatus.stats?.cpu_usage?.toFixed(1) || 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Memory Usage:</dt>
                    <dd className="text-sm">{idsStatus.stats?.memory_usage?.toFixed(1) || 0}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Last Packet:</dt>
                    <dd className="text-sm">{idsStatus.stats?.last_packet_time ? formatTimestamp(idsStatus.stats.last_packet_time) : 'None'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h5 className="font-medium mb-2">Network Interfaces</h5>
                <div className="space-y-1">
                  {idsStatus.stats?.network_interfaces?.length > 0 ? (
                    idsStatus.stats.network_interfaces.map((iface, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {iface}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No interfaces detected</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Recent Logs</h4>
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                loading={loading}
                onClick={loadIDSLogs}
              >
                Refresh
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {idsLogs.length > 0 ? (
                idsLogs.map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getAlertLevelColor(log.alert_level)}`}>
                          {log.alert_level?.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{log.detection}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {log.source_ip} → {log.destination_ip} | {log.protocol} | {log.packet_size} bytes
                        {log.http_traffic && <span className="ml-2 text-yellow-600">⚠ HTTP Traffic</span>}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {loading ? 'Loading logs...' : 'No logs available'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && idsAlerts && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Alert Summary</h4>
              <Button
                variant="outline"
                size="sm"
                iconName="RefreshCw"
                loading={loading}
                onClick={loadIDSAlerts}
              >
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{idsAlerts.total_alerts}</div>
                <div className="text-sm text-red-800">Total Alerts</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{idsAlerts.recent_alerts?.length || 0}</div>
                <div className="text-sm text-yellow-800">Recent Alerts (24h)</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(idsAlerts.threat_summary || {}).length}</div>
                <div className="text-sm text-blue-800">Threat Types</div>
              </div>
            </div>

            {idsAlerts.recent_alerts?.length > 0 && (
              <div>
                <h5 className="font-medium mb-3">Recent Alerts</h5>
                <div className="space-y-2">
                  {idsAlerts.recent_alerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-muted/30 rounded border">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getAlertLevelColor(alert.alert_level)}`}>
                          {alert.alert_level?.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{alert.detection}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {alert.source_ip} → {alert.destination_ip} | {formatTimestamp(alert.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(idsAlerts.threat_summary || {}).length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium mb-3">Threat Distribution</h5>
                <div className="space-y-2">
                  {Object.entries(idsAlerts.threat_summary).map(([threat, count]) => (
                    <div key={threat} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="text-sm">{threat}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SecurityIntegrations = () => {
  const [integrations, setIntegrations] = useState(() => {
    const saved = localStorage.getItem('security_integrations');
    return saved ? JSON.parse(saved) : [];
  });

  const [autoDetectedIntegrations, setAutoDetectedIntegrations] = useState([]);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [testingConnection, setTestingConnection] = useState(null);
  const [detectingIntegrations, setDetectingIntegrations] = useState(false);

  const integrationTypes = [
    { value: 'SIEM', label: 'SIEM' },
    { value: 'EDR', label: 'EDR' },
    { value: 'Firewall', label: 'Firewall' },
    { value: 'IDS/IPS', label: 'IDS/IPS' },
    { value: 'Threat Intelligence', label: 'Threat Intelligence' },
    { value: 'Vulnerability Scanner', label: 'Vulnerability Scanner' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'warning': return 'text-warning';
      case 'disconnected': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-success/10';
      case 'warning': return 'bg-warning/10';
      case 'disconnected': return 'bg-error/10';
      default: return 'bg-muted/10';
    }
  };

  useEffect(() => {
    localStorage.setItem('security_integrations', JSON.stringify(integrations));
  }, [integrations]);

  const handleDetectIntegrations = async () => {
    setDetectingIntegrations(true);
    try {
      const result = await backendService.getAutoDetectedIntegrations();
      if (result.success) {
        setAutoDetectedIntegrations(result.data);
        // Merge auto-detected with user-configured integrations
        const mergedIntegrations = [...integrations];
        result.data.forEach(autoDetected => {
          const exists = mergedIntegrations.some(i => i.id === autoDetected.id);
          if (!exists) {
            mergedIntegrations.push({
              ...autoDetected,
              autoDetected: true,
              lastSync: new Date().toISOString(),
              events: 0
            });
          }
        });
        setIntegrations(mergedIntegrations);
      }
    } catch (error) {
      console.error('Error detecting integrations:', error);
    } finally {
      setDetectingIntegrations(false);
    }
  };

  const handleTestConnection = async (integrationId) => {
    setTestingConnection(integrationId);
    const integration = integrations?.find(i => i?.id === integrationId);
    try {
      const res = await testIntegration(integration);
      const ok = !!(res?.ok !== false);
      setIntegrations(prev => prev?.map(i => 
        i?.id === integrationId
          ? { ...i, status: ok ? 'connected' : 'disconnected', lastSync: new Date()?.toISOString() }
          : i
      ));
    } catch (e) {
      setIntegrations(prev => prev?.map(i => 
        i?.id === integrationId
          ? { ...i, status: 'disconnected', lastSync: new Date()?.toISOString() }
          : i
      ));
    } finally {
      setTestingConnection(null);
    }
  };

  const handleConfigureIntegration = (integration) => {
    setSelectedIntegration(integration || { id: `int-${Date.now()}`, name: '', type: '', status: 'disconnected', lastSync: null, apiEndpoint: '', webhookUrl: '', isConfigured: false, events: 0 });
    setIsConfiguring(true);
  };

  const handleSaveConfiguration = () => {
    if (selectedIntegration) {
      setIntegrations(prev => {
        const exists = prev?.some(i => i?.id === selectedIntegration?.id);
        if (exists) {
          return prev?.map(i => i?.id === selectedIntegration?.id ? { ...selectedIntegration, isConfigured: true } : i);
        }
        return [...prev, { ...selectedIntegration, isConfigured: true }];
      });
    }
    setIsConfiguring(false);
    setSelectedIntegration(null);
  };

  const formatLastSync = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date?.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Security Tool Integrations</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage connections to your security infrastructure
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            iconName="Search"
            loading={detectingIntegrations}
            onClick={handleDetectIntegrations}
            disabled={detectingIntegrations}
          >
            Detect Integrations
          </Button>
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={() => setIsConfiguring(true)}
          >
            Add Integration
          </Button>
        </div>
      </div>
      {/* Integration Cards */}
      <div className="grid gap-4">
        {integrations?.map((integration) => (
          <div key={integration?.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg ${getStatusBgColor(integration?.status)} flex items-center justify-center`}>
                  <Icon 
                    name={integration?.type === 'SIEM' ? 'Database' : 
                          integration?.type === 'EDR' ? 'Shield' :
                          integration?.type === 'Firewall' ? 'Flame' :
                          integration?.type === 'IDS/IPS' ? 'Eye' : 'Globe'} 
                    size={24} 
                    className={getStatusColor(integration?.status)}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-foreground">{integration?.name}</h4>
                    <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                      {integration?.type}
                    </span>
                    {integration?.autoDetected && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Auto-detected
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(integration?.status)?.replace('text-', 'bg-')}`} />
                      <span className={`text-xs font-medium ${getStatusColor(integration?.status)} capitalize`}>
                        {integration?.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Last sync: {formatLastSync(integration?.lastSync)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Events processed: {integration?.events?.toLocaleString()}
                    </p>
                    {integration?.apiEndpoint && (
                      <p className="text-xs text-muted-foreground font-mono">
                        {integration?.apiEndpoint}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="TestTube"
                  loading={testingConnection === integration?.id}
                  onClick={() => handleTestConnection(integration?.id)}
                  disabled={testingConnection !== null}
                >
                  Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Settings"
                  onClick={() => handleConfigureIntegration(integration)}
                >
                  Configure
                </Button>
              </div>
            </div>

            {/* Webhook URL */}
            {integration?.webhookUrl && (
              <div className="mt-4 p-3 bg-muted/30 rounded border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Webhook Endpoint
                    </p>
                    <p className="text-sm font-mono text-foreground mt-1">
                      {integration?.webhookUrl}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Copy"
                    onClick={() => navigator.clipboard?.writeText(integration?.webhookUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Configuration Modal */}
      {isConfiguring && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedIntegration ? 'Configure Integration' : 'Add New Integration'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                iconName="X"
                onClick={() => {
                  setIsConfiguring(false);
                  setSelectedIntegration(null);
                }}
              />
            </div>

            <div className="space-y-4">
              <Input
                label="Integration Name"
                placeholder="Enter integration name"
                value={selectedIntegration?.name || ''}
                onChange={(e) => setSelectedIntegration(prev => ({
                  ...prev,
                  name: e?.target?.value
                }))}
              />

              <Select
                label="Integration Type"
                options={integrationTypes}
                value={selectedIntegration?.type || ''}
                onChange={(value) => setSelectedIntegration(prev => ({
                  ...prev,
                  type: value
                }))}
              />

              <Input
                label="API Endpoint"
                placeholder="https://api.example.com/v1"
                value={selectedIntegration?.apiEndpoint || ''}
                onChange={(e) => setSelectedIntegration(prev => ({
                  ...prev,
                  apiEndpoint: e?.target?.value
                }))}
              />

              <Input
                label="API Key"
                type="password"
                placeholder="Enter API key"
                description="API key will be encrypted and stored securely"
              />

              <Input
                label="Webhook URL (Optional)"
                placeholder="https://n8n.company.com/webhook/integration"
                value={selectedIntegration?.webhookUrl || ''}
                onChange={(e) => setSelectedIntegration(prev => ({
                  ...prev,
                  webhookUrl: e?.target?.value
                }))}
                description="n8n webhook endpoint for receiving events (leave empty if not using webhooks)"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfiguring(false);
                  setSelectedIntegration(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveConfiguration}
                iconName="Save"
                iconPosition="left"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityIntegrations;