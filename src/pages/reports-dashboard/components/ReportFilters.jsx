import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ReportFilters = ({ onFilterChange, onSearch }) => {
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    dateRange: 'all',
    format: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'security', label: 'Security Reports' },
    { value: 'compliance', label: 'Compliance Reports' },
    { value: 'incident', label: 'Incident Reports' },
    { value: 'vulnerability', label: 'Vulnerability Reports' },
    { value: 'threat_intel', label: 'Threat Intelligence' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'generating', label: 'Generating' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'failed', label: 'Failed' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' }
  ];

  const formatOptions = [
    { value: 'all', label: 'All Formats' },
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const clearFilters = () => {
    const defaultFilters = {
      category: 'all',
      status: 'all',
      dateRange: 'all',
      format: 'all'
    };
    setFilters(defaultFilters);
    setSearchQuery('');
    onFilterChange(defaultFilters);
    onSearch('');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Filter" size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Filter Reports</h2>
            <p className="text-sm text-muted-foreground">Refine your report search</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="RotateCcw"
          iconPosition="left"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </div>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Input
            type="search"
            placeholder="Search reports by title or description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e?.target?.value)}
            className="pl-10"
          />
          <Icon 
            name="Search" 
            size={18} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={filters?.category}
            onChange={(value) => handleFilterChange('category', value)}
          />

          <Select
            label="Status"
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => handleFilterChange('status', value)}
          />

          <Select
            label="Date Range"
            options={dateRangeOptions}
            value={filters?.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
          />

          <Select
            label="Format"
            options={formatOptions}
            value={filters?.format}
            onChange={(value) => handleFilterChange('format', value)}
          />
        </div>

        {/* Active Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters)?.map(([key, value]) => {
            if (value === 'all') return null;
            
            const getFilterLabel = (key, value) => {
              const optionMap = {
                category: categoryOptions,
                status: statusOptions,
                dateRange: dateRangeOptions,
                format: formatOptions
              };
              const option = optionMap?.[key]?.find(opt => opt?.value === value);
              return option ? option?.label : value;
            };

            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent text-sm rounded-full"
              >
                {getFilterLabel(key, value)}
                <button
                  onClick={() => handleFilterChange(key, 'all')}
                  className="ml-2 hover:text-accent-foreground"
                >
                  <Icon name="X" size={14} />
                </button>
              </span>
            );
          })}
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent text-sm rounded-full">
              Search: "{searchQuery}"
              <button
                onClick={() => handleSearch('')}
                className="ml-2 hover:text-accent-foreground"
              >
                <Icon name="X" size={14} />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;