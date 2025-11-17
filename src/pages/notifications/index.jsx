import React from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { useSecurityIncidents } from '../../hooks/useSecurityIncidents';

const NotificationsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { incidents, loading, error } = useSecurityIncidents();

  const items = (incidents || []).filter(i => (i?.status || '').toLowerCase().includes('investigating'));

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isMenuOpen={isSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 lg:ml-60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          </div>
          {loading && (
            <div className="text-muted-foreground">Loading...</div>
          )}
          {error && (
            <div className="text-error">{error}</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-muted-foreground">No active notifications</div>
          )}
          <div className="space-y-3">
            {items.map((i, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-warning/20 text-warning flex items-center justify-center">
                    <Icon name="Bell" size={16} />
                  </div>
                  <div>
                    <div className="text-sm text-foreground font-medium">{i?.attacktype || 'Security Event'}</div>
                    <div className="text-xs text-muted-foreground">{i?.timestamp} • {i?.sourceip} → {i?.destinationip || 'N/A'}</div>
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-warning/10 text-warning font-medium">{i?.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;







