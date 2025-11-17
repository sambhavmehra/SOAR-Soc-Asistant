import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import {Button} from '../../../components/ui/Button';
import backendService from '../../../services/backend';

const QuickActionsPanel = () => {
  const navigate = useNavigate();
  const [isStartingIDS, setIsStartingIDS] = useState(false);

  const handleStartIDS = async () => {
    try {
      setIsStartingIDS(true);
      const result = await backendService.startIDSMonitoring();
      if (result.success) {
        alert('IDS monitoring started successfully!');
        navigate('/traffic-dashboard');
      } else {
        alert('Failed to start IDS monitoring: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error starting IDS:', error);
      alert('Error starting IDS monitoring: ' + error.message);
    } finally {
      setIsStartingIDS(false);
    }
  };

  const quickActions = [
    {
      id: 1,
      title: 'Investigate Threat',
      description: 'Launch AI-powered security investigation',
      icon: 'MessageSquare',
      iconColor: 'bg-accent',
      action: () => navigate('/security-chatbot'),
      shortcut: 'Ctrl+I'
    },
    {
      id: 2,
      title: 'View Traffic',
      description: 'Monitor real-time network activity',
      icon: 'Activity',
      iconColor: 'bg-success',
      action: () => navigate('/traffic-dashboard'),
      shortcut: 'Ctrl+T'
    },
    {
      id: 3,
      title: 'Emergency Response',
      description: 'Activate incident response protocol',
      icon: 'AlertTriangle',
      iconColor: 'bg-error',
      action: () => console.log('Emergency response activated'),
      shortcut: 'Ctrl+E'
    },
    {
      id: 4,
      title: 'Generate Report',
      description: 'Create security summary report',
      icon: 'FileText',
      iconColor: 'bg-warning',
      action: () => navigate('/reports-dashboard'),
      shortcut: 'Ctrl+R'
    },
    {
      id: 5,
      title: 'Start IDS Monitoring',
      description: 'Begin network traffic monitoring',
      icon: 'Shield',
      iconColor: 'bg-primary',
      action: handleStartIDS,
      shortcut: 'Ctrl+M',
      disabled: isStartingIDS
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border shadow-elevation-1">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <Icon name="Zap" size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions?.map((action) => (
            <button
              key={action?.id}
              onClick={action?.action}
              disabled={action?.disabled}
              className={`p-4 rounded-lg border border-border hover:border-accent/50 hover:bg-muted/30 transition-all duration-200 text-left group ${
                action?.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action?.iconColor} group-hover:scale-105 transition-transform`}>
                  <Icon name={action?.icon} size={20} color="white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground text-sm">
                      {action?.title}
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {action?.shortcut}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {action?.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Use keyboard shortcuts for faster access</span>
          <Button
            variant="ghost"
            size="xs"
            iconName="Keyboard"
            iconSize={12}
          >
            <span className="sr-only">View all shortcuts</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;