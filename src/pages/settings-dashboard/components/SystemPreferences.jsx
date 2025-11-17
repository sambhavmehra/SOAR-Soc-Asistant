import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const SystemPreferences = () => {
  const [preferences, setPreferences] = useState({
    general: {
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      language: 'en',
      theme: 'dark'
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      desktopNotifications: true,
      slackIntegration: true,
      alertThreshold: 'medium',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00'
      }
    },
    security: {
      sessionTimeout: '8h',
      mfaRequired: true,
      passwordPolicy: 'strict',
      ipWhitelist: true,
      auditLogging: true,
      dataRetention: '90d'
    },
    performance: {
      autoRefresh: true,
      refreshInterval: '30s',
      maxAlerts: '1000',
      enableCaching: true,
      compressionEnabled: true,
      logLevel: 'info'
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'Europe/London', label: 'GMT' },
    { value: 'Europe/Berlin', label: 'CET' },
    { value: 'Asia/Tokyo', label: 'JST' }
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
  ];

  const timeFormats = [
    { value: '12h', label: '12 Hour (AM/PM)' },
    { value: '24h', label: '24 Hour' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' }
  ];

  const themes = [
    { value: 'dark', label: 'Dark Theme' },
    { value: 'light', label: 'Light Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  const alertThresholds = [
    { value: 'low', label: 'Low - All alerts' },
    { value: 'medium', label: 'Medium - Important alerts' },
    { value: 'high', label: 'High - Critical alerts only' }
  ];

  const sessionTimeouts = [
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '8h', label: '8 Hours' },
    { value: '24h', label: '24 Hours' }
  ];

  const passwordPolicies = [
    { value: 'basic', label: 'Basic - 8 characters minimum' },
    { value: 'standard', label: 'Standard - 12 characters, mixed case' },
    { value: 'strict', label: 'Strict - 16 characters, symbols required' }
  ];

  const dataRetentionOptions = [
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '180d', label: '180 Days' },
    { value: '1y', label: '1 Year' },
    { value: '2y', label: '2 Years' }
  ];

  const refreshIntervals = [
    { value: '10s', label: '10 Seconds' },
    { value: '30s', label: '30 Seconds' },
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' }
  ];

  const logLevels = [
    { value: 'debug', label: 'Debug' },
    { value: 'info', label: 'Info' },
    { value: 'warn', label: 'Warning' },
    { value: 'error', label: 'Error' }
  ];

  const updatePreference = (section, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedPreference = (section, parentKey, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [parentKey]: {
          ...prev?.[section]?.[parentKey],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
    }, 1500);
  };

  const handleReset = () => {
    // Reset to default values
    setPreferences({
      general: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        language: 'en',
        theme: 'dark'
      },
      notifications: {
        emailAlerts: true,
        smsAlerts: false,
        desktopNotifications: true,
        slackIntegration: true,
        alertThreshold: 'medium',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00'
        }
      },
      security: {
        sessionTimeout: '8h',
        mfaRequired: true,
        passwordPolicy: 'strict',
        ipWhitelist: true,
        auditLogging: true,
        dataRetention: '90d'
      },
      performance: {
        autoRefresh: true,
        refreshInterval: '30s',
        maxAlerts: '1000',
        enableCaching: true,
        compressionEnabled: true,
        logLevel: 'info'
      }
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">System Preferences</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        {hasChanges && (
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button 
              variant="default" 
              loading={saving}
              onClick={handleSave}
              iconName="Save"
              iconPosition="left"
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Settings" size={20} className="text-accent" />
            <h4 className="font-medium text-foreground">General Settings</h4>
          </div>
          
          <div className="space-y-4">
            <Select
              label="Timezone"
              options={timezones}
              value={preferences?.general?.timezone}
              onChange={(value) => updatePreference('general', 'timezone', value)}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Date Format"
                options={dateFormats}
                value={preferences?.general?.dateFormat}
                onChange={(value) => updatePreference('general', 'dateFormat', value)}
              />
              <Select
                label="Time Format"
                options={timeFormats}
                value={preferences?.general?.timeFormat}
                onChange={(value) => updatePreference('general', 'timeFormat', value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Language"
                options={languages}
                value={preferences?.general?.language}
                onChange={(value) => updatePreference('general', 'language', value)}
              />
              <Select
                label="Theme"
                options={themes}
                value={preferences?.general?.theme}
                onChange={(value) => updatePreference('general', 'theme', value)}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Bell" size={20} className="text-accent" />
            <h4 className="font-medium text-foreground">Notifications</h4>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Checkbox
                label="Email Alerts"
                checked={preferences?.notifications?.emailAlerts}
                onChange={(e) => updatePreference('notifications', 'emailAlerts', e?.target?.checked)}
              />
              <Checkbox
                label="SMS Alerts"
                checked={preferences?.notifications?.smsAlerts}
                onChange={(e) => updatePreference('notifications', 'smsAlerts', e?.target?.checked)}
              />
              <Checkbox
                label="Desktop Notifications"
                checked={preferences?.notifications?.desktopNotifications}
                onChange={(e) => updatePreference('notifications', 'desktopNotifications', e?.target?.checked)}
              />
              <Checkbox
                label="Slack Integration"
                checked={preferences?.notifications?.slackIntegration}
                onChange={(e) => updatePreference('notifications', 'slackIntegration', e?.target?.checked)}
              />
            </div>
            
            <Select
              label="Alert Threshold"
              options={alertThresholds}
              value={preferences?.notifications?.alertThreshold}
              onChange={(value) => updatePreference('notifications', 'alertThreshold', value)}
            />
            
            <div className="space-y-3">
              <Checkbox
                label="Enable Quiet Hours"
                checked={preferences?.notifications?.quietHours?.enabled}
                onChange={(e) => updateNestedPreference('notifications', 'quietHours', 'enabled', e?.target?.checked)}
              />
              {preferences?.notifications?.quietHours?.enabled && (
                <div className="grid grid-cols-2 gap-4 ml-6">
                  <Input
                    label="Start Time"
                    type="time"
                    value={preferences?.notifications?.quietHours?.start}
                    onChange={(e) => updateNestedPreference('notifications', 'quietHours', 'start', e?.target?.value)}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={preferences?.notifications?.quietHours?.end}
                    onChange={(e) => updateNestedPreference('notifications', 'quietHours', 'end', e?.target?.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Shield" size={20} className="text-accent" />
            <h4 className="font-medium text-foreground">Security</h4>
          </div>
          
          <div className="space-y-4">
            <Select
              label="Session Timeout"
              options={sessionTimeouts}
              value={preferences?.security?.sessionTimeout}
              onChange={(value) => updatePreference('security', 'sessionTimeout', value)}
            />
            
            <Select
              label="Password Policy"
              options={passwordPolicies}
              value={preferences?.security?.passwordPolicy}
              onChange={(value) => updatePreference('security', 'passwordPolicy', value)}
            />
            
            <Select
              label="Data Retention"
              options={dataRetentionOptions}
              value={preferences?.security?.dataRetention}
              onChange={(value) => updatePreference('security', 'dataRetention', value)}
            />
            
            <div className="space-y-3">
              <Checkbox
                label="Require Multi-Factor Authentication"
                checked={preferences?.security?.mfaRequired}
                onChange={(e) => updatePreference('security', 'mfaRequired', e?.target?.checked)}
              />
              <Checkbox
                label="IP Whitelist Enforcement"
                checked={preferences?.security?.ipWhitelist}
                onChange={(e) => updatePreference('security', 'ipWhitelist', e?.target?.checked)}
              />
              <Checkbox
                label="Audit Logging"
                checked={preferences?.security?.auditLogging}
                onChange={(e) => updatePreference('security', 'auditLogging', e?.target?.checked)}
              />
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Zap" size={20} className="text-accent" />
            <h4 className="font-medium text-foreground">Performance</h4>
          </div>
          
          <div className="space-y-4">
            <Select
              label="Auto Refresh Interval"
              options={refreshIntervals}
              value={preferences?.performance?.refreshInterval}
              onChange={(value) => updatePreference('performance', 'refreshInterval', value)}
              disabled={!preferences?.performance?.autoRefresh}
            />
            
            <Input
              label="Maximum Alerts Display"
              type="number"
              value={preferences?.performance?.maxAlerts}
              onChange={(e) => updatePreference('performance', 'maxAlerts', e?.target?.value)}
            />
            
            <Select
              label="Log Level"
              options={logLevels}
              value={preferences?.performance?.logLevel}
              onChange={(value) => updatePreference('performance', 'logLevel', value)}
            />
            
            <div className="space-y-3">
              <Checkbox
                label="Auto Refresh"
                checked={preferences?.performance?.autoRefresh}
                onChange={(e) => updatePreference('performance', 'autoRefresh', e?.target?.checked)}
              />
              <Checkbox
                label="Enable Caching"
                checked={preferences?.performance?.enableCaching}
                onChange={(e) => updatePreference('performance', 'enableCaching', e?.target?.checked)}
              />
              <Checkbox
                label="Data Compression"
                checked={preferences?.performance?.compressionEnabled}
                onChange={(e) => updatePreference('performance', 'compressionEnabled', e?.target?.checked)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* System Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Info" size={20} className="text-accent" />
          <h4 className="font-medium text-foreground">System Information</h4>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Application Version
            </p>
            <p className="text-sm text-foreground font-mono">v2.1.4</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Last Updated
            </p>
            <p className="text-sm text-foreground">September 10, 2025</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Database Version
            </p>
            <p className="text-sm text-foreground font-mono">PostgreSQL 15.3</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPreferences;