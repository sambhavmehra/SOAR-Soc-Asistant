import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import Icon from '../../../components/AppIcon';

const ChatArea = ({ 
  messages, 
  isLoading, 
  isConnected, 
  onActionClick, 
  onExpandToggle,
  conversationTitle 
}) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderEmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="MessageSquare" size={32} className="text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Start Security Investigation
        </h3>
        <p className="text-muted-foreground mb-6">
          Ask questions about security incidents, analyze threats, or investigate suspicious activities. 
          I can help you with threat intelligence, vulnerability analysis, and incident response.
        </p>
        
        <div className="space-y-2 text-left">
          <div className="text-sm font-medium text-foreground mb-3">Try asking:</div>
          <div className="space-y-2">
            {[
              "Analyze the latest security alerts from today",
              "Check reputation for IP address 192.168.1.100",
              "Show me vulnerability scan results for web servers",
              "Investigate unusual network traffic patterns",
              "Generate incident timeline for case #2024-001"
            ]?.map((example, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Icon name="ArrowRight" size={14} />
                <span>"{example}"</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLoadingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%]">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-success text-success-foreground flex items-center justify-center mr-2">
            <Icon name="Bot" size={16} />
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">SOAR Assistant</span>
            <div className="text-xs text-muted-foreground">Analyzing...</div>
          </div>
        </div>
        
        <div className="bg-card border border-border p-4 rounded-lg mr-10">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Processing your request...' : 'Working in offline mode...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      {conversationTitle && (
        <div className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Icon name="Search" size={20} className="text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{conversationTitle}</h2>
              <p className="text-sm text-muted-foreground">
                Active investigation • {messages?.length} messages
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {messages?.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-1">
            {messages?.map((message) => (
              <ChatMessage
                key={message?.id}
                message={message}
                onActionClick={onActionClick}
                onExpandToggle={onExpandToggle}
              />
            ))}
            
            {isLoading && renderLoadingIndicator()}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="px-6 py-2 bg-warning/10 border-t border-warning/20">
          <div className="flex items-center justify-center space-x-2">
            <Icon name="Wifi" size={16} className="text-warning" />
            <span className="text-sm text-warning font-medium">
              Limited functionality - n8n automation engine disconnected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;