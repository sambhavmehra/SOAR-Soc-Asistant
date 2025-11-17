import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import ConversationSidebar from './components/ConversationSidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import Select from '../../components/ui/Select';
import NewConversationModal from './components/NewConversationModal';
import { callN8nAgent, pingN8n } from '../../services/n8n';
import GoogleSheetsService from '../../services/googleSheets';
import backendService from '../../services/backend';
import { askAgent, executeOption } from "../../services/agent";


const SecurityChatbot = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isConversationSidebarCollapsed, setIsConversationSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [preferredEngine, setPreferredEngine] = useState('soar'); // 'soar' for n8n, 'ai' for groq
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  // Mock data for conversations
  const mockConversations = [
    {
      id: 'conv-1',
      title: 'Suspicious IP Investigation',
      summary: 'Analyzing traffic from 192.168.1.100 showing unusual patterns and potential malware communication.',
      lastActivity: new Date(Date.now() - 300000),
      messageCount: 12,
      status: 'active',
      topic: 'Network Anomaly'
    },
    {
      id: 'conv-2',
      title: 'Vulnerability Assessment',
      summary: 'CVE-2024-1234 analysis for web servers, checking patch status and affected systems.',
      lastActivity: new Date(Date.now() - 3600000),
      messageCount: 8,
      status: 'completed',
      topic: 'Vulnerability Assessment'
    },
    {
      id: 'conv-3',
      title: 'Phishing Email Analysis',
      summary: 'Investigating suspicious email campaign targeting finance department with malicious attachments.',
      lastActivity: new Date(Date.now() - 7200000),
      messageCount: 15,
      status: 'pending',
      topic: 'Phishing Analysis'
    },
    {
      id: 'conv-4',
      title: 'Network Anomaly Detection',
      summary: 'Unusual outbound traffic detected from internal servers, investigating potential data exfiltration.',
      lastActivity: new Date(Date.now() - 86400000),
      messageCount: 6,
      status: 'active',
      topic: 'Network Anomaly'
    }
  ];

  // Mock data for recent alerts
  const mockRecentAlerts = [
    {
      id: 'alert-1',
      title: 'Multiple Failed Login Attempts',
      description: 'Brute force attack detected on admin accounts',
      severity: 'High',
      timestamp: new Date(Date.now() - 900000)
    },
    {
      id: 'alert-2',
      title: 'Suspicious File Download',
      description: 'Potentially malicious executable downloaded',
      severity: 'Critical',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: 'alert-3',
      title: 'Unusual Network Traffic',
      description: 'Abnormal data transfer patterns detected',
      severity: 'Medium',
      timestamp: new Date(Date.now() - 3600000)
    }
  ];

  // Mock messages for active conversation
  const mockMessages = [
    {
      id: 'msg-1',
      sender: 'user',
      content: 'Investigate suspicious IP address 192.168.1.100',
      timestamp: new Date(Date.now() - 300000),
      attachments: []
    },
    {
      id: 'msg-2',
      sender: 'assistant',
      content: 'Analyzing IP address 192.168.1.100. This IP has been flagged for unusual outbound connections to known malicious domains. Let me check threat intelligence sources.',
      timestamp: new Date(Date.now() - 290000),
      data: {
        type: 'threat_intelligence',
        severity: 'High',
        confidence: 85,
        indicators: ['192.168.1.100', 'malicious-domain.com']
      },
      actions: [
        { type: 'block', label: 'Block IP', data: '192.168.1.100' },
        { type: 'investigate', label: 'Deep Scan', data: '192.168.1.100' }
      ]
    },
    {
      id: 'msg-3',
      sender: 'user',
      content: 'What type of traffic is it generating?',
      timestamp: new Date(Date.now() - 280000),
      attachments: []
    },
    {
      id: 'msg-4',
      sender: 'assistant',
      content: 'The IP is generating outbound HTTP POST requests to port 8080 on external servers. This pattern is consistent with command and control (C2) communication. I recommend immediate isolation.',
      timestamp: new Date(Date.now() - 270000),
      data: {
        type: 'vulnerability',
        cve: 'N/A',
        cvssScore: 8.5,
        affectedSystems: 'Internal network segment'
      },
      actions: [
        { type: 'isolate', label: 'Isolate Network Segment', data: '192.168.1.0/24' },
        { type: 'monitor', label: 'Enhanced Monitoring', data: '192.168.1.100' }
      ]
    }
  ];


  useEffect(() => {
    loadConversationsFromStorage();

    // Load preferred engine from localStorage
    const savedEngine = localStorage.getItem('preferredEngine');
    if (savedEngine && ['soar', 'ai'].includes(savedEngine)) {
      setPreferredEngine(savedEngine);
    }

    const checkConnectivity = async () => {
      const n8nOk = await pingN8n();
      const backendOk = await backendService.isAvailable().catch(() => false);
      const sheetsOk = !!(GoogleSheetsService?.spreadsheetId && GoogleSheetsService?.apiKey);

      // Connection status depends on preferred engine
      if (preferredEngine === 'soar') {
        // SOAR Engine: n8n only
        setIsConnected(!!(n8nOk?.ok && sheetsOk));
      } else {
        // AI Engine: backend (groq) only
        setIsConnected(!!(backendOk && sheetsOk));
      }
    };
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);
    return () => clearInterval(interval);
  }, [preferredEngine]);

  // Load conversations from localStorage (JSON storage)
  const loadConversationsFromStorage = async () => {
    try {
      const storedConversations = localStorage.getItem('chatbot_conversations');
      if (storedConversations) {
        const parsedConversations = JSON.parse(storedConversations);
        setConversations(parsedConversations);
        // Set first conversation as active if none selected
        if (!activeConversationId && parsedConversations.length > 0) {
          setActiveConversationId(parsedConversations[0].id);
          loadConversationMessagesFromStorage(parsedConversations[0].id);
        }
      } else {
        // No stored conversations, start with empty state
        setConversations([]);
      }
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
      setConversations([]);
    }
  };

  // Save conversations to localStorage
  const saveConversationsToStorage = (conversations) => {
    try {
      localStorage.setItem('chatbot_conversations', JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to storage:', error);
    }
  };

  // Load messages for a specific conversation from localStorage
  const loadConversationMessagesFromStorage = (conversationId) => {
    try {
      const storedMessages = localStorage.getItem(`chat_messages_${conversationId}`);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages from storage:', error);
      setMessages([]);
    }
  };

  // Save messages for a conversation to localStorage
  const saveMessagesToStorage = (conversationId, messages) => {
    try {
      localStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  };

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId) => {
    try {
      const result = await backendService.getConversation(conversationId);
      if (result.success) {
        // Transform backend message format to frontend format
        const transformedMessages = result.data.messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          attachments: []
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setMessages([]);
    }
  };

  // Cache for conversation titles to avoid repeated API calls
  const titleCache = new Map();

  // Generate conversation title from message content
  const generateConversationTitle = async (messageContent) => {
    // Check cache first
    const cacheKey = messageContent.substring(0, 100); // Use first 100 chars as key
    if (titleCache.has(cacheKey)) {
      console.log('Using cached title for:', cacheKey);
      return titleCache.get(cacheKey);
    }

    try {
      // Use AI to generate a concise title
      const titlePrompt = `Generate a concise, descriptive title (max 8 words) for a security investigation conversation based on this message: "${messageContent}". Focus on the main security topic or threat.`;

      const response = await backendService.sendChatMessage(
        titlePrompt,
        [],
        { generateTitle: true }
      );

      if (response?.reply) {
        // Clean up the title - remove quotes, limit length
        let title = response.reply.replace(/^["']|["']$/g, '').trim();
        if (title.length > 50) {
          title = title.substring(0, 47) + '...';
        }
        // Cache the result
        titleCache.set(cacheKey, title);
        return title;
      }
    } catch (error) {
      console.error('Failed to generate title:', error);
      // Don't throw error, just return fallback
    }

    // Fallback: Use first few words of the message
    const words = messageContent.split(' ').slice(0, 4).join(' ');
    const fallbackTitle = words.length > 0 ? `${words}...` : 'New Security Investigation';
    // Cache the fallback too
    titleCache.set(cacheKey, fallbackTitle);
    return fallbackTitle;
  };

  // Function to detect if message is asking about logs
  const detectLogQuery = (message) => {
    const logKeywords = [
      'log', 'logs', 'alert', 'alerts', 'ids', 'intrusion', 'detection',
      'traffic', 'packet', 'network', 'security event', 'threat',
      'malicious', 'suspicious', 'blocked', 'allowed', 'monitor'
    ];

    const messageLower = message.toLowerCase();
    return logKeywords.some(keyword => messageLower.includes(keyword));
  };

  // Function to extract IP addresses from message
  const extractIPs = (message) => {
    const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    return message.match(ipRegex) || [];
  };

  // Function to fetch and format logs
  const fetchAndFormatLogs = async (message) => {
    try {
      const ips = extractIPs(message);
      let logs = [];
      let logType = 'general';

      if (ips.length > 0) {
        // Fetch logs for specific IP
        const ip = ips[0]; // Use first IP found
        const result = await backendService.getIDSLogsByIP(ip, 20);
        if (result.success) {
          logs = result.data;
          logType = `IP ${ip}`;
        }
      } else {
        // Fetch recent general logs
        const result = await backendService.getIDSLogs(20);
        if (result.success) {
          logs = result.data;
          logType = 'recent';
        }
      }

      if (logs.length === 0) {
        return 'No IDS logs found.';
      }

      // Format logs for inclusion in message
      let formattedLogs = `\n\n**Recent IDS Logs (${logType}):**\n\n`;
      logs.slice(0, 10).forEach((log, index) => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const status = log.alert_level === 'alert' ? '🚨 ALERT' :
                      log.alert_level === 'warning' ? '⚠️ WARNING' : '✅ NORMAL';
        formattedLogs += `${index + 1}. [${timestamp}] ${status}\n`;
        formattedLogs += `   ${log.source_ip} → ${log.destination_ip} (${log.protocol})\n`;
        formattedLogs += `   Detection: ${log.detection}\n`;
        formattedLogs += `   Status: ${log.status}\n\n`;
      });

      if (logs.length > 10) {
        formattedLogs += `... and ${logs.length - 10} more entries.\n`;
      }

      return formattedLogs;
    } catch (error) {
      console.error('Error fetching logs:', error);
      return 'Unable to fetch IDS logs at this time.';
    }
  };

  const handleSendMessage = async (messageData) => {
    console.log('handleSendMessage called with:', messageData);

    let enhancedMessage = messageData?.content;

    // Check if message is asking about logs and fetch them
    if (detectLogQuery(messageData?.content)) {
      console.log('Log query detected, fetching logs...');
      const logsData = await fetchAndFormatLogs(messageData?.content);
      enhancedMessage = `${messageData?.content}${logsData}`;
      console.log('Enhanced message with logs:', enhancedMessage);
    }

    // Auto-create conversation if none exists
    if (!activeConversationId) {
      console.log('No active conversation, creating new one');
      let generatedTitle = 'New Investigation';
      try {
        generatedTitle = await generateConversationTitle(messageData?.content);
      } catch (error) {
        console.error('Failed to generate title, using fallback:', error);
        generatedTitle = `${messageData?.content.split(' ').slice(0, 4).join(' ')}...`;
      }
      console.log('Generated title:', generatedTitle);
      await handleNewConversation(generatedTitle);
      // Wait a bit for conversation creation
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Active conversation ID:', activeConversationId);

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: messageData?.content, // Keep original content for display
      timestamp: new Date(),
      attachments: messageData?.attachments
    };

    console.log('Created user message:', userMessage);

    // Add user message to state
    setMessages(prev => {
      const updatedMessages = [...prev, userMessage];
      console.log('Updated messages with user message:', updatedMessages);
      // Save messages to storage immediately
      if (activeConversationId) {
        saveMessagesToStorage(activeConversationId, updatedMessages);
        console.log('Saved messages to storage');
      }
      return updatedMessages;
    });

    setIsLoading(true);
    console.log('Set loading to true');

    // Try to send message to backend, but don't fail if rate limited
    try {
      await sendMessageToBackend({ ...messageData, content: enhancedMessage });
    } catch (error) {
      console.error('Failed to send message to backend:', error);
      // Show error message but don't break the conversation
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: `I'm currently experiencing high traffic. Please try again in a moment.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }
  };

  const sendMessageToBackend = async (messageData) => {
    // Add a small delay to prevent rapid API calls
    await new Promise(resolve => setTimeout(resolve, 500));

    let agentResponse = null;

    if (preferredEngine === 'ai') {
      // AI Engine: Use Groq directly
      try {
        const conversationHistory = messages.map(msg => ({
          sender: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        agentResponse = await backendService.sendChatMessage(
          messageData?.content,
          conversationHistory,
          {
            conversationId: activeConversationId,
            attachments: messageData?.attachments
          }
        );

        // Transform backend response to match expected format
        agentResponse = {
          reply: agentResponse?.reply || agentResponse?.content || 'Response received.',
          data: agentResponse?.data,
          actions: agentResponse?.actions || []
        };
      } catch (groqError) {
        console.error('AI Engine failed:', groqError.message);
        const errorMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: `AI Engine is unavailable. Please check your connection or switch to SOAR Engine.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsConnected(false);
        setIsLoading(false);
        return;
      }
    } else {
      // SOAR Engine: Use n8n only, no fallback
      try {
        agentResponse = await callN8nAgent({
          message: messageData?.content,
          attachments: (messageData?.attachments || [])?.map(a => ({ name: a?.name, type: a?.type, size: a?.size })),
          conversationId: activeConversationId,
        });
      } catch (n8nError) {
        console.error('SOAR Engine failed:', n8nError.message);
        const errorMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: `SOAR Engine is unavailable. Please check your connection.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsConnected(false);
        setIsLoading(false);
        return;
      }
    }

    const assistantMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      content: agentResponse?.data?.reply || agentResponse?.reply || agentResponse?.content || 'Received.',
      timestamp: new Date(),
      data: agentResponse?.data,
      actions: agentResponse?.data?.actions || agentResponse?.actions || [],
    };

    if (preferredEngine === 'ai') {
      assistantMessage.content += '\n\n*(AI Engine)*';
    } else {
      assistantMessage.content += '\n\n*(SOAR Engine)*';
    }

    console.log('Assistant message created:', assistantMessage);

    // Add assistant message to state
    setMessages(prev => {
      const finalMessages = [...prev, assistantMessage];
      console.log('Final messages with assistant:', finalMessages);

      // Save messages to storage
      if (activeConversationId) {
        saveMessagesToStorage(activeConversationId, finalMessages);
        console.log('Saved final messages to storage');

        // Update conversation metadata
        const updatedConversations = conversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              lastActivity: new Date(),
              messageCount: finalMessages.length,
              summary: assistantMessage.content.length > 100
                ? assistantMessage.content.substring(0, 97) + '...'
                : assistantMessage.content
            };
          }
          return conv;
        });
        setConversations(updatedConversations);
        saveConversationsToStorage(updatedConversations);
        console.log('Updated conversation metadata');
      }

      return finalMessages;
    });

    setIsLoading(false);
    console.log('Set loading to false');
  };

  const handleEngineChange = (engine) => {
    setPreferredEngine(engine);
    localStorage.setItem('preferredEngine', engine);
  };

  const handleActionClick = async (actionType, actionData) => {
    // Handle self-enhancement actions with confirmation
    if (['analyze_codebase', 'suggest_security_improvement', 'suggest_feature', 'fix_bug', 'modify_code'].includes(actionType)) {
      const confirmed = window.confirm(
        `This action will ${actionType.replace('_', ' ')} the system. Are you sure you want to proceed?`
      );
      if (!confirmed) return;
    }

    // Handle n8n options by sending them as a new message
    if (actionType === 'n8n_option') {
      const optionMessage = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: actionData, // The option text
        timestamp: new Date()
      };

      setMessages(prev => [...prev, optionMessage]);
      setIsLoading(true);

      // Send the option as a new message to n8n
      try {
        const agentResponse = await callN8nAgent({
          message: actionData,
          conversationId: activeConversationId,
        });

        const assistantMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: agentResponse?.data?.reply || agentResponse?.reply || agentResponse?.content || 'Received.',
          timestamp: new Date(),
          data: agentResponse?.data,
          actions: agentResponse?.data?.actions || agentResponse?.actions || [],
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error sending n8n option:', error);
        const errorMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: `Failed to process option: ${actionData}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
      return;
    }

    const actionMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: `Execute ${actionType} action for ${actionData}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsLoading(true);

    let result = null;

    try {
      // Handle self-enhancement actions via backend
      if (['analyze_codebase', 'suggest_security_improvement', 'suggest_feature', 'fix_bug', 'modify_code'].includes(actionType)) {
        result = await handleSelfEnhancementAction(actionType, actionData);
      } else {
        // Use n8n for other actions
        result = await callN8nAgent({
          action: actionType,
          data: actionData,
          conversationId: activeConversationId,
        });
      }
    } catch (n8nError) {
      console.error('N8n action failed:', n8nError.message);
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: `SOAR Engine is unavailable. Cannot execute action.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
      setIsLoading(false);
      return;
    }

    const responseMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      content: result?.reply || `Action "${actionType}" executed.`,
      timestamp: new Date(),
      data: result?.data,
      actions: result?.actions,
    };



    setMessages(prev => [...prev, responseMessage]);
    setIsLoading(false);
  };

  const handleSelfEnhancementAction = async (actionType, actionData) => {
    try {
      // For development/testing, allow self-enhancement actions without authentication
      const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      const token = localStorage.getItem('authToken');

      if (!token && !isDevelopment) {
        throw new Error('Authentication required for self-enhancement actions');
      }

      // Skip authentication headers in development mode
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let endpoint = '';
      let payload = {};

      switch (actionType) {
        case 'analyze_codebase':
          endpoint = '/ai/self-enhance/analyze';
          break;
        case 'suggest_security_improvement':
          endpoint = '/ai/self-enhance/generate';
          payload = { requirement: `Suggest security improvements for: ${actionData?.query || 'the system'}` };
          break;
        case 'suggest_feature':
          endpoint = '/ai/self-enhance/generate';
          payload = { requirement: `Suggest new features for: ${actionData?.query || 'the system'}` };
          break;
        case 'fix_bug':
          endpoint = '/ai/self-enhance/fix-bug';
          payload = { bug_description: actionData?.query || 'Fix identified bugs' };
          break;
        case 'modify_code':
          endpoint = '/ai/self-enhance/modify';
          payload = {
            file_path: actionData?.file_path || 'auto-detect',
            modification_request: actionData?.query || 'Apply requested modifications'
          };
          break;
        default:
          throw new Error(`Unknown self-enhancement action: ${actionType}`);
      }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Self-enhancement action failed');
      }

      const result = await response.json();

      // Format the response for display
      let reply = '';
      let data = null;

      if (actionType === 'analyze_codebase' && result.success) {
        const analysis = result.data;
        reply = `Codebase Analysis Complete:\n\n` +
                `📁 Files Analyzed: ${analysis.files_analyzed}\n` +
                `📝 Total Lines: ${analysis.total_lines}\n` +
                `💻 Languages: ${Object.keys(analysis.languages).join(', ')}\n\n` +
                `🔍 Potential Improvements: ${analysis.potential_improvements?.length || 0}\n` +
                `🛡️ Security Issues: ${analysis.security_issues?.length || 0}\n` +
                `⚡ Performance Issues: ${analysis.performance_issues?.length || 0}\n` +
                `🐛 Code Quality Issues: ${analysis.code_quality_issues?.length || 0}`;

        data = {
          type: 'self_enhancement',
          options: [
            {
              title: 'View Detailed Analysis',
              description: 'See specific improvement suggestions',
              action: 'view_analysis_details',
              data: analysis,
              label: 'View Details'
            }
          ]
        };
      } else if (result.success) {
        reply = `Self-enhancement action completed successfully. ${result.data?.message || ''}`;
        if (result.data?.files_to_create || result.data?.files_to_modify) {
          reply += '\n\n📝 Changes ready for review. Would you like to apply them?';
          data = {
            type: 'self_enhancement',
            options: [
              {
                title: 'Apply Changes',
                description: 'Implement the suggested modifications',
                action: 'apply_changes',
                data: result.data,
                label: 'Apply'
              }
            ]
          };
        }
      } else {
        reply = `Self-enhancement action failed: ${result.error || 'Unknown error'}`;
      }

      return {
        reply,
        data,
        actions: []
      };

    } catch (error) {
      console.error('Self-enhancement action error:', error);
      return {
        reply: `Failed to execute self-enhancement action: ${error.message}`,
        data: null,
        actions: []
      };
    }
  };

  const handleFileUpload = (files) => {
    console.log('Files uploaded:', files);
  };

  const handleConversationSelect = (conversationId) => {
    setActiveConversationId(conversationId);
    loadConversationMessagesFromStorage(conversationId);
  };

  const handleNewConversation = () => {
    setIsNewConversationModalOpen(true);
  };

  const handleCreateConversation = async (title, topic, initialMessage = '') => {
    console.log('handleCreateConversation called with:', { title, topic, initialMessage });

    const newConversationId = `conv-${Date.now()}`;

    const newConversation = {
      id: newConversationId,
      title: title,
      summary: initialMessage ? `${initialMessage.substring(0, 50)}${initialMessage.length > 50 ? '...' : ''}` : 'New security investigation started',
      lastActivity: new Date(),
      messageCount: 0,
      status: 'active',
      topic: topic
    };

    console.log('New conversation object:', newConversation);

    const updatedConversations = [newConversation, ...conversations];
    console.log('Updated conversations:', updatedConversations);

    setConversations(updatedConversations);
    setActiveConversationId(newConversationId);
    setMessages([]);

    // Save to storage
    saveConversationsToStorage(updatedConversations);
    console.log('Saved conversations to storage');

    if (initialMessage) {
      console.log('Scheduling initial message send');
      // Add delay to prevent immediate API call after conversation creation
      setTimeout(() => {
        console.log('Sending initial message');
        handleSendMessage({
          content: initialMessage,
          timestamp: new Date(),
          attachments: []
        });
      }, 1000); // Increased delay to 1 second
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    // Remove from localStorage
    localStorage.removeItem(`chat_messages_${conversationId}`);

    const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
    setConversations(updatedConversations);
    saveConversationsToStorage(updatedConversations);

    if (activeConversationId === conversationId) {
      if (updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
        loadConversationMessagesFromStorage(updatedConversations[0].id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  };

  const handleExportConversation = (conversationId) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      const exportData = {
        conversation,
        messages: conversationId === activeConversationId ? messages : []
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversation.title.replace(/\s+/g, '-')?.toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleGeneratePDFReport = async (conversationId) => {
    try {
      const conversation = conversations.find(conv => conv.id === conversationId);
      if (!conversation) return;

      const conversationData = {
        id: conversationId,
        title: conversation.title,
        messages: conversationId === activeConversationId ? messages.map(msg => ({
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          data: msg.data,
          actions: msg.actions
        })) : []
      };

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to generate PDF reports');
        return;
      }

      // Call backend to generate PDF
      const response = await fetch('http://localhost:5000/chatbot/pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationData,
          analysisData: {
            threats: [],
            recommendations: []
          }
        })
      });

      if (response.ok) {
        // Download the PDF
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-chatbot-report-${conversationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert(`Failed to generate PDF report: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      <div className="flex pt-16">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 lg:ml-60 flex">
          <ConversationSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onExportConversation={handleExportConversation}
            onGeneratePDFReport={handleGeneratePDFReport}
            recentAlerts={mockRecentAlerts}
            isCollapsed={isConversationSidebarCollapsed}
            onToggleCollapse={() => setIsConversationSidebarCollapsed(!isConversationSidebarCollapsed)}
          />

          <NewConversationModal
            isOpen={isNewConversationModalOpen}
            onClose={() => setIsNewConversationModalOpen(false)}
            onCreate={handleCreateConversation}
          />

          <div className="flex-1 flex flex-col h-screen">
            {/* Engine Toggle */}
            <div className="bg-background border-b border-border px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground">Processing Engine:</span>
                <Select
                  value={preferredEngine}
                  onChange={handleEngineChange}
                  options={[
                    { value: 'soar', label: 'Pro Engine' },
                    { value: 'ai', label: 'AI Engine' }
                  ]}
                  className="w-48"
                />
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-muted-foreground">
                  {preferredEngine === 'soar' ? 'SOAR' : 'AI'} Engine {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            <ChatArea
              messages={messages}
              isLoading={isLoading}
              isConnected={isConnected}
              onActionClick={handleActionClick}
              onExpandToggle={() => {}}
              conversationTitle={activeConversation?.title}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              isConnected={isConnected}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityChatbot;
