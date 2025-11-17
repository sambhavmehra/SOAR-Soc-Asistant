import React, { useMemo, useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import backendService from '../../../services/backend';

const TrafficMetricsCards = ({ incidents, loading }) => {
  const [idsStatus, setIdsStatus] = useState(null);
  const [idsStatusLoading, setIdsStatusLoading] = useState(false);

  // Fetch IDS status on component mount and periodically
  useEffect(() => {
    const fetchIDSStatus = async () => {
      try {
        setIdsStatusLoading(true);
        const result = await backendService.getIDSStatus();
        if (result.success && result.data) {
          setIdsStatus(result.data);
        }
      } catch (error) {
        console.error('Error fetching IDS status:', error);
      } finally {
        setIdsStatusLoading(false);
      }
    };

    fetchIDSStatus(); // Initial fetch

    // Refresh status every 30 seconds
    const interval = setInterval(fetchIDSStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const metricsData = useMemo(() => {
    if (idsStatusLoading || !idsStatus) {
      return [
        {
          id: 1,
          title: "Packets Processed",
          value: "Loading...",
          change: "",
          changeType: "",
          icon: "Activity",
          description: "Total packets analyzed",
          details: ""
        },
        {
          id: 2,
          title: "Alerts Generated",
          value: "Loading...",
          change: "",
          changeType: "",
          icon: "AlertTriangle",
          description: "Security alerts",
          details: ""
        },
        {
          id: 3,
          title: "System Health",
          value: "Loading...",
          change: "",
          changeType: "",
          icon: "Activity",
          description: "IDS system status",
          details: ""
        },
        {
          id: 4,
          title: "Monitoring Status",
          value: "Loading...",
          change: "",
          changeType: "",
          icon: "Shield",
          description: "IDS active state",
          details: ""
        }
      ];
    }

    const packetsProcessed = idsStatus.stats?.packets_processed || 0;
    const alertsGenerated = idsStatus.stats?.alerts_generated || 0;
    const systemHealth = idsStatus.stats?.system_health || 0;
    const isMonitoring = idsStatus.is_monitoring || false;
    const uptime = idsStatus.stats?.uptime || 0;

    return [
      {
        id: 1,
        title: "Packets Processed",
        value: packetsProcessed.toLocaleString(),
        change: "",
        changeType: "",
        icon: "Activity",
        description: "Total packets analyzed",
        details: `${packetsProcessed} packets monitored`
      },
      {
        id: 2,
        title: "Alerts Generated",
        value: alertsGenerated.toLocaleString(),
        change: "",
        changeType: alertsGenerated > 0 ? "increase" : "",
        icon: "AlertTriangle",
        description: "Security alerts",
        details: `${alertsGenerated} threats detected`
      },
      {
  id: 3,
  title: "System Health",
  value: `${systemHealth.toFixed(3)}%`,
  change: "",
  changeType: systemHealth >= 90 ? "increase" : systemHealth >= 70 ? "" : "decrease",
  icon: "Activity",
  description: "IDS system status",
  details: `Health score: ${systemHealth.toFixed(3)}%`
},

      {
        id: 4,
        title: "Monitoring Status",
        value: isMonitoring ? "Active" : "Inactive",
        change: "",
        changeType: "",
        icon: "Shield",
        description: isMonitoring ? "IDS active state" : "Monitoring stopped",
        details: isMonitoring ? `Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s` : "Click start to begin monitoring"
      }
    ];
  }, [idsStatus, idsStatusLoading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {metricsData?.map((metric) => (
        <div key={metric?.id} className="bg-card border border-border rounded-lg p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-hover">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name={metric?.icon} size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">{metric?.title}</h3>
                <p className="text-2xl font-bold text-foreground mt-1">{metric?.value}</p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              metric?.changeType === 'increase' ?'bg-success/10 text-success' :'bg-error/10 text-error'
            }`}>
              <Icon 
                name={metric?.changeType === 'increase' ? 'TrendingUp' : 'TrendingDown'} 
                size={12} 
              />
              <span>{metric?.change}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{metric?.description}</p>
            <p className="text-xs text-muted-foreground break-words">{metric?.details}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrafficMetricsCards;