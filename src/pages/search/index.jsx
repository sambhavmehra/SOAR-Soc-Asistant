import React, { useMemo, useState } from 'react';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { useSecurityIncidents } from '../../hooks/useSecurityIncidents';

const SearchPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { incidents, loading, error } = useSecurityIncidents();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (incidents || []).filter(i => {
      const matchesText = !q || [i?.eventid, i?.sourceip, i?.destinationip, i?.attacktype, i?.status]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
      const matchesSeverity = !severity || (i?.severity || '').toLowerCase() === severity.toLowerCase();
      return matchesText && matchesSeverity;
    });
  }, [incidents, query, severity]);

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} isMenuOpen={isSidebarOpen} />
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 lg:ml-60 p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Search Incidents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Input label="Query" placeholder="IP, Event ID, attack type..." value={query} onChange={e => setQuery(e?.target?.value)} />
            <Input label="Severity (low/medium/high/critical)" placeholder="e.g., High" value={severity} onChange={e => setSeverity(e?.target?.value)} />
          </div>
          {loading && <div className="text-muted-foreground">Loading...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-border text-sm text-muted-foreground">{results?.length} results</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="text-left px-4 py-2">Timestamp</th>
                      <th className="text-left px-4 py-2">Event ID</th>
                      <th className="text-left px-4 py-2">Severity</th>
                      <th className="text-left px-4 py-2">Source</th>
                      <th className="text-left px-4 py-2">Destination</th>
                      <th className="text-left px-4 py-2">Attack</th>
                      <th className="text-left px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results?.map((i, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/10">
                        <td className="px-4 py-2">{i?.timestamp}</td>
                        <td className="px-4 py-2 font-mono">{i?.eventid}</td>
                        <td className="px-4 py-2">{i?.severity}</td>
                        <td className="px-4 py-2">{i?.sourceip}</td>
                        <td className="px-4 py-2">{i?.destinationip || 'N/A'}</td>
                        <td className="px-4 py-2">{i?.attacktype}</td>
                        <td className="px-4 py-2">{i?.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;







