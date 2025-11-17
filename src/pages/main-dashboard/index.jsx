import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import MetricCard from './components/MetricCard';
import SecurityEventStream from './components/SecurityEventStream';
import SystemIntegrationPanel from './components/SystemIntegrationPanel';
import RecentAlertsPanel from './components/RecentAlertsPanel';
import QuickActionsPanel from './components/QuickActionsPanel';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import backendService from '../../services/backend';

const MainDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isN8nConnected, setIsN8nConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(null);

  // Dynamic dashboard metrics from backend
  const [metrics, setMetrics] = useState({
    activeIncidents: { value: 0, change: 'Loading...', changeType: 'neutral' },
    blockedThreats: { value: 0, change: 'Loading...', changeType: 'neutral' },
    systemHealth: { value: '0%', change: 'Loading...', changeType: 'neutral' },
    automationStatus: { value: 'Checking...', change: 'Loading...', changeType: 'neutral' }
  });

  // Fetch metrics from backend
  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      setMetricsError(null);

      const [metricsResult, n8nResult] = await Promise.all([
        backendService.getMetrics(),
        backendService.request('/n8n/ping')
      ]);

      if (metricsResult.success && metricsResult.data) {
        const data = metricsResult.data;
        setMetrics({
          activeIncidents: {
            value: data.activeIncidents || 0,
            change: `${data.activeIncidents > 0 ? '+' : ''}${data.activeIncidents} active`,
            changeType: data.activeIncidents > 5 ? 'negative' : data.activeIncidents > 0 ? 'warning' : 'positive'
          },
          blockedThreats: {
            value: data.blockedThreats || 0,
            change: `${data.blockedThreats || 0} threats blocked`,
            changeType: 'positive'
          },
          systemHealth: {
            value: `${data.systemHealth || 0}%`,
            change: `Health score: ${data.systemHealth || 0}%`,
            changeType: (data.systemHealth || 0) >= 95 ? 'positive' : (data.systemHealth || 0) >= 85 ? 'warning' : 'negative'
          },
          automationStatus: {
            value: n8nResult.ok ? 'Online' : 'Offline',
            change: n8nResult.ok ? 'Connected' : 'Disconnected',
            changeType: n8nResult.ok ? 'positive' : 'negative'
          }
        });
        setIsN8nConnected(n8nResult.ok || false);
      } else {
        throw new Error(metricsResult.error || 'Failed to fetch metrics');
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetricsError(error.message);
      setMetrics(prev => ({
        ...prev,
        activeIncidents: { ...prev.activeIncidents, change: 'Error loading', changeType: 'negative' },
        blockedThreats: { ...prev.blockedThreats, change: 'Error loading', changeType: 'negative' },
        systemHealth: { ...prev.systemHealth, change: 'Error loading', changeType: 'negative' },
        automationStatus: { ...prev.automationStatus, change: 'Error loading', changeType: 'negative' }
      }));
    } finally {
      setMetricsLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchMetrics(); // Initial fetch

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      fetchMetrics(); // Refresh metrics every 30 seconds
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Real n8n connection status check
  useEffect(() => {
    const connectionCheck = setInterval(async () => {
      try {
        const result = await backendService.request('/n8n/ping');
        setIsN8nConnected(result.ok || false);
      } catch (error) {
        console.error('Error checking n8n connection:', error);
        setIsN8nConnected(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(connectionCheck);
  }, []);

  const handleMetricClick = (metricType) => {
    switch (metricType) {
      case 'incidents': navigate('/alerts-dashboard');
        break;
      case 'threats': navigate('/traffic-dashboard');
        break;
      case 'health': navigate('/settings-dashboard');
        break;
      case 'automation': navigate('/settings-dashboard');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className={`pt-16 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <div className="p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Security Operations Dashboard</h1>
                <p className="text-muted-foreground">
                  Real-time security monitoring and threat intelligence overview
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last updated</p>
                  <p className="text-sm font-medium text-foreground">
                    {lastUpdate?.toLocaleTimeString()}
                  </p>
                </div>
                
                <Button
                  variant="outline"
                  iconName="MessageSquare"
                  iconPosition="left"
                  onClick={() => navigate('/security-chatbot')}
                >
                  Investigate
                </Button>
              </div>
            </div>

            {/* Connection Status Banner */}
            {!isN8nConnected && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Icon name="WifiOff" size={20} className="text-error" />
                  <div>
                    <h3 className="font-medium text-error">n8n Connection Lost</h3>
                    <p className="text-sm text-error/80">
                      Automation engine is offline. Some features may be limited.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="RefreshCw"
                    iconPosition="left"
                    onClick={() => setIsN8nConnected(true)}
                  >
                    Retry Connection
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Active Incidents"
              value={metrics?.activeIncidents?.value}
              change={metrics?.activeIncidents?.change}
              changeType={metrics?.activeIncidents?.changeType}
              icon="AlertTriangle"
              iconColor={metrics?.activeIncidents?.changeType === 'negative' ? "bg-error" : metrics?.activeIncidents?.changeType === 'warning' ? "bg-warning" : "bg-success"}
              bgColor={metrics?.activeIncidents?.changeType === 'negative' ? "bg-error/10" : metrics?.activeIncidents?.changeType === 'warning' ? "bg-warning/10" : "bg-success/10"}
              status={metrics?.activeIncidents?.changeType === 'negative' ? "critical" : metrics?.activeIncidents?.changeType === 'warning' ? "warning" : "success"}
              onClick={() => handleMetricClick('incidents')}
              loading={metricsLoading}
            />

            <MetricCard
              title="Blocked Threats"
              value={metrics?.blockedThreats?.value?.toLocaleString()}
              change={metrics?.blockedThreats?.change}
              changeType={metrics?.blockedThreats?.changeType}
              icon="Shield"
              iconColor="bg-success"
              bgColor="bg-success/10"
              status="success"
              onClick={() => handleMetricClick('threats')}
              loading={metricsLoading}
            />

            <MetricCard
              title="System Health"
              value={metrics?.systemHealth?.value}
              change={metrics?.systemHealth?.change}
              changeType={metrics?.systemHealth?.changeType}
              icon="Activity"
              iconColor={metrics?.systemHealth?.changeType === 'negative' ? "bg-error" : metrics?.systemHealth?.changeType === 'warning' ? "bg-warning" : "bg-success"}
              bgColor={metrics?.systemHealth?.changeType === 'negative' ? "bg-error/10" : metrics?.systemHealth?.changeType === 'warning' ? "bg-warning/10" : "bg-success/10"}
              status={metrics?.systemHealth?.changeType === 'negative' ? "critical" : metrics?.systemHealth?.changeType === 'warning' ? "warning" : "success"}
              onClick={() => handleMetricClick('health')}
              loading={metricsLoading}
            />

            <MetricCard
              title="n8n Automation"
              value={metrics?.automationStatus?.value}
              change={metrics?.automationStatus?.change}
              changeType={metrics?.automationStatus?.changeType}
              icon="Zap"
              iconColor={isN8nConnected ? "bg-success" : "bg-error"}
              bgColor={isN8nConnected ? "bg-success/10" : "bg-error/10"}
              status={isN8nConnected ? "success" : "critical"}
              onClick={() => handleMetricClick('automation')}
              loading={metricsLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Security Event Stream - Takes 2 columns on xl screens */}
            <div className="xl:col-span-2">
              <SecurityEventStream isConnected={isN8nConnected} />
            </div>
            
            {/* System Integration Panel */}
            <div className="xl:col-span-1">
              <SystemIntegrationPanel />
            </div>
          </div>

          {/* Secondary Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Recent Alerts Panel */}
            <RecentAlertsPanel />
            
            {/* Quick Actions Panel */}
            <QuickActionsPanel />
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>SOAR SOC Assistant v2.1.0</span>
                <span>•</span>
                <span>© {new Date()?.getFullYear()} Security Operations Center</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="HelpCircle"
                  iconPosition="left"
                >
                  Help
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Settings"
                  iconPosition="left"
                  onClick={() => navigate('/settings-dashboard')}
                >
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainDashboard;