import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const AutomationRules = () => {
  const [rules, setRules] = useState([
    {
      id: 'rule-1',
      name: 'High Severity Alert Response',
      description: 'Automatically isolate endpoints and block IPs for critical threats',
      isEnabled: true,
      trigger: {
        type: 'alert_severity',
        condition: 'equals',
        value: 'critical'
      },
      actions: [
        { type: 'isolate_endpoint', enabled: true },
        { type: 'block_ip', enabled: true },
        { type: 'notify_team', enabled: true }
      ],
      lastTriggered: '2025-09-15T13:45:00Z',
      triggerCount: 23
    },
    {
      id: 'rule-2',
      name: 'Malware Detection Response',
      description: 'Quarantine files and update threat intelligence on malware detection',
      isEnabled: true,
      trigger: {
        type: 'malware_detected',
        condition: 'contains',
        value: 'trojan|virus|ransomware'
      },
      actions: [
        { type: 'quarantine_file', enabled: true },
        { type: 'update_threat_intel', enabled: true },
        { type: 'create_incident', enabled: true }
      ],
      lastTriggered: '2025-09-15T12:20:00Z',
      triggerCount: 8
    },
    {
      id: 'rule-3',
      name: 'Failed Login Attempts',
      description: 'Lock account and notify admin after multiple failed login attempts',
      isEnabled: false,
      trigger: {
        type: 'failed_logins',
        condition: 'greater_than',
        value: '5'
      },
      actions: [
        { type: 'lock_account', enabled: true },
        { type: 'notify_admin', enabled: true },
        { type: 'log_incident', enabled: false }
      ],
      lastTriggered: '2025-09-14T16:30:00Z',
      triggerCount: 156
    }
  ]);

  const [selectedRule, setSelectedRule] = useState(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const triggerTypes = [
    { value: 'alert_severity', label: 'Alert Severity' },
    { value: 'malware_detected', label: 'Malware Detection' },
    { value: 'failed_logins', label: 'Failed Login Attempts' },
    { value: 'suspicious_traffic', label: 'Suspicious Traffic' },
    { value: 'vulnerability_scan', label: 'Vulnerability Detected' },
    { value: 'data_exfiltration', label: 'Data Exfiltration' }
  ];

  const conditionTypes = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'matches_regex', label: 'Matches Regex' }
  ];

  const actionTypes = [
    { value: 'isolate_endpoint', label: 'Isolate Endpoint' },
    { value: 'block_ip', label: 'Block IP Address' },
    { value: 'quarantine_file', label: 'Quarantine File' },
    { value: 'notify_team', label: 'Notify SOC Team' },
    { value: 'notify_admin', label: 'Notify Administrator' },
    { value: 'create_incident', label: 'Create Incident' },
    { value: 'update_threat_intel', label: 'Update Threat Intelligence' },
    { value: 'lock_account', label: 'Lock User Account' },
    { value: 'log_incident', label: 'Log Security Event' }
  ];

  const handleToggleRule = async (ruleId) => {
    let toggledRule = null;
    setRules(prev => prev?.map(rule => {
      if (rule?.id === ruleId) {
        toggledRule = { ...rule, isEnabled: !rule?.isEnabled };
        return toggledRule;
      }
      return rule;
    }));
    try {
      if (toggledRule) {
        await triggerN8n({
          event: 'automation_rule_toggled',
          ruleId: toggledRule?.id,
          isEnabled: toggledRule?.isEnabled,
          rule: toggledRule,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setIsCreatingRule(true);
  };

  const handleCreateNewRule = () => {
    setSelectedRule({
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      isEnabled: true,
      trigger: {
        type: '',
        condition: 'equals',
        value: ''
      },
      actions: [],
      lastTriggered: null,
      triggerCount: 0
    });
    setIsCreatingRule(true);
  };

  const handleSaveRule = async () => {
    const ruleToSave = selectedRule;
    if (ruleToSave) {
      if (rules?.find(r => r?.id === ruleToSave?.id)) {
        setRules(prev => prev?.map(rule => 
          rule?.id === ruleToSave?.id ? ruleToSave : rule
        ));
      } else {
        setRules(prev => [...prev, ruleToSave]);
      }
      try {
        await triggerN8n({
          event: 'automation_rule_saved',
          ruleId: ruleToSave?.id,
          rule: ruleToSave,
        });
      } catch (e) {
        console.error(e);
      }
    }
    setIsCreatingRule(false);
    setSelectedRule(null);
  };

  const formatLastTriggered = (timestamp) => {
    if (!timestamp) return 'Never';
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
          <h3 className="text-lg font-semibold text-foreground">Automation Rules</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated responses to security events
          </p>
        </div>
        <Button 
          variant="default" 
          iconName="Plus" 
          iconPosition="left"
          onClick={handleCreateNewRule}
        >
          Create Rule
        </Button>
      </div>
      {/* Rules List */}
      <div className="space-y-4">
        {rules?.map((rule) => (
          <div key={rule?.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  rule?.isEnabled ? 'bg-success/10' : 'bg-muted/30'
                }`}>
                  <Icon 
                    name={rule?.isEnabled ? 'Zap' : 'ZapOff'} 
                    size={24} 
                    className={rule?.isEnabled ? 'text-success' : 'text-muted-foreground'}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-foreground">{rule?.name}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      rule?.isEnabled 
                        ? 'bg-success/10 text-success' :'bg-muted text-muted-foreground'
                    }`}>
                      {rule?.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule?.description}
                  </p>
                  
                  <div className="mt-3 flex items-center space-x-6 text-xs text-muted-foreground">
                    <span>Last triggered: {formatLastTriggered(rule?.lastTriggered)}</span>
                    <span>Triggered {rule?.triggerCount} times</span>
                    <span>{rule?.actions?.filter(a => a?.enabled)?.length} actions enabled</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={rule?.isEnabled ? "outline" : "default"}
                  size="sm"
                  iconName={rule?.isEnabled ? "Pause" : "Play"}
                  onClick={() => handleToggleRule(rule?.id)}
                >
                  {rule?.isEnabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Edit"
                  onClick={() => handleEditRule(rule)}
                >
                  Edit
                </Button>
              </div>
            </div>

            {/* Rule Details */}
            <div className="mt-4 p-4 bg-muted/20 rounded border">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Trigger Condition
                  </p>
                  <p className="text-sm text-foreground">
                    When <span className="font-mono bg-muted px-1 rounded">{rule?.trigger?.type}</span> {' '}
                    <span className="font-mono bg-muted px-1 rounded">{rule?.trigger?.condition}</span> {' '}
                    <span className="font-mono bg-muted px-1 rounded">"{rule?.trigger?.value}"</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Automated Actions
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rule?.actions?.filter(action => action?.enabled)?.map((action, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-accent/10 text-accent rounded">
                        {actionTypes?.find(a => a?.value === action?.type)?.label || action?.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Rule Creation/Edit Modal */}
      {isCreatingRule && selectedRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedRule?.name ? 'Edit Automation Rule' : 'Create New Rule'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                iconName="X"
                onClick={() => {
                  setIsCreatingRule(false);
                  setSelectedRule(null);
                }}
              />
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Basic Information</h4>
                <Input
                  label="Rule Name"
                  placeholder="Enter rule name"
                  value={selectedRule?.name}
                  onChange={(e) => setSelectedRule(prev => ({
                    ...prev,
                    name: e?.target?.value
                  }))}
                />
                <Input
                  label="Description"
                  placeholder="Describe what this rule does"
                  value={selectedRule?.description}
                  onChange={(e) => setSelectedRule(prev => ({
                    ...prev,
                    description: e?.target?.value
                  }))}
                />
              </div>

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Trigger Condition</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <Select
                    label="Trigger Type"
                    options={triggerTypes}
                    value={selectedRule?.trigger?.type}
                    onChange={(value) => setSelectedRule(prev => ({
                      ...prev,
                      trigger: { ...prev?.trigger, type: value }
                    }))}
                  />
                  <Select
                    label="Condition"
                    options={conditionTypes}
                    value={selectedRule?.trigger?.condition}
                    onChange={(value) => setSelectedRule(prev => ({
                      ...prev,
                      trigger: { ...prev?.trigger, condition: value }
                    }))}
                  />
                  <Input
                    label="Value"
                    placeholder="Enter trigger value"
                    value={selectedRule?.trigger?.value}
                    onChange={(e) => setSelectedRule(prev => ({
                      ...prev,
                      trigger: { ...prev?.trigger, value: e?.target?.value }
                    }))}
                  />
                </div>
              </div>

              {/* Actions Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground">Automated Actions</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {actionTypes?.map((actionType) => {
                    const isEnabled = selectedRule?.actions?.some(a => a?.type === actionType?.value && a?.enabled);
                    return (
                      <Checkbox
                        key={actionType?.value}
                        label={actionType?.label}
                        checked={isEnabled}
                        onChange={(e) => {
                          const checked = e?.target?.checked;
                          setSelectedRule(prev => ({
                            ...prev,
                            actions: checked
                              ? [...prev?.actions?.filter(a => a?.type !== actionType?.value), { type: actionType?.value, enabled: true }]
                              : prev?.actions?.filter(a => a?.type !== actionType?.value)
                          }));
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingRule(false);
                  setSelectedRule(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveRule}
                iconName="Save"
                iconPosition="left"
                disabled={!selectedRule?.name || !selectedRule?.trigger?.type}
              >
                Save Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationRules;