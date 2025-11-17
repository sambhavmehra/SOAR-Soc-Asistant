import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const TrafficFilters = ({ onFiltersChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    timeRange: '24h',
    protocol: 'all',
    status: 'all',
    riskLevel: 'all',
    sourceCountry: 'all',
    portRange: '',
    ipRange: ''
  });

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '6h', label: 'Last 6 Hours' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const protocolOptions = [
    { value: 'all', label: 'All Protocols' },
    { value: 'tcp', label: 'TCP' },
    { value: 'udp', label: 'UDP' },
    { value: 'icmp', label: 'ICMP' },
    { value: 'http', label: 'HTTP' },
    { value: 'https', label: 'HTTPS' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'allowed', label: 'Allowed' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'suspicious', label: 'Suspicious' }
  ];

  const riskLevelOptions = [
    { value: 'all', label: 'All Risk Levels' },
    { value: 'low', label: 'Low (0-30)' },
    { value: 'medium', label: 'Medium (31-60)' },
    { value: 'high', label: 'High (61-80)' },
    { value: 'critical', label: 'Critical (81-100)' }
  ];

  const countryOptions = [
    { value: 'all', label: 'All Countries' },
    { value: 'us', label: 'United States' },
    { value: 'cn', label: 'China' },
    { value: 'ru', label: 'Russia' },
    { value: 'de', label: 'Germany' },
    { value: 'br', label: 'Brazil' },
    { value: 'in', label: 'India' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      timeRange: '24h',
      protocol: 'all',
      status: 'all',
      riskLevel: 'all',
      sourceCountry: 'all',
      portRange: '',
      ipRange: ''
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters)?.filter(([key, value]) => {
      if (key === 'timeRange') return value !== '24h';
      if (typeof value === 'string') return value !== 'all' && value !== '';
      return false;
    })?.length;
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-1 mb-6">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Filter" size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Traffic Filters</h3>
              <p className="text-sm text-muted-foreground">
                Filter network traffic by time, protocol, status, and risk level
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-accent font-medium">
                  {getActiveFiltersCount()} active
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  iconName="X"
                  iconPosition="left"
                >
                  Clear
                </Button>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
              iconPosition="right"
            >
              {isExpanded ? 'Less' : 'More'} Filters
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4">
        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Time Range</label>
            <select
              value={filters?.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e?.target?.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {timeRangeOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Protocol */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Protocol</label>
            <select
              value={filters?.protocol}
              onChange={(e) => handleFilterChange('protocol', e?.target?.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {protocolOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={filters?.status}
              onChange={(e) => handleFilterChange('status', e?.target?.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {statusOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Risk Level</label>
            <select
              value={filters?.riskLevel}
              onChange={(e) => handleFilterChange('riskLevel', e?.target?.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {riskLevelOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="border-t border-border pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Source Country */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Source Country</label>
                <select
                  value={filters?.sourceCountry}
                  onChange={(e) => handleFilterChange('sourceCountry', e?.target?.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  {countryOptions?.map(option => (
                    <option key={option?.value} value={option?.value}>
                      {option?.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Port Range */}
              <div>
                <Input
                  label="Port Range"
                  type="text"
                  placeholder="e.g., 80,443 or 1000-2000"
                  value={filters?.portRange}
                  onChange={(e) => handleFilterChange('portRange', e?.target?.value)}
                  description="Comma-separated ports or ranges"
                />
              </div>

              {/* IP Range */}
              <div>
                <Input
                  label="IP Range"
                  type="text"
                  placeholder="e.g., 192.168.1.0/24"
                  value={filters?.ipRange}
                  onChange={(e) => handleFilterChange('ipRange', e?.target?.value)}
                  description="CIDR notation or specific IPs"
                />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground mr-2">Quick Filters:</span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('status', 'blocked');
                  handleFilterChange('riskLevel', 'high');
                }}
                iconName="Shield"
                iconPosition="left"
              >
                High Risk Blocked
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('protocol', 'tcp');
                  handleFilterChange('portRange', '22,3389');
                }}
                iconName="Terminal"
                iconPosition="left"
              >
                Remote Access
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('status', 'suspicious');
                  handleFilterChange('timeRange', '1h');
                }}
                iconName="AlertTriangle"
                iconPosition="left"
              >
                Recent Suspicious
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange('sourceCountry', 'cn');
                  handleFilterChange('status', 'blocked');
                }}
                iconName="Globe"
                iconPosition="left"
              >
                Blocked Foreign
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficFilters;