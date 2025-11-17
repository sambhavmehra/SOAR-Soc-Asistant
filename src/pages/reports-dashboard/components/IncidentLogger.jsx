import React, { useState } from 'react';
import { useSecurityIncidents } from '../../../hooks/useSecurityIncidents';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const IncidentLogger = ({ isOpen, onClose }) => {
  const { addIncident, loading } = useSecurityIncidents();
  
  const [formData, setFormData] = useState({
    sourceIp: '',
    destinationIp: '',
    attackType: '',
    severity: 'Medium',
    status: 'Investigating',
    actionTaken: 'Alert Sent',
    additionalInfo: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastIncident, setLastIncident] = useState(null);

  const attackTypes = [
    'SQL Injection',
    'XSS Attack',
    'Brute Force',
    'DDoS Attack',
    'Malware',
    'Phishing',
    'Man-in-the-Middle',
    'Port Scanning',
    'Buffer Overflow',
    'Privilege Escalation',
    'Data Breach',
    'Ransomware',
    'Other'
  ];

  const severityLevels = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const statusOptions = [
    { value: 'Investigating', label: 'Investigating' },
    { value: 'Mitigated', label: 'Mitigated' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Escalated', label: 'Escalated' }
  ];

  const actionOptions = [
    'Alert Sent',
    'IP Blocked',
    'Account Disabled',
    'Firewall Rule Added',
    'Incident Escalated',
    'System Patched',
    'Password Reset Required',
    'Access Revoked',
    'Monitoring Increased',
    'Investigation Started'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!formData?.sourceIp?.trim() || !formData?.destinationIp?.trim()) {
      return;
    }

    const result = await addIncident({
      ...formData,
      additionalInfo: formData?.additionalInfo ? JSON.parse(formData?.additionalInfo || '{}') : {}
    });

    if (result?.success) {
      setLastIncident(result?.data);
      setShowSuccess(true);
      setFormData({
        sourceIp: '',
        destinationIp: '',
        attackType: '',
        severity: 'Medium',
        status: 'Investigating',
        actionTaken: 'Alert Sent',
        additionalInfo: ''
      });

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  const handleQuickFill = (scenario) => {
    const scenarios = {
      sqlInjection: {
        sourceIp: '203.0.113.45',
        destinationIp: '10.0.0.55',
        attackType: 'SQL Injection',
        severity: 'High',
        status: 'Investigating',
        actionTaken: 'IP Blocked'
      },
      bruteForce: {
        sourceIp: '198.51.100.23',
        destinationIp: '10.0.0.78',
        attackType: 'Brute Force',
        severity: 'Medium',
        status: 'Investigating',
        actionTaken: 'Account Disabled'
      },
      ddos: {
        sourceIp: '192.0.2.100',
        destinationIp: '10.0.0.10',
        attackType: 'DDoS Attack',
        severity: 'Critical',
        status: 'Mitigated',
        actionTaken: 'Firewall Rule Added'
      }
    };

    if (scenarios?.[scenario]) {
      setFormData(prev => ({
        ...prev,
        ...scenarios?.[scenario]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Log Security Incident</h2>
              <p className="text-sm text-muted-foreground">
                Record and analyze security events with AI
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Quick Fill Options */}
        <div className="p-6 border-b border-border bg-muted/20">
          <h3 className="text-sm font-medium text-foreground mb-3">Quick Fill Templates:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill('sqlInjection')}
            >
              SQL Injection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill('bruteForce')}
            >
              Brute Force
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill('ddos')}
            >
              DDoS Attack
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Source IP Address *
              </label>
              <Input
                type="text"
                placeholder="e.g., 203.0.113.45"
                value={formData?.sourceIp}
                onChange={(e) => handleInputChange('sourceIp', e?.target?.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Destination IP Address *
              </label>
              <Input
                type="text"
                placeholder="e.g., 10.0.0.55"
                value={formData?.destinationIp}
                onChange={(e) => handleInputChange('destinationIp', e?.target?.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Attack Type
              </label>
              <Select
                options={attackTypes?.map((type) => ({ value: type, label: type }))}
                value={formData?.attackType}
                onChange={(value) => handleInputChange('attackType', value)}
                placeholder="Select attack type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Severity Level
              </label>
              <Select
                options={severityLevels}
                value={formData?.severity}
                onChange={(value) => handleInputChange('severity', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Status
              </label>
              <Select
                options={statusOptions}
                value={formData?.status}
                onChange={(value) => handleInputChange('status', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Action Taken
              </label>
              <Select
                options={actionOptions?.map((action) => ({ value: action, label: action }))}
                value={formData?.actionTaken}
                onChange={(value) => handleInputChange('actionTaken', value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Information (JSON format)
            </label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder='{"port": 80, "protocol": "TCP", "payload_size": "1024"}'
              value={formData?.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e?.target?.value)}
            />
          </div>

          {/* Success Message */}
          {showSuccess && lastIncident && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="CheckCircle" size={20} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-success">
                    Incident logged successfully!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Event ID: {lastIncident?.eventId} | Stored in Google Sheets with AI analysis
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              * Required fields | AI analysis will be performed automatically
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading || !formData?.sourceIp?.trim() || !formData?.destinationIp?.trim()}
                iconName={loading ? "Loader2" : "Shield"}
                iconPosition="left"
              >
                {loading ? 'Analyzing...' : 'Log Incident'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentLogger;