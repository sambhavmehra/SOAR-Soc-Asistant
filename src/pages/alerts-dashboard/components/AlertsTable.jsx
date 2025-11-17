import React, { useState, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlertsTable = ({ alerts, onAlertAction, selectedAlerts, onSelectAlert, onSelectAll }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  const sortedAlerts = useMemo(() => {
    if (!sortConfig?.key) return alerts;

    return [...alerts]?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (sortConfig?.key === 'timestamp') {
        aValue = new Date(aValue)?.getTime();
        bValue = new Date(bValue)?.getTime();
      }

      if (aValue < bValue) {
        return sortConfig?.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig?.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [alerts, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-error bg-error/10 border-error/20';
      case 'high': return 'text-warning bg-warning/10 border-warning/20';
      case 'medium': return 'text-accent bg-accent/10 border-accent/20';
      case 'low': return 'text-success bg-success/10 border-success/20';
      default: return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'text-error bg-error/10';
      case 'investigating': return 'text-warning bg-warning/10';
      case 'resolved': return 'text-success bg-success/10';
      case 'closed': return 'text-muted-foreground bg-muted/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const SortButton = ({ column, children }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>{children}</span>
      <Icon 
        name={sortConfig?.key === column 
          ? (sortConfig?.direction === 'asc' ? 'ChevronUp' : 'ChevronDown')
          : 'ChevronsUpDown'
        } 
        size={14} 
      />
    </button>
  );

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1 overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedAlerts?.length === alerts?.length && alerts?.length > 0}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                  className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="eventId">Event ID</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="severity">Severity</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="type">Type</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="timestamp">Time</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="sourceIp">Source IP</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="destinationIp">Destination IP</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="affectedSystem">Affected System</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="status">Status</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="actionTaken">Action Taken</SortButton>
              </th>
              <th className="px-4 py-3 text-left">
                <SortButton column="assignedTo">Assigned To</SortButton>
              </th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedAlerts?.map((alert) => (
              <tr key={alert?.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedAlerts?.includes(alert?.id)}
                    onChange={(e) => onSelectAlert(alert?.id, e?.target?.checked)}
                    className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{alert?.eventId}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert?.severity)}`}>
                    {alert?.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon name={alert?.icon} size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{alert?.type}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-muted-foreground">{formatTimestamp(alert?.timestamp)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{alert?.sourceIp}</td>
                <td className="px-4 py-3 text-sm text-foreground">{alert?.destinationIp}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{alert?.affectedSystem}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert?.status)}`}>
                    {alert?.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{alert?.actionTaken}</td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{alert?.assignedTo || 'Unassigned'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAlertAction('analyze', alert?.id)}
                      iconName="Brain"
                      iconSize={14}
                      className="h-8 w-8"
                      title="Analyze with AI Agent"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAlertAction('acknowledge', alert?.id)}
                      iconName="Check"
                      iconSize={14}
                      className="h-8 w-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAlertAction('assign', alert?.id)}
                      iconName="User"
                      iconSize={14}
                      className="h-8 w-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAlertAction('escalate', alert?.id)}
                      iconName="AlertTriangle"
                      iconSize={14}
                      className="h-8 w-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAlertAction('investigate', alert?.id)}
                      iconName="Search"
                      iconSize={14}
                      className="h-8 w-8"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 p-4">
        {sortedAlerts?.map((alert) => (
          <div key={alert?.id} className="bg-background rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedAlerts?.includes(alert?.id)}
                  onChange={(e) => onSelectAlert(alert?.id, e?.target?.checked)}
                  className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent focus:ring-2"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name={alert?.icon} size={16} className="text-muted-foreground" />
                    <span className="font-medium text-foreground">{alert?.type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTimestamp(alert?.timestamp)}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert?.severity)}`}>
                {alert?.severity}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">System:</span>
                <span className="text-sm text-foreground">{alert?.affectedSystem}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert?.status)}`}>
                  {alert?.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Assigned:</span>
                <span className="text-sm text-foreground">{alert?.assignedTo || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlertAction('acknowledge', alert?.id)}
                iconName="Check"
                iconSize={14}
                className="flex-1"
              >
                Ack
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlertAction('assign', alert?.id)}
                iconName="User"
                iconSize={14}
                className="flex-1"
              >
                Assign
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlertAction('escalate', alert?.id)}
                iconName="AlertTriangle"
                iconSize={14}
                className="flex-1"
              >
                Escalate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlertAction('investigate', alert?.id)}
                iconName="Search"
                iconSize={14}
                className="flex-1"
              >
                Investigate
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Empty State */}
      {alerts?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="AlertTriangle" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No alerts found</h3>
          <p className="text-muted-foreground">No security alerts match your current filters.</p>
        </div>
      )}
    </div>
  );
};

export default AlertsTable;