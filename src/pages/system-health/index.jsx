import React from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Icon from '../../components/AppIcon';
import { pingN8n } from '../../services/n8n';
import GoogleSheetsService from '../../services/googleSheets';

const SystemHealthPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [n8nOk, setN8nOk] = React.useState(false);
  const [sheetsOk, setSheetsOk] = React.useState(false);

  const check = async () => {
    const res = await pingN8n();
    setN8nOk(!!res?.ok);
    setSheetsOk(!!(GoogleSheetsService?.spreadsheetId && GoogleSheetsService?.apiKey));
  };

  React.useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusCard = ({ ok, label }) => (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded ${ok ? 'bg-success/20 text-success' : 'bg-error/20 text-error'} flex items-center justify-center`}>
          <Icon name={ok ? 'CheckCircle' : 'XCircle'} size={16} />
        </div>
        <div>
          <div className="text-sm text-foreground font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{ok ? 'Connected' : 'Not Connected'}</div>
        </div>
      </div>
      <div className={`text-xs px-2 py-1 rounded ${ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} font-medium`}>{ok ? '✅' : '❌'}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isMenuOpen={isSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 lg:ml-60 p-6 space-y-4">
          <h2 className="text-xl font-bold text-foreground">System Health</h2>
          <StatusCard ok={n8nOk} label="n8n Agent" />
          <StatusCard ok={sheetsOk} label="Google Sheets" />
          <button onClick={check} className="px-3 py-2 text-sm bg-accent text-accent-foreground rounded">Recheck</button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPage;







