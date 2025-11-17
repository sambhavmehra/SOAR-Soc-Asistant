import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ChatInput = ({ onSendMessage, onFileUpload, isConnected, isLoading }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const suggestedQueries = [
    "Analyze recent security alerts",
    "Check IP reputation for 192.168.1.100",
    "Show vulnerability scan results",
    "Investigate suspicious network traffic",
    "Generate incident report for today",
    "Check firewall blocking status"
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (message?.trim() || attachments?.length > 0) {
      onSendMessage({
        content: message?.trim(),
        attachments: attachments,
        timestamp: new Date()
      });
      setMessage('');
      setAttachments([]);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e?.target?.files);
    const newAttachments = files?.map(file => ({
      name: file?.name,
      size: formatFileSize(file?.size),
      type: file?.type,
      file: file
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    onFileUpload?.(files);
    
    // Reset file input
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev?.filter((_, i) => i !== index));
  };

  const handleSuggestedQuery = (query) => {
    setMessage(query);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))?.toFixed(2)) + ' ' + sizes?.[i];
  };

  const handleKeyPress = (e) => {
    if (e?.key === 'Enter' && !e?.shiftKey) {
      e?.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-border bg-card p-4">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-warning" />
            <span className="text-sm text-warning font-medium">
              n8n Disconnected - Operating in offline mode
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Some automation features may be limited until connection is restored.
          </p>
        </div>
      )}
      {/* Suggested Queries */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {suggestedQueries?.slice(0, 3)?.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedQuery(query)}
              className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
      {/* File Attachments */}
      {attachments?.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="text-xs text-muted-foreground font-medium">Attachments:</div>
          {attachments?.map((attachment, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
              <div className="flex items-center space-x-2">
                <Icon name="Paperclip" size={14} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{attachment?.name}</span>
                <span className="text-xs text-muted-foreground">({attachment?.size})</span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                iconName="X"
                onClick={() => removeAttachment(index)}
                className="text-muted-foreground hover:text-foreground"
              >
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-end space-x-3">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e?.target?.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Ask about security incidents, threats, or system status..." : "Limited functionality - n8n disconnected"}
              className="w-full min-h-[44px] max-h-32 px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={isLoading}
              rows={1}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* File Upload */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              iconName="Paperclip"
              onClick={() => fileInputRef?.current?.click()}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <span className="sr-only">Attach file</span>
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              variant="default"
              size="icon"
              iconName="Send"
              disabled={isLoading || (!message?.trim() && attachments?.length === 0)}
              loading={isLoading}
              className="flex-shrink-0"
            >
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.log,.json,.csv,.pdf,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Input Help Text */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Supported: .txt, .log, .json, .csv, .pdf, images</span>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;