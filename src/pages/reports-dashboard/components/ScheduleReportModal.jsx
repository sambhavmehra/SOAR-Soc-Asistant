import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import backendService from '../../../services/backend';

const ScheduleReportModal = ({ isOpen, onClose, onScheduleCreated }) => {
  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    description: '',
    type: 'report',
    reportConfig: {
      title: '',
      dateRange: 'last_7_days',
      dataSources: [],
      metrics: [],
      format: 'pdf',
      includeCharts: true,
      includeExecutiveSummary: true
    },
    schedule: {
      type: 'cron',
      expression: '0 6 * * 1', // Default: Monday at 6 AM
      interval: 60, // minutes
      datetime: '' // for one-time
    },
    notifications: {
      enabled: false,
      telegram: false,
      email: false
    },
    recipients: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const scheduleTypeOptions = [
    { value: 'cron', label: 'Cron Expression' },
    { value: 'interval', label: 'Interval' },
    { value: 'once', label: 'One-time' }
  ];

  const intervalOptions = [
    { value: 15, label: 'Every 15 minutes' },
    { value: 30, label: 'Every 30 minutes' },
    { value: 60, label: 'Every hour' },
    { value: 360, label: 'Every 6 hours' },
    { value: 720, label: 'Every 12 hours' },
    { value: 1440, label: 'Every day' },
    { value: 10080, label: 'Every week' }
  ];

  const cronExamples = [
    { value: '0 6 * * 1', label: 'Weekly (Monday 6 AM)' },
    { value: '0 9 * * 1-5', label: 'Daily (Weekdays 9 AM)' },
    { value: '0 */4 * * *', label: 'Every 4 hours' },
    { value: '0 0 * * *', label: 'Daily (Midnight)' },
    { value: '0 0 1 * *', label: 'Monthly (1st of month)' }
  ];

  const handleSchedule = async () => {
    if (!scheduleConfig.name || !scheduleConfig.reportConfig.title) {
      setError('Please provide a schedule name and report title');
      return;
    }

    if (scheduleConfig.schedule.type === 'cron' && !scheduleConfig.schedule.expression) {
      setError('Please provide a cron expression');
      return;
    }

    if (scheduleConfig.schedule.type === 'once' && !scheduleConfig.schedule.datetime) {
      setError('Please provide a date and time for one-time execution');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const taskData = {
        name: scheduleConfig.name,
        type: scheduleConfig.type,
        description: scheduleConfig.description,
        schedule: scheduleConfig.schedule,
        config: scheduleConfig.reportConfig,
        notifications: scheduleConfig.notifications,
        recipients: scheduleConfig.recipients
      };

      const result = await backendService.createScheduledTask(taskData);

      if (result.success) {
        onScheduleCreated && onScheduleCreated(result.task);
        onClose();
        // Reset form
        setScheduleConfig({
          name: '',
          description: '',
          type: 'report',
          reportConfig: {
            title: '',
            dateRange: 'last_7_days',
            dataSources: [],
            metrics: [],
            format: 'pdf',
            includeCharts: true,
            includeExecutiveSummary: true
          },
          schedule: {
            type: 'cron',
            expression: '0 6 * * 1',
            interval: 60,
            datetime: ''
          },
          notifications: {
            enabled: false,
            telegram: false,
            email: false
          },
          recipients: []
        });
      } else {
        setError(result.error || 'Failed to create scheduled task');
      }
    } catch (err) {
      console.error('Error creating scheduled task:', err);
      setError('Failed to create scheduled task');
    } finally {
      setLoading(false);
    }
  };

  const handleCronExampleSelect = (expression) => {
    setScheduleConfig(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        expression
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Calendar" size={20} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Schedule Report</h2>
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
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={16} className="text-error" />
                <span className="text-error text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Schedule Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Schedule Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Schedule Name"
                type="text"
                placeholder="e.g., Weekly Security Report"
                value={scheduleConfig.name}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Input
                label="Description (Optional)"
                type="text"
                placeholder="Brief description of this scheduled report"
                value={scheduleConfig.description}
                onChange={(e) => setScheduleConfig(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          {/* Report Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Report Configuration</h3>

            <Input
              label="Report Title"
              type="text"
              placeholder="Enter report title"
              value={scheduleConfig.reportConfig.title}
              onChange={(e) => setScheduleConfig(prev => ({
                ...prev,
                reportConfig: { ...prev.reportConfig, title: e.target.value }
              }))}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Date Range"
                options={dateRangeOptions}
                value={scheduleConfig.reportConfig.dateRange}
                onChange={(value) => setScheduleConfig(prev => ({
                  ...prev,
                  reportConfig: { ...prev.reportConfig, dateRange: value }
                }))}
              />

              <Select
                label="Output Format"
                options={formatOptions}
                value={scheduleConfig.reportConfig.format}
                onChange={(value) => setScheduleConfig(prev => ({
                  ...prev,
                  reportConfig: { ...prev.reportConfig, format: value }
                }))}
              />
            </div>

            <Select
              label="Data Sources"
              description="Select the security tools to include in the report"
              options={dataSourceOptions}
              value={scheduleConfig.reportConfig.dataSources}
              onChange={(value) => setScheduleConfig(prev => ({
                ...prev,
                reportConfig: { ...prev.reportConfig, dataSources: value }
              }))}
              multiple
              searchable
            />

            <Select
              label="Metrics to Include"
              description="Choose the security metrics to analyze"
              options={metricsOptions}
              value={scheduleConfig.reportConfig.metrics}
              onChange={(value) => setScheduleConfig(prev => ({
                ...prev,
                reportConfig: { ...prev.reportConfig, metrics: value }
              }))}
              multiple
              searchable
            />

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Report Options</h4>
              <div className="space-y-3">
                <Checkbox
                  label="Include Charts and Visualizations"
                  description="Add graphs and charts to the report"
                  checked={scheduleConfig.reportConfig.includeCharts}
                  onChange={(e) => setScheduleConfig(prev => ({
                    ...prev,
                    reportConfig: { ...prev.reportConfig, includeCharts: e.target.checked }
                  }))}
                />
                <Checkbox
                  label="Include Executive Summary"
                  description="Add a high-level summary for management"
                  checked={scheduleConfig.reportConfig.includeExecutiveSummary}
                  onChange={(e) => setScheduleConfig(prev => ({
                    ...prev,
                    reportConfig: { ...prev.reportConfig, includeExecutiveSummary: e.target.checked }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Schedule Configuration</h3>

            <Select
              label="Schedule Type"
              options={scheduleTypeOptions}
              value={scheduleConfig.schedule.type}
              onChange={(value) => setScheduleConfig(prev => ({
                ...prev,
                schedule: { ...prev.schedule, type: value }
              }))}
            />

            {scheduleConfig.schedule.type === 'cron' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cron Expression"
                    type="text"
                    placeholder="0 6 * * 1"
                    value={scheduleConfig.schedule.expression}
                    onChange={(e) => setScheduleConfig(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, expression: e.target.value }
                    }))}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Common Examples</label>
                    <Select
                      options={cronExamples}
                      value=""
                      onChange={handleCronExampleSelect}
                      placeholder="Select an example"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cron format: minute hour day month day-of-week<br />
                  Example: "0 6 * * 1" = Every Monday at 6:00 AM
                </p>
              </div>
            )}

            {scheduleConfig.schedule.type === 'interval' && (
              <Select
                label="Interval"
                options={intervalOptions}
                value={scheduleConfig.schedule.interval}
                onChange={(value) => setScheduleConfig(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, interval: value }
                }))}
              />
            )}

            {scheduleConfig.schedule.type === 'once' && (
              <Input
                label="Execution Date & Time"
                type="datetime-local"
                value={scheduleConfig.schedule.datetime}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, datetime: e.target.value }
                }))}
                required
              />
            )}
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Notifications</h3>

            <Checkbox
              label="Enable Notifications"
              description="Send notifications when the report is generated"
              checked={scheduleConfig.notifications.enabled}
              onChange={(e) => setScheduleConfig(prev => ({
                ...prev,
                notifications: { ...prev.notifications, enabled: e.target.checked }
              }))}
            />

            {scheduleConfig.notifications.enabled && (
              <div className="ml-6 space-y-3">
                <Checkbox
                  label="Telegram Notifications"
                  description="Send notifications via Telegram bot"
                  checked={scheduleConfig.notifications.telegram}
                  onChange={(e) => setScheduleConfig(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, telegram: e.target.checked }
                  }))}
                />
                <Checkbox
                  label="Email Notifications"
                  description="Send notifications via email"
                  checked={scheduleConfig.notifications.email}
                  onChange={(e) => setScheduleConfig(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            iconName="Calendar"
            iconPosition="left"
            onClick={handleSchedule}
            disabled={loading || !scheduleConfig.name || !scheduleConfig.reportConfig.title}
          >
            {loading ? 'Creating Schedule...' : 'Create Schedule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReportModal;
