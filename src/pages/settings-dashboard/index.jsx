import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import SecurityIntegrations from './components/SecurityIntegrations';
import AutomationRules from './components/AutomationRules';
import UserManagement from './components/UserManagement';
import SystemPreferences from './components/SystemPreferences';

const SettingsDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('integrations');

  const tabs = [
    {
      id: 'integrations',
      label: 'Security Integrations',
      icon: 'Plug',
      description: 'Manage security tool connections'
    },
    {
      id: 'automation',
      label: 'Automation Rules',
      icon: 'Zap',
      description: 'Configure automated responses'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: 'Users',
      description: 'Manage team members and roles'
    },
    {
      id: 'preferences',
      label: 'System Preferences',
      icon: 'Settings',
      description: 'System-wide configuration'
    }
  ];

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'integrations':
        return <SecurityIntegrations />;
      case 'automation':
        return <AutomationRules />;
      case 'users':
        return <UserManagement />;
      case 'preferences':
        return <SystemPreferences />;
      default:
        return <SecurityIntegrations />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings Dashboard - SOAR SOC Assistant</title>
        <meta name="description" content="Configure integrations, automation rules, user management, and system preferences for the cybersecurity platform" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleMenuToggle} isMenuOpen={sidebarOpen} />
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        <main className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}>
          <div className="p-6">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Icon name="Settings" size={24} className="text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Settings Dashboard</h1>
                  <p className="text-muted-foreground">
                    Configure system integrations, automation rules, and preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <div className="border-b border-border">
                  <nav className="flex space-x-8">
                    {tabs?.map((tab) => (
                      <button
                        key={tab?.id}
                        onClick={() => setActiveTab(tab?.id)}
                        className={`group flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab?.id
                            ? 'border-accent text-accent' :'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                        }`}
                      >
                        <Icon 
                          name={tab?.icon} 
                          size={18} 
                          className={activeTab === tab?.id ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}
                        />
                        <span>{tab?.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Mobile Tabs */}
              <div className="md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {tabs?.map((tab) => (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-lg border transition-colors ${
                        activeTab === tab?.id
                          ? 'border-accent bg-accent/5 text-accent' :'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon 
                        name={tab?.icon} 
                        size={20} 
                        className={activeTab === tab?.id ? 'text-accent' : 'text-muted-foreground'}
                      />
                      <span className="text-xs font-medium text-center">{tab?.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Description */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                {tabs?.find(tab => tab?.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab Content */}
            <div className="bg-background">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SettingsDashboard;