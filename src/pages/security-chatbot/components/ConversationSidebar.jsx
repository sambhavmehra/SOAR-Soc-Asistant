import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onExportConversation,
  onGeneratePDFReport,
  recentAlerts,
  isCollapsed,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations?.filter(conv =>
    (conv?.title && typeof conv.title === 'string' && conv.title.toLowerCase().includes(searchTerm?.toLowerCase())) ||
    (conv?.summary && typeof conv.summary === 'string' && conv.summary.toLowerCase().includes(searchTerm?.toLowerCase())) ||
    (conv?.topic && typeof conv.topic === 'string' && conv.topic.toLowerCase().includes(searchTerm?.toLowerCase()))
  );

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date?.toLocaleDateString();
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-error';
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          iconName="PanelLeftOpen"
          onClick={onToggleCollapse}
          className="flex-shrink-0"
        >
          <span className="sr-only">Expand sidebar</span>
        </Button>
            <Button
              variant="ghost"
              size="icon"
              iconName="Plus"
              onClick={() => onNewConversation()}
              className="flex-shrink-0"
            >
              <span className="sr-only">New conversation</span>
            </Button>
        <div className="flex-1 flex flex-col items-center space-y-2">
          {conversations?.slice(0, 5)?.map((conv) => (
            <button
              key={conv?.id}
              onClick={() => onConversationSelect(conv?.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
                activeConversationId === conv?.id
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              title={conv?.title}
            >
              {conv?.title?.charAt(0)?.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Investigations</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              iconName="Plus"
              onClick={() => onNewConversation()}
            >
              <span className="sr-only">New conversation</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              iconName="PanelLeftClose"
              onClick={onToggleCollapse}
            >
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Icon 
            name="Search" 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {filteredConversations?.map((conversation) => (
            <div
              key={conversation?.id}
              className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                activeConversationId === conversation?.id
                  ? 'bg-accent/10 border border-accent/20' :'hover:bg-muted/50'
              }`}
              onClick={() => onConversationSelect(conversation?.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {conversation?.title}
                  </h3>
                  {conversation?.topic && (
                    <span className="text-xs text-accent font-medium">
                      {conversation?.topic}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {conversation?.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(conversation?.lastActivity)}
                    </span>
                    {conversation?.messageCount && (
                      <span className="text-xs text-muted-foreground">
                        {conversation?.messageCount} messages
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    iconName="FileText"
                    onClick={(e) => {
                      e?.stopPropagation();
                      if (window.confirm('Generate PDF report for this conversation?')) {
                        onGeneratePDFReport(conversation?.id);
                      }
                    }}
                  >
                    <span className="sr-only">Generate PDF Report</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconName="Download"
                    onClick={(e) => {
                      e?.stopPropagation();
                      onExportConversation(conversation?.id);
                    }}
                  >
                    <span className="sr-only">Export conversation</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconName="Trash2"
                    onClick={(e) => {
                      e?.stopPropagation();
                      onDeleteConversation(conversation?.id);
                    }}
                    className="text-error hover:text-error"
                  >
                    <span className="sr-only">Delete conversation</span>
                  </Button>
                </div>
              </div>

              {/* Investigation Status */}
              {conversation?.status && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    conversation?.status === 'active' ? 'bg-success animate-pulse' :
                    conversation?.status === 'pending'? 'bg-warning' : 'bg-muted-foreground'
                  }`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {conversation?.status}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Recent Alerts */}
      <div className="border-t border-border p-4">
        <h3 className="font-medium text-sm text-foreground mb-3">Recent Alerts</h3>
        <div className="space-y-2">
          {recentAlerts?.slice(0, 3)?.map((alert) => (
            <div
              key={alert?.id}
              className="p-2 bg-muted/30 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onNewConversation && onNewConversation(`Investigate alert: ${alert?.title}`)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground truncate">
                  {alert?.title}
                </span>
                <span className={`text-xs font-medium ${getSeverityColor(alert?.severity)}`}>
                  {alert?.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {alert?.description}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(alert?.timestamp)}
                </span>
                <Icon name="MessageSquare" size={12} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;
