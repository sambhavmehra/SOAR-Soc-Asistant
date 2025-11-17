import React from 'react';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const AlertsFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  alertsCount,
  selectedCount 
}) => {
  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'malware', label: 'Malware Detection' },
    { value: 'intrusion', label: 'Intrusion Attempt' },
    { value: 'ddos', label: 'DDoS Attack' },
    { value: 'phishing', label: 'Phishing Attempt' },
    { value: 'data-breach', label: 'Data Breach' },
    { value: 'suspicious-activity', label: 'Suspicious Activity' },
    { value: 'policy-violation', label: 'Policy Violation' }
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'all', label: 'All Time' }
  ];

  const assigneeOptions = [
    { value: '', label: 'All Assignees' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'sarah-chen', label: 'Sarah Chen' },
    { value: 'mike-rodriguez', label: 'Mike Rodriguez' },
    { value: 'alex-kim', label: 'Alex Kim' },
    { value: 'emma-davis', label: 'Emma Davis' }
  ];

  const activeFiltersCount = Object.values(filters)?.filter(value => value && value !== '')?.length;

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1 p-6 space-y-4">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Select
          label="Severity"
          options={severityOptions}
          value={filters?.severity}
          onChange={(value) => onFilterChange('severity', value)}
          className="w-full"
        />

        <Select
          label="Type"
          options={typeOptions}
          value={filters?.type}
          onChange={(value) => onFilterChange('type', value)}
          className="w-full"
        />

        <Select
          label="Status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
          className="w-full"
        />

        <Select
          label="Time Range"
          options={timeRangeOptions}
          value={filters?.timeRange}
          onChange={(value) => onFilterChange('timeRange', value)}
          className="w-full"
        />

        <Select
          label="Assignee"
          options={assigneeOptions}
          value={filters?.assignee}
          onChange={(value) => onFilterChange('assignee', value)}
          className="w-full"
        />
      </div>
      {/* Filter Summary and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pt-4 border-t border-border">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{alertsCount}</span> alerts
            {selectedCount > 0 && (
              <span className="ml-2">
                (<span className="font-medium text-accent">{selectedCount}</span> selected)
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <Icon name="Filter" size={14} className="text-accent" />
              <span className="text-sm text-accent font-medium">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              iconName="X"
              iconSize={14}
            >
              Clear Filters
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconSize={14}
          >
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconSize={14}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {Object.entries(filters)?.map(([key, value]) => {
            if (!value || value === '') return null;
            
            const getFilterLabel = (filterKey, filterValue) => {
              switch (filterKey) {
                case 'severity':
                  return `Severity: ${filterValue}`;
                case 'type':
                  return `Type: ${typeOptions?.find(opt => opt?.value === filterValue)?.label || filterValue}`;
                case 'status':
                  return `Status: ${filterValue}`;
                case 'timeRange':
                  return `Time: ${timeRangeOptions?.find(opt => opt?.value === filterValue)?.label || filterValue}`;
                case 'assignee':
                  return filterValue === 'unassigned' ? 'Unassigned' : `Assignee: ${assigneeOptions?.find(opt => opt?.value === filterValue)?.label || filterValue}`;
                default:
                  return `${filterKey}: ${filterValue}`;
              }
            };

            return (
              <span
                key={key}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-full border border-accent/20"
              >
                <span>{getFilterLabel(key, value)}</span>
                <button
                  onClick={() => onFilterChange(key, '')}
                  className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                >
                  <Icon name="X" size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AlertsFilters;