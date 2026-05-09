// ============================================================================
// FILE: AIAdvisor.tsx
// LOCATION: client/src/components/
// PURPOSE: AI advisor component powered by Groq for AWS recommendations
// ============================================================================

import { useState, useEffect, useRef, useEffect as useLayoutEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp, Zap, TrendingDown, AlertCircle, Send, Maximize2, X, Plus, Trash2, MessageSquare } from 'lucide-react';
import axios from 'axios';

// Стили
const LOGIN_STYLE = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 };
const LOGIN_LIGHT = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 };

// Context window limit: max messages to keep in history (last 3 exchanges = 6 messages)
const MAX_CHAT_HISTORY_MESSAGES = 6;

// Очистка markdown форматирования - если AI все равно его использует
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, '') // Remove **bold**
    .replace(/##/g, '')   // Remove ##
    .replace(/###/g, '')  // Remove ###
    .replace(/####/g, '') // Remove ####
    .trim();
};

interface AIRecommendation {
  summary: string;
  recommendations: string[];
  estimatedSavings?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface ChatSession {
  id: string;
  name: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  createdAt: Date;
}

interface AIAdvisorProps {
  alerts?: any[];
  data?: any;
  resourceCount?: number;
  totalCost?: number;
  onOpenModal?: () => void;
}

// ========== Full Screen Chat Component (Google AI Studio Style) ==========
const FullScreenChat: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentChat: ChatSession;
  allChats: ChatSession[];
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onSendMessage: (message: string) => Promise<void>;
  alerts: any[];
  resourceCount: number;
  totalCost: number;
  loading: boolean;
}> = ({
  isOpen,
  onClose,
  currentChat,
  allChats,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onSendMessage,
  alerts,
  resourceCount,
  totalCost,
  loading
}) => {
  const [userInput, setUserInput] = useState('');

  if (!isOpen) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      const main = document.querySelector('main');
      if (main) (main as HTMLElement).style.filter = 'none';
    }
    return null;
  }

  // Prevent scrolling and hide main content when modal is open
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    const main = document.querySelector('main');
    if (main) (main as HTMLElement).style.filter = 'blur(2px)';
  }

  const handleSend = async () => {
    if (!userInput.trim()) return;
    const message = userInput;
    setUserInput('');
    await onSendMessage(message);
  };

  return (
    <>
      {/* Backdrop - полностью закрывает всё */}
      <div 
        className="fixed inset-0 z-[9999] bg-black pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Main Container */}
      <div className="fixed inset-0 z-[10000] flex flex-col bg-[#0A0E18] pointer-events-none">
        {/* Header */}
        <div className="h-12 border-b border-[#1E2635] bg-[#0A0E18] flex items-center justify-between px-6 flex-shrink-0 pointer-events-auto">
          <span className="text-white font-bold text-sm" style={LOGIN_STYLE}>💬 AI ADVISOR</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#1E2635] p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content - sidebar + chat */}
        <div className="flex flex-1 overflow-hidden w-full pointer-events-auto">
          {/* Left Sidebar */}
          <div className="w-64 border-r border-[#1E2635] bg-[#060809] flex flex-col flex-shrink-0 overflow-hidden pointer-events-auto">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#1E2635] flex-shrink-0">
              <button
                onClick={onNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-bold transition-colors"
                style={LOGIN_STYLE}
              >
                <Plus size={18} />
                New Chat
              </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
              {allChats.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Zap size={24} className="text-gray-600" />
                  <p className="text-xs text-gray-500 text-center" style={LOGIN_LIGHT}>No chats yet</p>
                </div>
              ) : (
                allChats.map((chat, idx) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all group ${
                      chat.id === currentChat.id
                        ? 'bg-blue-600/30 border border-blue-500/50 text-blue-100 shadow-lg shadow-blue-600/20'
                        : 'text-gray-300 hover:bg-[#1E2635] border border-transparent'
                    }`}
                    style={LOGIN_LIGHT}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 truncate flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">{idx + 1}.</span>
                        <span className="truncate font-medium">{chat.name}</span>
                      </div>
                      {chat.messages.length > 0 && (
                        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300 ml-2">
                          {chat.messages.length}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Sidebar Footer - Stats */}
            <div className="p-4 border-t border-[#1E2635] bg-[#0A0E18] space-y-3 flex-shrink-0">
              <div className="text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Resources:</span>
                  <span className="font-bold text-blue-400">{resourceCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Cost:</span>
                  <span className="font-bold text-green-400">${totalCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Alerts:</span>
                  <span className="font-bold text-red-400">{alerts.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Chat Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#0A0E18] to-[#0F1219] pointer-events-auto overflow-hidden">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto flex flex-col px-6 py-6 gap-6">
              {currentChat.messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center">
                    <Zap size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl text-white font-bold mb-2" style={LOGIN_STYLE}>
                      Start chatting
                    </h2>
                    <p className="text-sm text-gray-400 max-w-sm" style={LOGIN_LIGHT}>
                      Ask me anything about your AWS infrastructure, costs, security, or optimization recommendations
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentChat.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                      <div
                        className={`max-w-2xl px-5 py-3 rounded-xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'bg-[#1E2635] text-gray-200 border border-[#2A3544]'
                        }`}
                        style={LOGIN_LIGHT}
                      >
                        <p className="whitespace-pre-wrap break-words">{cleanMarkdown(msg.content)}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1E2635] border border-[#2A3544] rounded-xl px-5 py-3 flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin text-blue-400" />
                        <span className="text-sm text-gray-400" style={LOGIN_LIGHT}>AI is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#1E2635] px-6 py-4 bg-[#0A0E18] flex-shrink-0">
              <div className="flex gap-3 items-end">
                <input
                  type="text"
                  placeholder="Ask about infrastructure, costs, security..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 bg-[#1E2635] hover:bg-[#242C38] border border-[#2A3544] focus:border-blue-500 rounded-xl px-5 py-3 text-sm text-white placeholder-gray-500 outline-none transition-colors resize-none"
                  style={LOGIN_STYLE}
                  rows={1}
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!userInput.trim() || loading}
                  className="p-3 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 rounded-xl transition-colors flex-shrink-0 disabled:cursor-not-allowed"
                  title="Send (Enter)"
                >
                  <Send size={20} className="rotate-45" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500 px-2" style={LOGIN_LIGHT}>
                <span>💬 {currentChat.messages.length} messages • {allChats.length} chats</span>
                <span>Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ========== AI Advisor Component ==========
export const AIAdvisor: React.FC<AIAdvisorProps> = ({ alerts = [], resourceCount = 0, totalCost = 0, onOpenModal }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [showDetailedAdvice, setShowDetailedAdvice] = useState(false);

  // Initialize chat sessions
  useEffect(() => {
    const saved = localStorage.getItem('ai-chat-sessions');
    if (saved) {
      try {
        const sessions: ChatSession[] = JSON.parse(saved);
        setChatSessions(sessions);
        if (sessions.length > 0) {
          setCurrentChatId(sessions[0].id);
        } else {
          createNewChat();
        }
      } catch (e) {
        console.error('Failed to load chat sessions:', e);
        createNewChat();
      }
    } else {
      createNewChat();
    }
  }, []);

  // Save chat sessions to localStorage
  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem('ai-chat-sessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      name: `Chat ${chatSessions.length + 1}`,
      messages: [],
      createdAt: new Date()
    };
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id: string) => {
    const updated = chatSessions.filter(c => c.id !== id);
    if (updated.length === 0) {
      createNewChat();
    } else {
      setChatSessions(updated);
      if (currentChatId === id) {
        setCurrentChatId(updated[0].id);
      }
    }
  };

  const getCurrentChat = () => chatSessions.find(c => c.id === currentChatId);
  const currentChat = getCurrentChat();

  // Fetch recommendations when alerts change
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      fetchRecommendations();
    }
  }, [alerts]);

  const fetchRecommendations = async (detailed: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      
      const response = await axios.post(`${serverUrl}/api/ai-recommendations`, {
        alerts: alerts.slice(0, 10),
        detailed: detailed
      });

      if (response.data.success) {
        setRecommendation(response.data.data);
        if (detailed) setShowDetailedAdvice(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      
      if (alerts.length > 0) {
        const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
        const summary = detailed 
          ? `Found ${alerts.length} issues: ${criticalCount} critical, ${alerts.length - criticalCount} other.`
          : `${alerts.length} issues found. Click button for details.`;
        
        setRecommendation({
          summary,
          recommendations: detailed
            ? [
                'Address CRITICAL security alerts first',
                'Delete unused resources to reduce costs',
                'Configure Security Groups properly',
                'Enable encryption on data volumes'
              ]
            : ['View details in Security tab'],
          priority: alerts.some(a => a.severity === 'CRITICAL') ? 'URGENT' : 'HIGH',
        });
        if (detailed) setShowDetailedAdvice(true);
      }
      
      setError(err.response?.data?.message || 'Using offline recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string = userInput) => {
    if (!message.trim() || !currentChat) return;
    
    setUserInput('');
    
    // Add user message
    setChatSessions(prev => prev.map(c => 
      c.id === currentChatId 
        ? { ...c, messages: [...c.messages, { role: 'user' as const, content: message }] }
        : c
    ));
    
    try {
      setLoading(true);
      
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const limitedHistory = currentChat.messages.slice(-MAX_CHAT_HISTORY_MESSAGES);
      
      const response = await axios.post(`${serverUrl}/api/ai-message`, {
        message,
        chatHistory: limitedHistory,
        alerts,
        resourceCount,
        totalCost
      });

      if (response.data.success) {
        setChatSessions(prev => prev.map(c =>
          c.id === currentChatId
            ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: response.data.data.response }] }
            : c
        ));
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const errorMessage = err.response?.data?.message || 'Failed to get AI response';
      setChatSessions(prev => prev.map(c =>
        c.id === currentChatId
          ? { ...c, messages: [...c.messages, { role: 'assistant' as const, content: `Error: ${errorMessage}` }] }
          : c
      ));
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default:
        return 'bg-green-500/20 border-green-500/50 text-green-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle size={16} />;
      case 'HIGH':
        return <TrendingDown size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  if (!currentChat) return null;

  return (
    <>
      <div
        className="flex flex-col bg-[#13141B] border border-[#242732] rounded-[16px] overflow-hidden shadow-lg"
        style={{ height: isExpanded ? '520px' : 'auto', maxHeight: '520px' }}
      >
        {/* Header */}
        <div
          className="p-5 border-b border-[#242732] flex justify-between items-center hover:bg-[#1C1D25]/50 transition-colors cursor-pointer flex-shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          style={LOGIN_LIGHT}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-[#818CA2] text-xs font-bold tracking-widest uppercase">AI Advisor</span>
            <div className="text-[#1a85ff] text-[9px] font-bold px-2 py-1 rounded-full bg-[#1a85ff]/10 border border-[#1a85ff]/30">
              POWERED BY GROQ
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal ? onOpenModal() : setIsFullScreen(true);
              }}
              className="p-2 text-[#818CA2] hover:text-white hover:bg-[#242732] rounded-lg transition-colors"
              title="Open fullscreen"
            >
              <Maximize2 size={18} />
            </button>
            <button className="text-[#818CA2] hover:text-white transition-colors">
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <>
            <div className="flex-1 flex flex-col gap-3 p-5 pr-3 overflow-y-auto max-h-80" style={{ maxHeight: 'calc(520px - 120px)' }}>
              {currentChat.messages.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {currentChat.messages
                    .slice(-10)
                    .map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-[16px] border ${
                            msg.role === 'user'
                              ? 'bg-[#1a85ff]/20 border-[#1a85ff]/50 text-[#C5D0DC]'
                              : 'bg-[#1f2029] border-[#242732] text-[#C5D0DC]'
                          }`}
                          style={LOGIN_LIGHT}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{cleanMarkdown(msg.content)}</p>
                        </div>
                      </div>
                    ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-[#1f2029] border border-[#242732] rounded-[16px] px-4 py-2">
                        <Loader2 size={16} className="animate-spin text-[#1a85ff]" />
                      </div>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <Loader2 size={28} className="animate-spin text-[#1a85ff]" />
                  <span className="text-sm text-[#818CA2]" style={LOGIN_LIGHT}>Analyzing...</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-[16px] p-4">
                  <p className="text-sm text-red-400" style={LOGIN_LIGHT}>{error}</p>
                  <button
                    onClick={fetchRecommendations}
                    className="mt-3 w-full px-3 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-[16px] text-red-400 text-xs font-bold uppercase transition-colors h-[40px]"
                    style={LOGIN_STYLE}
                  >
                    Retry
                  </button>
                </div>
              ) : recommendation ? (
                <>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-[16px] border h-[44px] ${getPriorityColor(recommendation.priority)}`} style={LOGIN_LIGHT}>
                    {getPriorityIcon(recommendation.priority)}
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {recommendation.priority}
                    </span>
                  </div>

                  <div className="bg-[#1f2029] rounded-[16px] p-4 border border-[#242732]" style={LOGIN_LIGHT}>
                    <p className="text-sm text-[#C5D0DC] leading-relaxed break-words whitespace-pre-wrap">
                      {cleanMarkdown(recommendation.summary)}
                    </p>
                  </div>

                  {showDetailedAdvice && (
                    <>
                      {recommendation.estimatedSavings && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-[16px] p-4">
                          <p className="text-xs text-[#818CA2] uppercase font-bold tracking-wide" style={LOGIN_LIGHT}>Estimated Savings</p>
                          <p className="text-lg font-black text-green-400 mt-2" style={LOGIN_STYLE}>
                            {recommendation.estimatedSavings}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold uppercase text-[#818CA2] tracking-wide mb-3" style={LOGIN_LIGHT}>
                          Detailed Actions
                        </h4>
                        <ul className="space-y-2">
                          {recommendation.recommendations.map((rec, idx) => (
                            <li
                              key={idx}
                              className="flex gap-3 text-sm text-[#C5D0DC] bg-[#1f2029] p-3 rounded-[16px] border border-[#242732] hover:border-[#1a85ff]/50 transition-colors items-start"
                              style={LOGIN_LIGHT}
                            >
                              <span className="text-[#1a85ff] font-bold flex-shrink-0" style={LOGIN_STYLE}>{idx + 1}.</span>
                              <span className="break-words">{cleanMarkdown(rec)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => {
                      if (showDetailedAdvice) {
                        setShowDetailedAdvice(false);
                      } else {
                        fetchRecommendations(true);
                      }
                    }}
                    className={`mt-2 w-full px-3 py-3 rounded-[16px] text-xs font-bold uppercase transition-colors h-[44px] border ${
                      showDetailedAdvice
                        ? 'bg-[#242732] hover:bg-[#2a2d38] border-[#242732] text-[#818CA2]'
                        : 'bg-[#1a85ff] hover:bg-[#439AFF] border-[#1a85ff] text-white'
                    }`}
                    style={LOGIN_STYLE}
                  >
                    {showDetailedAdvice ? 'Hide Details' : 'Get Advice'}
                  </button>
                </>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Zap size={32} className="text-[#1a85ff] opacity-50" />
                  <span className="text-sm text-[#818CA2]" style={LOGIN_LIGHT}>No alerts to analyze</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <button
                    onClick={fetchRecommendations}
                    className="px-6 py-3 bg-[#1a85ff] hover:bg-[#439AFF] border border-[#1a85ff] rounded-[16px] text-white text-sm font-bold uppercase transition-colors h-[44px]"
                    style={LOGIN_STYLE}
                  >
                    Get Recommendations
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#242732] bg-[#0B0C10]/20 flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#1f2029] border border-[#242732] rounded-[16px] p-2 hover:border-[#1a85ff]/50 focus-within:border-[#1a85ff] transition-colors h-[44px]">
                <input
                  type="text"
                  placeholder="Ask about infrastructure..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-transparent border-none outline-none text-sm text-[#C5D0DC] placeholder-[#818CA2] font-medium"
                  style={LOGIN_STYLE}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || loading}
                  className="p-2 text-[#1a85ff] hover:text-white hover:bg-[#1a85ff]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send question"
                >
                  <Send size={18} className="rotate-45" />
                </button>
              </div>
              <p className="text-xs text-[#818CA2] mt-2 text-center" style={LOGIN_LIGHT}>💡 {currentChat.messages.length} messages | {chatSessions.length} chat{chatSessions.length !== 1 ? 's' : ''}</p>
            </div>
          </>
        )}
      </div>

      {/* Full Screen Modal */}
      <FullScreenChat
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        currentChat={currentChat}
        allChats={chatSessions}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        onSendMessage={handleSendMessage}
        alerts={alerts}
        resourceCount={resourceCount}
        totalCost={totalCost}
        loading={loading}
      />
    </>
  );
};