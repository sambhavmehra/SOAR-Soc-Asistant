import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ChatMessage = ({ message, onActionClick, onExpandToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpandToggle?.(message?.id, !isExpanded);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp)?.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderThreatIntelligence = (data) => (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-foreground">Threat Intelligence</h4>
        <Button
          variant="ghost"
          size="xs"
          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
          onClick={handleExpand}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">Severity:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                data?.severity === 'High' ? 'bg-error/20 text-error' :
                data?.severity === 'Medium'? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
              }`}>
                {data?.severity}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Confidence:</span>
              <span className="ml-2 text-foreground">{data?.confidence}%</span>
            </div>
          </div>
          
          {data?.indicators && (
            <div>
              <span className="text-muted-foreground">IOCs:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {data?.indicators?.map((ioc, index) => (
                  <button
                    key={index}
                    onClick={() => onActionClick?.('investigate', ioc)}
                    className="px-2 py-1 bg-accent/20 text-accent rounded text-xs hover:bg-accent/30 transition-colors"
                  >
                    {ioc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderVulnerabilityDetails = (data) => (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-foreground">Vulnerability Analysis</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          data?.cvssScore >= 7 ? 'bg-error/20 text-error' :
          data?.cvssScore >= 4 ? 'bg-warning/20 text-warning': 'bg-success/20 text-success'
        }`}>
          CVSS {data?.cvssScore}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">CVE:</span>
          <span className="ml-2 text-foreground font-mono">{data?.cve}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Affected Systems:</span>
          <span className="ml-2 text-foreground">{data?.affectedSystems}</span>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="xs"
            iconName="Shield"
            onClick={() => onActionClick?.('patch', data?.cve)}
          >
            Apply Patch
          </Button>
          <Button
            variant="outline"
            size="xs"
            iconName="AlertTriangle"
            onClick={() => onActionClick?.('isolate', data?.cve)}
          >
            Isolate Systems
          </Button>
        </div>
      </div>
    </div>
  );

  const renderIncidentTimeline = (data) => (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
      <h4 className="font-medium text-sm text-foreground mb-3">Incident Timeline</h4>
      <div className="space-y-3">
        {data?.events?.map((event, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{event?.action}</span>
                <span className="text-xs text-muted-foreground">{event?.timestamp}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{event?.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSelfEnhancementOptions = (data) => (
    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center space-x-2 mb-2">
        <Icon name="Code" size={16} className="text-blue-600 dark:text-blue-400" />
        <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">Self-Enhancement Options</h4>
      </div>
      <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
        I can help improve the system based on your request. Choose an action:
      </p>
      <div className="space-y-2">
        {data?.options?.map((option, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{option?.title}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{option?.description}</p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => onActionClick?.(option?.action, option?.data)}
              className="ml-3 text-xs"
            >
              {option?.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex ${message?.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${message?.sender === 'user' ? 'order-2' : 'order-1'}`}>
        {/* Avatar and Name */}
        <div className={`flex items-center mb-2 ${message?.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex items-center space-x-2 ${message?.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              message?.sender === 'user' ?'bg-accent text-accent-foreground' :'bg-success text-success-foreground'
            }`}>
              <Icon 
                name={message?.sender === 'user' ? 'User' : 'Bot'} 
                size={16} 
              />
            </div>
            <div className={`text-sm ${message?.sender === 'user' ? 'text-right' : 'text-left'}`}>
              <span className="font-medium text-foreground">
                {message?.sender === 'user' ? 'You' : 'SOAR Assistant'}
              </span>
              <div className="text-xs text-muted-foreground">
                {formatTimestamp(message?.timestamp)}
              </div>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className={`p-4 rounded-lg ${
          message?.sender === 'user' ?'bg-accent text-accent-foreground ml-10' :'bg-card border border-border mr-10'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message?.content}
          </div>

          {/* Structured Data */}
          {message?.data?.type === 'threat_intelligence' && renderThreatIntelligence(message?.data)}
          {message?.data?.type === 'vulnerability' && renderVulnerabilityDetails(message?.data)}
          {message?.data?.type === 'incident_timeline' && renderIncidentTimeline(message?.data)}
          {message?.data?.type === 'self_enhancement' && renderSelfEnhancementOptions(message?.data)}

          {/* Action Buttons */}
          {message?.actions && message?.actions?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message?.actions?.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="xs"
                  iconName={action?.icon}
                  onClick={() => onActionClick?.(action?.type, action?.data)}
                  className="text-xs"
                >
                  {action?.label}
                </Button>
              ))}
            </div>
          )}

          {/* File Attachments */}
          {message?.attachments && message?.attachments?.length > 0 && (
            <div className="mt-3 space-y-2">
              {message?.attachments?.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded border">
                  <Icon name="Paperclip" size={16} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">{attachment?.name}</span>
                  <span className="text-xs text-muted-foreground">({attachment?.size})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;