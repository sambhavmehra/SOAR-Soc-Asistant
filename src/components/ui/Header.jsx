import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { Button } from './Button';
import { pingN8n } from '../../services/n8n';
import { useSecurityIncidents } from '../../hooks/useSecurityIncidents';

const Header = ({ onMenuToggle, isMenuOpen = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const { incidents } = useSecurityIncidents();

  useEffect(() => {
    const check = async () => {
      const res = await pingN8n();
      setIsConnected(!!res?.ok);
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const pathMap = {
      '/main-dashboard': 'Dashboard',
      '/security-chatbot': 'Security Assistant',
      '/traffic-dashboard': 'Traffic Monitor',
      '/alerts-dashboard': 'Active Alerts',
      '/reports-dashboard': 'Reports',
      '/settings-dashboard': 'Settings'
    };
    return pathMap?.[location?.pathname] || 'SOAR SOC Assistant';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-elevation-1">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section - Menu Toggle & Title */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
            iconName={isMenuOpen ? "X" : "Menu"}
            iconSize={20}
          >
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Icon name="Shield" size={20} color="white" />
              </div>
              <span className="font-semibold text-lg text-foreground lg:hidden xl:block">
                SOAR SOC Assistant
              </span>
            </div>
            <div className="hidden sm:block text-muted-foreground">
              <Icon name="ChevronRight" size={16} />
            </div>
            <h1 className="hidden sm:block text-lg font-medium text-foreground">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right Section - Status & Actions */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`} />
            <span className="hidden md:block text-sm text-muted-foreground">
              n8n {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              iconName="Bell"
              iconSize={18}
              onClick={() => navigate('/notifications')}
            >
              {incidents?.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-error rounded-full text-[10px] leading-4 flex items-center justify-center text-white">
                  {Math.min(99, incidents?.filter(i => (i?.status||'')?.toLowerCase()?.includes('investigating'))?.length || 0)}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              iconName="Search"
              iconSize={18}
              onClick={() => navigate('/search')}
            >
              <span className="sr-only">Search</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              iconName="Settings"
              iconSize={18}
              onClick={() => navigate('/system-health')}
            >
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;