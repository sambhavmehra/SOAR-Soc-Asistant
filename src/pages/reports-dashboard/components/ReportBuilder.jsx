import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const ReportBuilder = ({ isOpen, onClose, onGenerate }) => {
  const [reportConfig, setReportConfig] = useState({
    title: '',
    dateRange: 'last_7_days',
    dataSources: [],
    metrics: [],
    format: 'pdf',
    includeCharts: true,
    includeExecutiveSummary: true
  });

  const dateRangeOptions = [
    { value: 'last_24_hours', label: 'Last 24 Hours' },
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const dataSourceOptions = [
    { value: 'siem', label: 'SIEM Logs' },
    { value: 'firewall', label: 'Firewall Events' },
    { value: 'ids_ips', label: 'IDS/IPS Alerts' },
    { value: 'edr', label: 'EDR Telemetry' },
    { value: 'vulnerability', label: 'Vulnerability Scans' },
    { value: 'threat_intel', label: 'Threat Intelligence' }
  ];

  const metricsOptions = [
    { value: 'security_incidents', label: 'Security Incidents' },
    { value: 'blocked_threats', label: 'Blocked Threats' },
    { value: 'vulnerability_count', label: 'Vulnerability Count' },
    { value: 'response_times', label: 'Response Times' },
    { value: 'false_positives', label: 'False Positives' },
    { value: 'compliance_status', label: 'Compliance Status' }
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'excel', label: 'Excel Spreadsheet' },
    { value: 'csv', label: 'CSV Data' },
    { value: 'json', label: 'JSON Export' }
  ];

  const handleGenerate = () => {
    onGenerate(reportConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="FileText" size={20} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Custom Report Builder</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        <div className="p-6 space-y-6">
          <Input
            label="Report Title"
            type="text"
            placeholder="Enter report title"
            value={reportConfig?.title}
            onChange={(e) => setReportConfig(prev => ({ ...prev, title: e?.target?.value }))}
            required
          />

          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={reportConfig?.dateRange}
            onChange={(value) => setReportConfig(prev => ({ ...prev, dateRange: value }))}
          />

          <Select
            label="Data Sources"
            description="Select the security tools to include in the report"
            options={dataSourceOptions}
            value={reportConfig?.dataSources}
            onChange={(value) => setReportConfig(prev => ({ ...prev, dataSources: value }))}
            multiple
            searchable
          />

          <Select
            label="Metrics to Include"
            description="Choose the security metrics to analyze"
            options={metricsOptions}
            value={reportConfig?.metrics}
            onChange={(value) => setReportConfig(prev => ({ ...prev, metrics: value }))}
            multiple
            searchable
          />

          <Select
            label="Output Format"
            options={formatOptions}
            value={reportConfig?.format}
            onChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
          />

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Report Options</h3>
            <div className="space-y-3">
              <Checkbox
                label="Include Charts and Visualizations"
                description="Add graphs and charts to the report"
                checked={reportConfig?.includeCharts}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeCharts: e?.target?.checked }))}
              />
              <Checkbox
                label="Include Executive Summary"
                description="Add a high-level summary for management"
                checked={reportConfig?.includeExecutiveSummary}
                onChange={(e) => setReportConfig(prev => ({ ...prev, includeExecutiveSummary: e?.target?.checked }))}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Play"
            iconPosition="left"
            onClick={handleGenerate}
            disabled={!reportConfig?.title || reportConfig?.dataSources?.length === 0}
          >
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;