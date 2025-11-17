import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { logout } from '../../store/slices/authSlice';
import Icon from '../AppIcon';
import {Button} from './Button';
import n8nAgentService from '../../services/n8nAgent';

const Sidebar = ({ isCollapsed = false, isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, role } = useSelector(state => state.auth);
  const [alertCount] = useState();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const available = await n8nAgentService.isAvailable();
        setIsConnected(available);
      } catch (error) {
        console.error('Error checking n8n agent availability:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/main-dashboard',
      icon: 'LayoutDashboard',
      tooltip: 'Main security overview and system status'
    },
    {
      label: 'Investigate',
      path: '/security-chatbot',
      icon: 'MessageSquare',
      tooltip: 'AI-powered security investigation assistant'
    },
    {
      label: 'Traffic',
      path: '/traffic-dashboard',
      icon: 'Activity',
      tooltip: 'Real-time network traffic monitoring'
    },
    {
      label: 'Alerts',
      path: '/alerts-dashboard',
      icon: 'AlertTriangle',
      tooltip: 'Active security alerts and incidents',
      badge: alertCount
    },
    {
      label: 'Reports',
      path: '/reports-dashboard',
      icon: 'FileText',
      tooltip: 'Security reports and compliance data'
    },
    {
      label: 'Settings',
      path: '/settings-dashboard',
      icon: 'Settings',
      tooltip: 'System configuration and integrations'
    }
  ];

  const systemIntegrations = [
    { name: 'SIEM', status: 'connected' },
    { name: 'EDR', status: 'connected' },
    { name: 'Firewall', status: 'warning' },
    { name: 'IDS/IPS', status: 'connected' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = (email) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (userRole) => {
    switch (userRole) {
      case 'admin': return 'bg-error text-error-foreground';
      case 'analyst': return 'bg-accent text-accent-foreground';
      case 'operator': return 'bg-warning text-warning-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const sidebarClasses = `
    fixed top-0 left-0 h-full bg-card border-r border-border shadow-elevation-2 z-40
    transition-all duration-300 ease-in-out
    ${isCollapsed ? 'w-16' : 'w-60'}
    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <Icon name="Shield" size={20} color="white" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground">SOAR SOC</h2>
                  <p className="text-xs text-muted-foreground">Assistant</p>
                </div>
              </div>
            )}
            
            {isCollapsed && (
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mx-auto">
                <Icon name="Shield" size={20} color="white" />
              </div>
            )}

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              iconName="X"
              iconSize={18}
            >
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems?.map((item) => {
              const isActive = location?.pathname === item?.path;
              
              return (
                <Link
                  key={item?.path}
                  to={item?.path}
                  className={`
                    group flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-hover relative
                    ${isActive 
                      ? 'bg-accent text-accent-foreground shadow-elevation-1' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item?.tooltip : ''}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose?.();
                    }
                  }}
                >
                  <div className="relative">
                    <Icon 
                      name={item?.icon} 
                      size={20} 
                      className={isActive ? 'text-accent-foreground' : ''}
                    />
                    {item?.badge && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
                        {item?.badge > 9 ? '9+' : item?.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item?.label}</span>
                  )}
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-elevation-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item?.tooltip}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Section */}
          {!isCollapsed && user && (
            <div className="p-4 border-t border-border">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-semibold text-sm">
                    {getUserInitials(user.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.email?.split('@')[0] || 'Security Analyst'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(role)}`}>
                        {role || 'user'}
                      </span>
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" title="Active" />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/profile')}
                    className="flex-1 text-xs"
                    iconName="User"
                    iconSize={14}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex-1 text-xs"
                    iconName="LogOut"
                    iconSize={14}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed User Profile */}
          {isCollapsed && user && (
            <div className="p-4 border-t border-border">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-semibold text-xs">
                  {getUserInitials(user.email)}
                </div>
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/profile')}
                    className="w-8 h-8"
                    title="Profile"
                  >
                    <Icon name="User" size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="w-8 h-8"
                    title="Logout"
                  >
                    <Icon name="LogOut" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;