import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import TrafficMetricsCards from './components/TrafficMetricsCards';
import TrafficFlowVisualization from './components/TrafficFlowVisualization';
import ConnectionLogsTable from './components/ConnectionLogsTable';
import TrafficFilters from './components/TrafficFilters';
import { useSecurityIncidents } from '../../hooks/useSecurityIncidents';

const TrafficDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const { incidents, loading, error, updateIncidentStatus, generateAIReport } = useSecurityIncidents();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    // In a real application, this would trigger data refetch
    console.log('Filters updated:', newFilters);
  };

  return (
    <>
      <Helmet>
        <title>Traffic Dashboard - SOAR SOC Assistant</title>
        <meta name="description" content="Real-time network traffic monitoring and analysis dashboard for SOC teams" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header 
          onMenuToggle={handleMenuToggle}
          isMenuOpen={sidebarOpen}
        />
        
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}>
          <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Traffic Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Real-time security incident monitoring and analysis
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-2 bg-card border border-border rounded-lg">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">Incident Monitoring</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Last updated: {new Date()?.toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Traffic Metrics Cards */}
            <TrafficMetricsCards incidents={incidents} loading={loading} />

            {/* Traffic Filters */}
            <TrafficFilters onFiltersChange={handleFiltersChange} />

            {/* Traffic Flow Visualization */}
            <TrafficFlowVisualization incidents={incidents} loading={loading} />

            {/* Connection Logs Table */}
            <ConnectionLogsTable
              incidents={incidents}
              loading={loading}
              updateIncidentStatus={updateIncidentStatus}
              generateAIReport={generateAIReport}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default TrafficDashboard;
