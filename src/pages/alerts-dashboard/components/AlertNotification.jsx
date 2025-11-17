import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AlertNotification = ({ alert, onDismiss, onViewAlert }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Auto-dismiss after 10 seconds for non-critical alerts
    const autoDismissTimer = alert?.severity !== 'critical' 
      ? setTimeout(() => {
          handleDismiss();
        }, 10000)
      : null;

    return () => {
      clearInterval(timer);
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
    };
  }, [alert?.severity]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(alert?.id), 300);
  };

  const getSeverityConfig = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bgColor: 'bg-error/90',
          borderColor: 'border-error',
          textColor: 'text-white',
          icon: 'AlertTriangle',
          pulse: true
        };
      case 'high':
        return {
          bgColor: 'bg-warning/90',
          borderColor: 'border-warning',
          textColor: 'text-white',
          icon: 'AlertCircle',
          pulse: false
        };
      case 'medium':
        return {
          bgColor: 'bg-accent/90',
          borderColor: 'border-accent',
          textColor: 'text-white',
          icon: 'Info',
          pulse: false
        };
      default:
        return {
          bgColor: 'bg-muted/90',
          borderColor: 'border-border',
          textColor: 'text-foreground',
          icon: 'Bell',
          pulse: false
        };
    }
  };

  const config = getSeverityConfig(alert?.severity);
  
  const formatTimeElapsed = (seconds) => {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]
      ${config?.bgColor} ${config?.textColor} 
      border ${config?.borderColor} rounded-lg shadow-elevation-3
      transform transition-all duration-300 ease-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      ${config?.pulse ? 'animate-pulse' : ''}
    `}>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon name={config?.icon} size={20} className={config?.textColor} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-sm truncate">
                New {alert?.severity} Alert
              </h4>
              <span className="text-xs opacity-75 ml-2">
                {formatTimeElapsed(timeElapsed)}
              </span>
            </div>
            
            <p className="text-sm opacity-90 mb-2 line-clamp-2">
              {alert?.type} detected on {alert?.affectedSystem}
            </p>
            
            <div className="text-xs opacity-75 mb-3">
              Alert ID: {alert?.id} • {new Date(alert.timestamp)?.toLocaleTimeString()}
            </div>
            

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewAlert(alert?.id)}
                className={`${config?.textColor} hover:bg-white/20 border-white/30`}
              >
                View Details
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                iconName="X"
                iconSize={14}
                className={`${config?.textColor} hover:bg-white/20 border-white/30`}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Progress bar for auto-dismiss */}
      {alert?.severity !== 'critical' && (
        <div className="h-1 bg-white/20 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-white/40 transition-all duration-1000 ease-linear"
            style={{ 
              width: `${100 - (timeElapsed / 10) * 100}%`,
              transition: timeElapsed === 0 ? 'none' : 'width 1s linear'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AlertNotification;