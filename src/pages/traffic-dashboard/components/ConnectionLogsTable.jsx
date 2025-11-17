import React, { useMemo, useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import backendService from '../../../services/backend';

const ConnectionLogsTable = ({ incidents, loading, updateIncidentStatus, generateAIReport }) => {
  const [idsLogs, setIdsLogs] = useState([]);
  const [idsLoading, setIdsLoading] = useState(false);

  // Fetch IDS logs on component mount and periodically
  useEffect(() => {
    const fetchIDSLogs = async () => {
      try {
        setIdsLoading(true);
        const result = await backendService.getIDSLogs(100); // Get last 100 logs
        if (result.success && result.data) {
          setIdsLogs(result.data);
        }
      } catch (error) {
        console.error('Error fetching IDS logs:', error);
      } finally {
        setIdsLoading(false);
      }
    };

    fetchIDSLogs(); // Initial fetch

    // Refresh logs every 30 seconds
    const interval = setInterval(fetchIDSLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const logs = useMemo(() => {
    // Use IDS logs if available, otherwise fall back to incidents
    if (idsLogs.length > 0) {
      return idsLogs.map((log, idx) => ({
        id: `IDS-${Date.now()}-${idx}`,
        eventId: log.timestamp || `IDS-${idx}`,
        timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
        sourceIp: log.source_ip || 'Unknown',
        destinationIp: log.destination_ip || 'Unknown',
        protocol: log.protocol || 'N/A',
        attackType: log.detection || 'Normal Traffic',
        severity: log.alert_level === 'alert' ? 'High' : log.alert_level === 'warning' ? 'Medium' : 'Low',
        status: log.alert_level === 'alert' ? 'Blocked' : log.alert_level === 'warning' ? 'Suspicious' : 'Allowed',
        riskScore: log.ml_prediction === 1 ? 80 : log.http_traffic ? 60 : 20,
        actionTaken: log.alert_level === 'alert' ? 'Blocked' : 'Allowed',
        packetSize: log.packet_size || 0,
        frequency: log.frequency || 0,
        httpTraffic: log.http_traffic || false,
        mlPrediction: log.ml_prediction || 0
      }));
    }

    // Fallback to incidents format
    const scoreFromSeverity = (sev) => {
      const s = (sev || '').toLowerCase();
      if (s === 'critical') return 90;
      if (s === 'high') return 70;
      if (s === 'medium') return 50;
      if (s === 'low') return 20;
      return 40;
    };
    return (incidents || []).map((i, idx) => {
      // Generate a unique eventId if not present
      const eventId = i?.eventid || `INC-${Date.now()}-${idx}`;
      return {
        id: eventId, // Use eventId as the unique identifier
        eventId: eventId,
        timestamp: i?.timestamp ? new Date(i?.timestamp) : new Date(),
        sourceIp: i?.sourceip || 'Unknown',
        destinationIp: i?.destinationip || 'Unknown',
        protocol: i?.protocol || 'N/A',
        attackType: i?.attacktype || 'Unknown',
        severity: i?.severity || 'Medium',
        status: i?.status || 'Unknown',
        riskScore: scoreFromSeverity(i?.severity),
        actionTaken: i?.actiontaken || '—',
      };
    });
  }, [idsLogs, incidents]);
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows(prev => 
      prev?.includes(id) 
        ? prev?.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageLogs = filteredAndSortedLogs?.slice(
      (currentPage - 1) * logsPerPage,
      currentPage * logsPerPage
    );
    
    if (selectedRows?.length === currentPageLogs?.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentPageLogs?.map(log => log?.id));
    }
  };

  const filteredAndSortedLogs = logs?.filter(log => 
      (log?.sourceIp || '')?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      (log?.destinationIp || '')?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      (log?.protocol || '')?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      (log?.status || '')?.toLowerCase()?.includes(searchTerm?.toLowerCase())
    )?.sort((a, b) => {
      let aValue = a?.[sortField];
      let bValue = b?.[sortField];
      
      if (sortField === 'timestamp') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredAndSortedLogs?.length / logsPerPage);
  const currentLogs = filteredAndSortedLogs?.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const handleExport = () => {
    const rows = [
      ['Time Stamp','Source IP','Destination IP','Protocol','Status','Risk Score','Action Taken'],
      ...filteredAndSortedLogs.map(l => [
        l?.timestamp instanceof Date ? l?.timestamp?.toISOString() : String(l?.timestamp || ''),
        l?.sourceIp || '',
        l?.destinationIp || '',
        l?.protocol || '',
        l?.status || '',
        String(l?.riskScore ?? ''),
        l?.actionTaken || ''
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connection_logs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'allowed':
      case 'mitigated':
      case 'resolved':
        return 'text-success';
      case 'blocked':
      case 'open':
      case 'escalated':
        return 'text-error';
      case 'suspicious':
      case 'investigating':
        return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'allowed':
      case 'mitigated':
      case 'resolved':
        return 'bg-success/10';
      case 'blocked':
      case 'open':
      case 'escalated':
        return 'bg-error/10';
      case 'suspicious':
      case 'investigating':
        return 'bg-warning/10';
      default: return 'bg-muted/10';
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-error';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-accent';
    return 'text-success';
  };

  const formatDateTime = (d) => {
    try { return d?.toLocaleString?.() || String(d); } catch { return String(d); }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevation-1">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Database" size={18} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">IDS Traffic Logs</h2>
              <p className="text-sm text-muted-foreground">
                Real-time IDS monitoring logs with ML-based threat detection
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            
            <Input
              type="search"
              placeholder="Search IPs, protocols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e?.target?.value)}
              className="w-64"
            />
            
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExport}
            >
              Export
            </Button>
          </div>
        </div>

        {selectedRows?.length > 0 && (
          <div className="flex items-center justify-between mt-4 p-3 bg-accent/10 rounded-lg">
            <span className="text-sm text-accent font-medium">
              {selectedRows?.length} rows selected
            </span>
            <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" iconName="Shield" onClick={async () => {
            // Implement block IPs action for selected rows
            if (selectedRows.length === 0) return;
            try {
              for (const id of selectedRows) {
                const result = await updateIncidentStatus(id, 'blocked', 'Blocked via UI');
                if (!result?.success) {
                  console.error(`Failed to block incident ${id}:`, result?.error);
                }
              }
              alert(`Successfully blocked ${selectedRows.length} IP(s)`);
            } catch (error) {
              console.error('Error blocking IPs:', error);
              alert('Failed to block some IPs. Check console for details.');
            }
          }}>
            Block IPs
          </Button>
          <Button variant="outline" size="sm" iconName="AlertTriangle" onClick={async () => {
            // Implement mark suspicious action for selected rows
            if (selectedRows.length === 0) return;
            try {
              for (const id of selectedRows) {
                const result = await updateIncidentStatus(id, 'suspicious', 'Marked suspicious via UI');
                if (!result?.success) {
                  console.error(`Failed to mark incident ${id} as suspicious:`, result?.error);
                }
              }
              alert(`Successfully marked ${selectedRows.length} incident(s) as suspicious`);
            } catch (error) {
              console.error('Error marking suspicious:', error);
              alert('Failed to mark some incidents as suspicious. Check console for details.');
            }
          }}>
            Mark Suspicious
          </Button>
          <Button variant="outline" size="sm" iconName="FileText" onClick={async () => {
            // Implement create report action for selected rows
            if (selectedRows.length === 0) return;
            try {
              const selectedIncidents = incidents.filter(inc => selectedRows.includes(inc.eventid));
              const report = await generateAIReport(selectedIncidents);
              if (report?.success) {
                alert('AI Report generated successfully.');
                console.log('Report data:', report?.data);
                // Could display report in modal or new page
              } else {
                alert(`Failed to generate AI report: ${report?.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error generating report:', error);
              alert('Failed to generate AI report. Check console for details.');
            }
          }}>
            Create Report
          </Button>
            </div>
          </div>
        )}
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/20 border-b border-border">
            <tr>
              <th className="w-12 p-4">
                <input
                  type="checkbox"
                  checked={selectedRows?.length === currentLogs?.length && currentLogs?.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent"
                />
              </th>
              {[
                { key: 'eventId', label: 'Event ID' },
                { key: 'timestamp', label: 'Time Stamp' },
                { key: 'sourceIp', label: 'Source IP' },
                { key: 'destinationIp', label: 'Destination IP' },
                { key: 'protocol', label: 'Protocol' },
                { key: 'attackType', label: 'Attack Type' },
                { key: 'severity', label: 'Severity' },
                { key: 'status', label: 'Status' },
                { key: 'riskScore', label: 'Risk Score' },
                { key: 'actionTaken', label: 'Action Taken' },
              ]?.map((column) => (
                <th
                  key={column?.key}
                  className="text-left p-4 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort(column?.key)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{column?.label}</span>
                    <Icon
                      name={sortField === column?.key 
                        ? (sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown')
                        : 'ChevronsUpDown'
                      }
                      size={14}
                      className={sortField === column?.key ? 'text-accent' : 'text-muted-foreground/50'}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentLogs?.map((log) => (
                <tr key={log?.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows?.includes(log?.id)}
                      onChange={() => handleRowSelect(log?.id)}
                      className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent"
                    />
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {log?.eventId}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {formatDateTime(log?.timestamp)}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-mono text-foreground">{log?.sourceIp}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-mono text-foreground">{log?.destinationIp}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground">{log?.protocol}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-foreground">{log?.attackType}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(log?.severity)} ${getStatusColor(log?.severity)}`}>
                      {log?.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(log?.status)} ${getStatusColor(log?.status)}`}>
                      {log?.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${getRiskScoreColor(log?.riskScore)}`}>
                      {log?.riskScore}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">{log?.actionTaken}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredAndSortedLogs?.length)} of {filteredAndSortedLogs?.length} results
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            iconName="ChevronLeft"
            iconPosition="left"
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {[...Array(Math.min(5, totalPages))]?.map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            iconName="ChevronRight"
            iconPosition="right"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionLogsTable;