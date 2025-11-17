import React from 'react';
import Icon from '../../../components/AppIcon';

const AlertsSummary = ({ summaryData }) => {
  const summaryCards = [
    {
      title: 'Critical Alerts',
      value: summaryData?.critical,
      change: summaryData?.criticalChange,
      icon: 'AlertTriangle',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/20'
    },
    {
      title: 'High Priority',
      value: summaryData?.high,
      change: summaryData?.highChange,
      icon: 'AlertCircle',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    },
    {
      title: 'Open Incidents',
      value: summaryData?.open,
      change: summaryData?.openChange,
      icon: 'Clock',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20'
    },
    {
      title: 'Avg Response Time',
      value: summaryData?.avgResponseTime,
      change: summaryData?.responseTimeChange,
      icon: 'Timer',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      suffix: 'min'
    },
    {
      title: 'Resolved Today',
      value: summaryData?.resolvedToday,
      change: summaryData?.resolvedChange,
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20'
    },
    {
      title: 'Escalated',
      value: summaryData?.escalated,
      change: summaryData?.escalatedChange,
      icon: 'TrendingUp',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    }
  ];

  const formatChange = (change) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    return (
      <div className={`flex items-center space-x-1 text-xs ${isPositive ? 'text-error' : 'text-success'}`}>
        <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={12} />
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {summaryCards?.map((card, index) => (
        <div
          key={index}
          className={`bg-card rounded-lg border ${card?.borderColor} shadow-elevation-1 p-4 transition-hover hover:shadow-elevation-2`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${card?.bgColor} flex items-center justify-center`}>
              <Icon name={card?.icon} size={20} className={card?.color} />
            </div>
            {formatChange(card?.change)}
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-foreground">
                {card?.value}
              </span>
              {card?.suffix && (
                <span className="text-sm text-muted-foreground">{card?.suffix}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{card?.title}</p>
          </div>

          {/* Progress indicator for some cards */}
          {(card?.title === 'Critical Alerts' || card?.title === 'High Priority') && card?.value > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Requires attention</span>
                <span>{card?.value > 5 ? 'High' : 'Normal'}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${card?.value > 5 ? 'bg-error' : 'bg-warning'}`}
                  style={{ width: `${Math.min((card?.value / 10) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AlertsSummary;