import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AlertsTable from './components/AlertsTable';
import AlertsFilters from './components/AlertsFilters';
import AlertsSummary from './components/AlertsSummary';
import BulkActions from './components/BulkActions';
import { useSecurityIncidents } from '../../hooks/useSecurityIncidents';
import n8nAgentService from '../../services/n8nAgent';

const AlertsDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState([]);
  const { incidents, loading, error } = useSecurityIncidents();

  // Filters state
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    status: '',
    timeRange: '24h',
    assignee: ''
  });

  // Map Google Sheets incidents to alerts view
  const alerts = useMemo(() => {
    const iconByType = (t) => {
      const s = (t || '').toLowerCase();
      if (s.includes('malware')) return 'Bug';
      if (s.includes('intrusion') || s.includes('brute')) return 'Shield';
      if (s.includes('ddos') || s.includes('traffic')) return 'Zap';
      if (s.includes('phishing') || s.includes('mail')) return 'Mail';
      if (s.includes('data') || s.includes('breach') || s.includes('db')) return 'Database';
      if (s.includes('suspicious') || s.includes('privilege')) return 'Eye';
      return 'AlertTriangle';
    };
    return (incidents || [])
      .filter(i => {
        // Filter out fake events/users
        if (!i?.eventid) return false;
        if (i?.eventid.startsWith('INC-') && i?.eventid.length > 10) return false;
        if (i?.sourceip?.toLowerCase() === 'unknown') return false;
        if (i?.destinationip?.toLowerCase() === 'unknown') return false;
        return true;
      })
      .map(i => ({
        id: i?.eventid || `INC-${Math.random()}`,
        eventId: i?.eventid || 'N/A',
        severity: i?.severity || 'Medium',
        type: i?.attacktype || 'Security Event',
        timestamp: i?.timestamp ? new Date(i?.timestamp) : new Date(),
        sourceIp: i?.sourceip || 'Unknown',
        destinationIp: i?.destinationip || 'Unknown',
        affectedSystem: i?.destinationip || i?.sourceip || 'Unknown',
        status: i?.status || 'Open',
        actionTaken: i?.actiontaken || 'None',
        assignedTo: null,
        icon: iconByType(i?.attacktype)
      }));
  }, [incidents]);

  const summaryData = useMemo(() => {
    const crit = alerts?.filter(a => (a?.severity || '').toLowerCase() === 'critical').length;
    const high = alerts?.filter(a => (a?.severity || '').toLowerCase() === 'high').length;
    const open = alerts?.filter(a => (a?.status || '').toLowerCase() === 'open').length;
    return {
      critical: crit,
      criticalChange: 0,
      high: high,
      highChange: 0,
      open: open,
      openChange: 0,
      avgResponseTime: 0,
      responseTimeChange: 0,
      resolvedToday: 0,
      resolvedChange: 0,
      escalated: 0,
      escalatedChange: 0
    };
  }, [alerts]);

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    return alerts?.filter(alert => {
      if (filters?.severity && alert?.severity?.toLowerCase() !== filters?.severity?.toLowerCase()) {
        return false;
      }
      if (filters?.type && !alert?.type?.toLowerCase()?.includes(filters?.type?.toLowerCase())) {
        return false;
      }
      if (filters?.status && alert?.status?.toLowerCase() !== filters?.status?.toLowerCase()) {
        return false;
      }
      if (filters?.assignee) {
        if (filters?.assignee === 'unassigned' && alert?.assignedTo) {
          return false;
        }
        if (filters?.assignee !== 'unassigned' && alert?.assignedTo !== filters?.assignee?.replace('-', ' ')?.replace(/\b\w/g, l => l?.toUpperCase())) {
          return false;
        }
      }
      if (filters?.timeRange && filters?.timeRange !== 'all') {
        const now = new Date();
        const alertTime = new Date(alert.timestamp);
        const diffHours = (now - alertTime) / (1000 * 60 * 60);
        
        switch (filters?.timeRange) {
          case '1h':
            return diffHours <= 1;
          case '24h':
            return diffHours <= 24;
          case '7d':
            return diffHours <= 168;
          case '30d':
            return diffHours <= 720;
          default:
            return true;
        }
      }
      return true;
    });
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      severity: '',
      type: '',
      status: '',
      timeRange: '24h',
      assignee: ''
    });
  };

  // Handle alert actions
  const handleAlertAction = async (action, alertId) => {
    console.log(`Performing ${action} on alert ${alertId}`);

    if (action === 'analyze') {
      // Call n8n agent to submit alert for analysis
      try {
        const response = await n8nAgentService.submitSecurityAlert({
          incident_id: alertId,
          alert_type: 'security',
          severity: 'medium',
          source_ip: 'unknown',
          description: `Analyze alert ${alertId}`
        });
        console.log('Analysis response:', response);
        // Optionally refresh alerts or show notification
      } catch (error) {
        console.error('Error submitting alert for analysis:', error);
      }
      return;
    }

    if (action === 'investigate') {
      navigate('/security-chatbot', { 
        state: { 
          alertId,
          context: `Investigating alert ${alertId}` 
        }
      });
    }
    
    // Here you would typically make API calls to perform the action
    // For now, we'll just log the action
  };

  // Handle alert selection
  const handleSelectAlert = (alertId, isSelected) => {
    setSelectedAlerts(prev => {
      if (isSelected) {
        return [...prev, alertId];
      } else {
        return prev?.filter(id => id !== alertId);
      }
    });
  };

  // Handle select all alerts
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedAlerts(filteredAlerts?.map(alert => alert?.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action, assignee = null) => {
    console.log(`Performing bulk ${action} on ${selectedAlerts?.length} alerts`, { assignee });
    
    // Here you would typically make API calls to perform the bulk action
    // For now, we'll just clear the selection
    setSelectedAlerts([]);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedAlerts([]);
  };

  // Notifications are sourced from actual critical/high alerts if needed

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
      <main className={`pt-16 transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
      }`}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Security Alerts</h1>
              <p className="text-muted-foreground">
                Monitor and respond to active security incidents
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <AlertsSummary summaryData={summaryData} />

          {/* Filters */}
          <AlertsFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            alertsCount={filteredAlerts?.length}
            selectedCount={selectedAlerts?.length}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedAlerts?.length}
            onBulkAction={handleBulkAction}
            onClearSelection={handleClearSelection}
          />

          {/* Alerts Table */}
          <AlertsTable
            alerts={filteredAlerts}
            onAlertAction={handleAlertAction}
            selectedAlerts={selectedAlerts}
            onSelectAlert={handleSelectAlert}
            onSelectAll={handleSelectAll}
          />
        </div>
      </main>
      {/* No fake notifications: only real alerts in table */}
    </div>
  );
};

export default AlertsDashboard;