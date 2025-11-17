import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import ReportCard from './components/ReportCard';
import ReportBuilder from './components/ReportBuilder';
import ScheduledReports from './components/ScheduledReports';
import ReportPreview from './components/ReportPreview';
import ReportFilters from './components/ReportFilters';
import IncidentsDashboard from './components/IncidentsDashboard';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import backendService from '../../services/backend';

const ReportsDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [filteredReports, setFilteredReports] = useState([]);
  const [reportMetrics, setReportMetrics] = useState({
    totalReports: 0,
    scheduledReports: 0,
    generatedToday: 0,
    failedReports: 0
  });

  const [reports, setReports] = useState(() => {
    const storedReports = localStorage.getItem('reports');
    return storedReports ? JSON.parse(storedReports) : [];
  });

  useEffect(() => {
    localStorage.setItem('reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    setFilteredReports(reports);
  }, [reports]);

  // Fetch report metrics on component mount and when reports change
  useEffect(() => {
    const fetchReportMetrics = async () => {
      try {
        // Get scheduled tasks for scheduled reports count
        const scheduledResult = await backendService.getScheduledTasks();
        const scheduledTasks = scheduledResult.success ? scheduledResult.data : [];

        // Calculate metrics from reports data
        const totalReports = reports.length;
        const scheduledReports = scheduledTasks.length;
        const generatedToday = reports.filter(report => {
          const today = new Date().toDateString();
          const reportDate = new Date(report.lastGenerated || report.generatedAt).toDateString();
          return reportDate === today && report.status === 'completed';
        }).length;
        const failedReports = reports.filter(report => report.status === 'failed').length;

        setReportMetrics({
          totalReports,
          scheduledReports,
          generatedToday,
          failedReports
        });
      } catch (error) {
        console.error('Error fetching report metrics:', error);
        // Fallback to local data
        setReportMetrics({
          totalReports: reports.length,
          scheduledReports: 0,
          generatedToday: reports.filter(report => {
            const today = new Date().toDateString();
            const reportDate = new Date(report.lastGenerated || report.generatedAt).toDateString();
            return reportDate === today && report.status === 'completed';
          }).length,
          failedReports: reports.filter(report => report.status === 'failed').length
        });
      }
    };

    fetchReportMetrics();
  }, [reports]);

  const handleMenuToggle = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(!sidebarCollapsed);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleFilterChange = (filters) => {
    let filtered = reports;

    if (filters?.category !== 'all') {
      filtered = filtered?.filter(report => report?.category === filters?.category);
    }
    if (filters?.status !== 'all') {
      filtered = filtered?.filter(report => report?.status === filters?.status);
    }
    if (filters?.dateRange !== 'all') {
      filtered = filtered?.filter(report => report?.dateRange === filters?.dateRange);
    }
    if (filters?.format !== 'all') {
      filtered = filtered?.filter(report => report?.format?.toLowerCase() === filters?.format);
    }

    setFilteredReports(filtered);
  };

  const handleSearch = (query) => {
    if (!query?.trim()) {
      setFilteredReports(reports);
      return;
    }

    let filtered = reports?.filter(report =>
      report?.title?.toLowerCase()?.includes(query?.toLowerCase()) ||
      report?.description?.toLowerCase()?.includes(query?.toLowerCase())
    );
    setFilteredReports(filtered);
  };

  const handleGenerateReport = async (report) => {
    try {
      // Fetch real incidents data
      const incidentsResult = await backendService.getIncidents();
      if (!incidentsResult.success) {
        console.error('Failed to fetch incidents for report generation');
        return;
      }

      const incidents = incidentsResult.data || [];

      // Generate AI-powered report
      const reportResult = await backendService.generateIncidentReport(incidents);
      if (!reportResult.success) {
        console.error('Failed to generate AI report');
        return;
      }

      const aiReport = reportResult.data;

      // Create comprehensive report with AI content and real data
      const newReport = {
        ...report,
        id: Date.now(),
        status: 'completed',
        lastGenerated: new Date().toLocaleString(),
        size: '2.5 MB',
        format: 'PDF',
        aiContent: aiReport,
        incidentCount: incidents.length,
        generatedFromIncidents: incidents,
        executiveSummary: aiReport.executiveSummary,
        statistics: aiReport.statistics,
        topThreats: aiReport.topThreats,
        recommendations: aiReport.recommendations,
        riskAssessment: aiReport.riskAssessment
      };

      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      setShowReportPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
      // Fallback to basic report if AI generation fails
      const fallbackReport = {
        ...report,
        id: Date.now(),
        status: 'failed',
        lastGenerated: new Date().toLocaleString(),
        error: 'Failed to generate AI report'
      };
      setReports(prev => [fallbackReport, ...prev]);
      setSelectedReport(fallbackReport);
      setShowReportPreview(true);
    }
  };

  const handlePreviewReport = (report) => {
    setSelectedReport(report);
    setShowReportPreview(true);
  };

  const handleDownloadReport = async (report) => {
    try {
      // Generate comprehensive report content matching the preview
      const incidents = report.generatedFromIncidents || [];
      const totalIncidents = incidents.length;
      const resolvedIncidents = incidents.filter(inc => inc.status?.toLowerCase() === 'resolved').length;
      const criticalIncidents = incidents.filter(inc => inc.severity?.toLowerCase() === 'critical').length;
      const highIncidents = incidents.filter(inc => inc.severity?.toLowerCase() === 'high').length;
      const resolutionRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

      let content = `${report?.title || 'Security Incident Report'}\n`;
      content += `Generated: ${report?.lastGenerated || new Date().toLocaleString()}\n\n`;

      // Executive Summary
      content += `EXECUTIVE SUMMARY\n`;
      content += `================\n\n`;
      content += `${report.executiveSummary || `This security report covers ${totalIncidents} security incidents processed by our SOC. During this timeframe, ${resolvedIncidents} incidents were successfully resolved, representing a ${resolutionRate}% resolution rate.`}\n\n`;

      // Key Metrics
      content += `KEY SECURITY METRICS\n`;
      content += `====================\n\n`;
      content += `Total Incidents: ${totalIncidents}\n`;
      content += `Resolved Incidents: ${resolvedIncidents}\n`;
      content += `Critical Incidents: ${criticalIncidents}\n`;
      content += `High Severity Incidents: ${highIncidents}\n`;
      content += `Resolution Rate: ${resolutionRate}%\n\n`;

      // Statistics from AI
      if (report.statistics) {
        content += `INCIDENT STATISTICS\n`;
        content += `===================\n\n`;
        content += `${JSON.stringify(report.statistics, null, 2)}\n\n`;
      }

      // Top Threats
      if (report.topThreats) {
        content += `TOP THREATS IDENTIFIED\n`;
        content += `======================\n\n`;
        content += `${JSON.stringify(report.topThreats, null, 2)}\n\n`;
      }

      // Recent Incidents
      content += `RECENT SECURITY INCIDENTS\n`;
      content += `==========================\n\n`;
      incidents.slice(0, 10).forEach((incident, index) => {
        content += `${index + 1}. ${incident.eventType || incident.attackType || 'Unknown'}\n`;
        content += `   ID: ${incident.eventId || `INC-${Date.now() - index * 1000}`}\n`;
        content += `   Severity: ${incident.severity || 'Low'}\n`;
        content += `   Status: ${incident.status || 'Open'}\n`;
        content += `   Date: ${incident.timestamp ? new Date(incident.timestamp).toLocaleDateString() : 'N/A'}\n\n`;
      });

      // Recommendations
      if (report.recommendations) {
        content += `RECOMMENDATIONS\n`;
        content += `===============\n\n`;
        if (Array.isArray(report.recommendations)) {
          report.recommendations.forEach((rec, index) => {
            content += `${index + 1}. ${rec}\n`;
          });
        } else {
          content += `${report.recommendations}\n`;
        }
        content += `\n`;
      }

      // Risk Assessment
      if (report.riskAssessment) {
        content += `RISK ASSESSMENT\n`;
        content += `===============\n\n`;
        content += `${JSON.stringify(report.riskAssessment, null, 2)}\n\n`;
      }

      // Add detailed incident analysis for single incident reports
      if (report.generatedFromIncidents && report.generatedFromIncidents.length === 1 && report.aiContent) {
        content += `INCIDENT OVERVIEW\n`;
        content += `=================\n\n`;
        content += `${report.aiContent.incidentOverview || 'Not available'}\n\n`;

        content += `TIMELINE OF EVENTS\n`;
        content += `==================\n\n`;
        if (Array.isArray(report.aiContent.timeline)) {
          report.aiContent.timeline.forEach((event, index) => {
            content += `${index + 1}. ${event.time || 'TBD'} - ${event.action || event.description}\n`;
          });
        } else {
          content += `${report.aiContent.timeline || 'Not available'}\n`;
        }
        content += `\n`;

        content += `ATTACK ANALYSIS\n`;
        content += `===============\n\n`;
        content += `${report.aiContent.attackAnalysis || 'Not available'}\n\n`;

        content += `IMPACT ASSESSMENT\n`;
        content += `=================\n\n`;
        content += `${report.aiContent.impactAssessment || 'Not available'}\n\n`;

        content += `RESPONSE ACTIONS\n`;
        content += `================\n\n`;
        if (Array.isArray(report.aiContent.responseActions)) {
          report.aiContent.responseActions.forEach((action, index) => {
            content += `${index + 1}. ${action}\n`;
          });
        } else {
          content += `${report.aiContent.responseActions || 'Not available'}\n`;
        }
        content += `\n`;

        content += `CONTAINMENT & ERADICATION\n`;
        content += `=========================\n\n`;
        content += `${report.aiContent.containment || 'Not available'}\n\n`;

        content += `RECOVERY STEPS\n`;
        content += `==============\n\n`;
        content += `${report.aiContent.recovery || 'Not available'}\n\n`;

        content += `LESSONS LEARNED\n`;
        content += `===============\n\n`;
        content += `${report.aiContent.lessonsLearned || 'Not available'}\n\n`;

        content += `EVIDENCE & ARTIFACTS\n`;
        content += `====================\n\n`;
        content += `${report.aiContent.evidence || 'Not available'}\n\n`;
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(report?.title || 'security_report').replace(/\s+/g,'_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      // Fallback to basic download
      const content = `Report: ${report?.title || 'Report'}\nGenerated: ${report?.lastGenerated || new Date().toISOString()}\nError: Failed to generate detailed report\n`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(report?.title || 'report').replace(/\s+/g,'_').toLowerCase()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCreateCustomReport = async (config) => {
    try {
      // Fetch incidents based on config date range and filters
      const incidentsResult = await backendService.getIncidents();
      if (!incidentsResult.success) {
        console.error('Failed to fetch incidents for custom report');
        return;
      }

      let incidents = incidentsResult.data || [];

      // Apply date range filter if specified
      if (config.dateRange && config.dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (config.dateRange) {
          case 'last_24_hours':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last_90_days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0); // All time
        }

        incidents = incidents.filter(inc =>
          inc.timestamp && new Date(inc.timestamp) >= startDate
        );
      }

      // Generate AI-powered report
      const reportResult = await backendService.generateIncidentReport(incidents);
      if (!reportResult.success) {
        console.error('Failed to generate AI report for custom report');
        return;
      }

      const aiReport = reportResult.data;

      const title = config?.title || 'Custom Security Report';
      const customReport = {
        title,
        config,
        generatedAt: new Date(),
        id: Date.now(),
        status: 'completed',
        lastGenerated: new Date().toLocaleString(),
        size: '2.8 MB',
        format: config.format || 'PDF',
        aiContent: aiReport,
        incidentCount: incidents.length,
        generatedFromIncidents: incidents,
        executiveSummary: aiReport.executiveSummary,
        statistics: aiReport.statistics,
        topThreats: aiReport.topThreats,
        recommendations: aiReport.recommendations,
        riskAssessment: aiReport.riskAssessment
      };

      setSelectedReport(customReport);
      setShowReportPreview(true);
    } catch (error) {
      console.error('Error creating custom report:', error);
      // Fallback
      const title = config?.title || 'Custom Report';
      setSelectedReport({
        title,
        config,
        generatedAt: new Date(),
        error: 'Failed to generate AI-powered custom report'
      });
      setShowReportPreview(true);
    }
  };

  const tabs = [
    { id: 'library', label: 'Report Library', icon: 'FolderOpen' },
    { id: 'scheduled', label: 'Scheduled Reports', icon: 'Calendar' },
    { id: 'incidents', label: 'Security Incidents', icon: 'Shield' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isMenuOpen={sidebarOpen} />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
      />
      <main className={`pt-16 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
      }`}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports Dashboard</h1>
              <p className="text-muted-foreground">
                Generate, schedule, and manage security reports and analytics
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                iconName="RefreshCw"
                iconPosition="left"
              >
                Refresh
              </Button>
              <Button
                variant="default"
                iconName="Plus"
                iconPosition="left"
                onClick={() => setShowReportBuilder(true)}
              >
                Create Report
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold text-foreground">{reportMetrics.totalReports}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Icon name="FileText" size={24} className="text-accent" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Icon name="TrendingUp" size={16} className="text-success mr-1" />
                <span className="text-success">+{Math.max(0, reportMetrics.totalReports - 21)} this week</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-foreground">{reportMetrics.scheduledReports}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Icon name="Calendar" size={24} className="text-warning" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Icon name="Clock" size={16} className="text-muted-foreground mr-1" />
                <span className="text-muted-foreground">{Math.floor(reportMetrics.scheduledReports / 2)} active</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Generated Today</p>
                  <p className="text-2xl font-bold text-foreground">{reportMetrics.generatedToday}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-success" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Icon name="Download" size={16} className="text-muted-foreground mr-1" />
                <span className="text-muted-foreground">{(reportMetrics.generatedToday * 3.03).toFixed(1)} MB total</span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Reports</p>
                  <p className="text-2xl font-bold text-foreground">{reportMetrics.failedReports}</p>
                </div>
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                  <Icon name="XCircle" size={24} className="text-error" />
                </div>
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Icon name="AlertTriangle" size={16} className="text-error mr-1" />
                <span className="text-error">{reportMetrics.failedReports > 0 ? 'Requires attention' : 'All good'}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex space-x-8">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab?.id
                      ? 'border-accent text-accent' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  }`}
                >
                  <Icon name={tab?.icon} size={18} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              {/* Filters */}
              <ReportFilters
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
              />

              {/* Report Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredReports?.map((report) => (
                  <ReportCard
                    key={report?.id}
                    report={report}
                    onGenerate={handleGenerateReport}
                    onPreview={handlePreviewReport}
                    onDownload={handleDownloadReport}
                  />
                ))}
              </div>

              {filteredReports?.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon name="Search" size={32} className="text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button
                    variant="outline"
                    iconName="Plus"
                    iconPosition="left"
                    onClick={() => setShowReportBuilder(true)}
                  >
                    Create New Report
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <ScheduledReports />
          )}

          {activeTab === 'incidents' && (
            <IncidentsDashboard />
          )}
        </div>
      </main>
      {/* Modals */}
      <ReportBuilder
        isOpen={showReportBuilder}
        onClose={() => setShowReportBuilder(false)}
        onGenerate={handleCreateCustomReport}
      />
      <ReportPreview
        report={selectedReport}
        isOpen={showReportPreview}
        onClose={() => setShowReportPreview(false)}
        onDownload={handleDownloadReport}
      />
    </div>
  );
};

export default ReportsDashboard;
