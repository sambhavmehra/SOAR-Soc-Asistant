import React from 'react';
import Icon from '../../../components/AppIcon';


const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  iconColor, 
  bgColor, 
  onClick,
  loading = false,
  status = 'normal'
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'text-success';
    if (changeType === 'negative') return 'text-error';
    return 'text-muted-foreground';
  };

  const getStatusIndicator = () => {
    switch (status) {
      case 'critical': return 'bg-error';
      case 'warning': return 'bg-warning';
      case 'success': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  return (
    <div 
      className={`relative p-6 rounded-lg border border-border shadow-elevation-1 transition-hover cursor-pointer ${bgColor || 'bg-card'}`}
      onClick={onClick}
    >
      {/* Status Indicator */}
      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${getStatusIndicator()}`} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor || 'bg-accent'}`}>
              <Icon name={icon} size={20} color="white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            </div>
          </div>
          
          <div className="space-y-2">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-20" />
              </div>
            ) : (
              <div className="text-2xl font-bold text-foreground">{value}</div>
            )}
            
            {change && (
              <div className={`flex items-center space-x-1 text-sm ${getChangeColor()}`}>
                <Icon 
                  name={changeType === 'positive' ? 'TrendingUp' : changeType === 'negative' ? 'TrendingDown' : 'Minus'} 
                  size={14} 
                />
                <span>{change}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;