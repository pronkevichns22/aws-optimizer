// ============================================================================
// FILE: AIAdvisor.tsx (Updated - with User Context Integration)
// LOCATION: client/src/components/
// PURPOSE: AI advisor component with chat history persistence
// ============================================================================

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ChevronDown, ChevronUp, Zap, Send, Maximize2 } from 'lucide-react';
import { useAWS } from '../context/AWSContext';
import * as aiService from '../services/ai-service';

const AIAdvisorModal = lazy(() => import('./AIAdvisorModal'));

const LOGIN_STYLE = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 };
const LOGIN_LIGHT = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 };

const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*/g, '')
    .replace(/##/g, '')
    .replace(/###/g, '')
    .replace(/####/g, '')
    .trim();
};

interface AIRecommendation {
  summary: string;
  recommendations: string[];
  estimatedSavings?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatSession {
  chatSessionId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  context?: {
    resourceCount?: number;
    totalCost?: number;
    alertCount?: number;
  };
}

interface AIAdvisorProps {
  alerts?: any[];
  data?: any;
  resourceCount?: number;
  totalCost?: number;
  onAIModalStateChange?: (isOpen: boolean) => void;
}

// ========== Main AI Advisor Component ==========
export const AIAdvisor: React.FC<AIAdvisorProps> = ({
  alerts = [],
  resourceCount = 0,
  totalCost = 0,
  onAIModalStateChange,
}) => {
  const { token, isAuthenticated } = useAWS();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(() => {
    // Load from localStorage on init
    return localStorage.getItem('currentChatId') || '';
  });
  const loadedChats = useRef<Set<string>>(new Set());
  const [showDetailedAdvice, setShowDetailedAdvice] = useState(false);

  // Load chats from server on component mount
  useEffect(() => {
    if (isAuthenticated && token) {
      loadUserChats();
    }
  }, [isAuthenticated, token]);

  // Save currentChatId to localStorage whenever it changes
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('currentChatId', currentChatId);
    }
  }, [currentChatId]);

  // Load chat messages when currentChatId changes
  useEffect(() => {
    if (currentChatId && token && !loadedChats.current.has(currentChatId)) {
      loadChatMessages(currentChatId);
      loadedChats.current.add(currentChatId);
    }
  }, [currentChatId, token]);

  // Notify parent when modal state changes
  useEffect(() => {
    onAIModalStateChange?.(isModalOpen);
  }, [isModalOpen, onAIModalStateChange]);

  const loadUserChats = async () => {
    try {
      const data = await aiService.getUserChats(token!, 50, 0);
      const chats: ChatSession[] = data.chats.map((chat: any) => ({
        chatSessionId: chat.chatSessionId,
        title: chat.title,
        messages: [],
        createdAt: chat.createdAt,
        context: chat.context,
      }));

      if (chats.length === 0) {
        const newChat = await aiService.createChatSession(token!, 'First Chat');
        setChatSessions([{
          chatSessionId: newChat.chatSessionId,
          title: newChat.title,
          messages: [],
          createdAt: newChat.createdAt,
        }]);
        setCurrentChatId(newChat.chatSessionId);
      } else {
        setChatSessions(chats);
        const prevChatId = localStorage.getItem('currentChatId') || '';
        const existingChat = chats.find(c => c.chatSessionId === prevChatId);
        const chatIdToUse = existingChat ? prevChatId : chats[0].chatSessionId;
        setCurrentChatId(chatIdToUse);
        // Clear loaded chats to trigger reload
        loadedChats.current.delete(chatIdToUse);
        
        // Try to load messages from localStorage for this chat
        const cachedMessages = localStorage.getItem(`chat_${chatIdToUse}_messages`);
        if (cachedMessages) {
          try {
            const messages = JSON.parse(cachedMessages);
            setChatSessions(prev =>
              prev.map(c =>
                c.chatSessionId === chatIdToUse
                  ? { ...c, messages }
                  : c
              )
            );
          } catch (err) {
            console.error('Failed to parse cached messages from localStorage:', err);
          }
        }
      }
    } catch (err: any) {
      console.error('[AIAdvisor] Failed to load chats:', err);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const chatData = await aiService.getChatHistory(token!, chatId);
      const messages = chatData.messages || [];
      // Cache to localStorage for quick access
      localStorage.setItem(`chat_${chatId}_messages`, JSON.stringify(messages));
      setChatSessions(prev =>
        prev.map(c =>
          c.chatSessionId === chatId
            ? { ...c, messages }
            : c
        )
      );
    } catch (err: any) {
      console.error('[DEBUG] Failed to load chat messages:', err);
    }
  };

  const getCurrentChat = (): ChatSession | undefined =>
    chatSessions.find(c => c.chatSessionId === currentChatId);

  const currentChat = getCurrentChat();

  // Fetch recommendations when alerts change
  useEffect(() => {
    if (alerts && alerts.length > 0 && isAuthenticated) {
      fetchRecommendations(false);
    }
  }, [alerts, isAuthenticated]);

  const fetchRecommendations = async (detailed: boolean = false) => {
    if (!token) return;

    try {
      setLoading(true);

      const rec = await aiService.getAIRecommendations(token, alerts, detailed);
      setRecommendation(rec);
      if (detailed) setShowDetailedAdvice(true);
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string = userInput) => {
    if (!message.trim() || !currentChat || !token) return;

    setUserInput('');

    // Add user message to UI immediately
    const newMessage = { role: 'user' as const, content: message };
    setChatSessions(prev => {
      const updated = prev.map(c =>
        c.chatSessionId === currentChatId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
            }
          : c
      );
      // Cache to localStorage
      const chat = updated.find(c => c.chatSessionId === currentChatId);
      if (chat) {
        localStorage.setItem(`chat_${currentChatId}_messages`, JSON.stringify(chat.messages));
      }
      return updated;
    });

    try {
      setLoading(true);

      // Save user message to server first (don't wait for AI response to fail)
      try {
        await aiService.addMessageToChat(token, currentChatId, 'user', message);
      } catch (err: any) {
        console.error('Failed to save user message:', err);
        // Continue anyway - message is in UI
      }

      // Get AI response
      try {
        const response = await aiService.sendAIMessage(
          token,
          currentChatId,
          message,
          {
            resourceCount,
            totalCost,
          }
        );

        // Add AI response to UI
        const aiMessage = { role: 'assistant' as const, content: response.response };
        setChatSessions(prev => {
          const updated = prev.map(c =>
            c.chatSessionId === currentChatId
              ? {
                  ...c,
                  messages: [...c.messages, aiMessage],
                }
              : c
          );
          // Cache to localStorage
          const chat = updated.find(c => c.chatSessionId === currentChatId);
          if (chat) {
            localStorage.setItem(`chat_${currentChatId}_messages`, JSON.stringify(chat.messages));
          }
          return updated;
        });

        // Save AI response to server
        try {
          await aiService.addMessageToChat(token, currentChatId, 'assistant', response.response);
        } catch (err: any) {
          console.error('Failed to save AI response:', err);
          // Response is in UI even if save failed
        }

        // Auto-generate title from first message if still "New Chat"
        if (currentChat.title === 'New Chat') {
          const title = aiService.extractChatTopic(message);
          try {
            await aiService.updateChatTitle(token, currentChatId, title);
            setChatSessions(prev =>
              prev.map(c =>
                c.chatSessionId === currentChatId
                  ? { ...c, title }
                  : c
              )
            );
          } catch (err: any) {
            console.error('Failed to update chat title:', err);
          }
        }
      } catch (err: any) {
        console.error('Failed to get AI response:', err);
        const errorMessage = err.message || 'Failed to get AI response. Please try again.';
        const errorMsg = { role: 'assistant' as const, content: `Error: ${errorMessage}` };
        setChatSessions(prev => {
          const updated = prev.map(c =>
            c.chatSessionId === currentChatId
              ? {
                  ...c,
                  messages: [...c.messages, errorMsg],
                }
              : c
          );
          // Cache to localStorage
          const chat = updated.find(c => c.chatSessionId === currentChatId);
          if (chat) {
            localStorage.setItem(`chat_${currentChatId}_messages`, JSON.stringify(chat.messages));
          }
          return updated;
        });

        // Save error message to server
        try {
          await aiService.addMessageToChat(token, currentChatId, 'assistant', `Error: ${errorMessage}`);
        } catch (err: any) {
          console.error('Failed to save error message:', err);
        }
      }
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

  if (!isAuthenticated || !token) {
    return (
      <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-6 text-center">
        <p className="text-[#818CA2]">Please log in to use AI Advisor</p>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-6 text-center">
        <Loader2 size={24} className="animate-spin mx-auto text-[#47B2FF] mb-2" />
        <p className="text-[#818CA2] text-sm">Loading AI Advisor...</p>
      </div>
    );
  }

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
                setIsModalOpen(true);
              }}
              className="text-[#818CA2] hover:text-white transition-colors p-1 hover:bg-[#1C1D25] rounded"
              title="Expand to fullscreen"
            >
              <Maximize2 size={18} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-[#818CA2] hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <>
            <div className="flex-1 flex flex-col gap-3 p-5 pr-3 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(520px - 120px)' }}>
              {currentChat.messages.length > 0 ? (
                <div className="space-y-3">
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
              ) : recommendation ? (
                <>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-[16px] border h-[44px] ${getPriorityColor(recommendation.priority)}`} style={LOGIN_LIGHT}>
                    <Zap size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {recommendation.priority}
                    </span>
                  </div>

                  <div className="bg-[#1f2029] rounded-[16px] p-4 border border-[#242732]" style={LOGIN_LIGHT}>
                    <p className="text-sm text-[#C5D0DC] leading-relaxed">
                      {cleanMarkdown(recommendation.summary)}
                    </p>
                  </div>

                  {showDetailedAdvice && (
                    <div>
                      <h4 className="text-xs font-bold uppercase text-[#818CA2] tracking-wide mb-3" style={LOGIN_LIGHT}>
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {recommendation.recommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="flex gap-3 text-sm text-[#C5D0DC] bg-[#1f2029] p-3 rounded-[16px] border border-[#242732] items-start"
                            style={LOGIN_LIGHT}
                          >
                            <span className="text-[#1a85ff] font-bold flex-shrink-0" style={LOGIN_STYLE}>{idx + 1}.</span>
                            <span className="break-words">{cleanMarkdown(rec)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <Zap size={32} className="text-[#1a85ff] opacity-50" />
                  <span className="text-sm text-[#818CA2]" style={LOGIN_LIGHT}>
                    {alerts.length === 0 ? 'No alerts to analyze' : 'Run a scan to get recommendations'}
                  </span>
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
                >
                  <Send size={18} className="rotate-45" />
                </button>
              </div>
              <p className="text-xs text-[#818CA2] mt-2 text-center" style={LOGIN_LIGHT}>
                💬 {currentChat.messages.length} messages
              </p>
            </div>
          </>
        )}
      </div>

      {/* AI Advisor Modal - Using Portal to render at document root */}
      {isModalOpen && createPortal(
        <Suspense fallback={null}>
          <AIAdvisorModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            alerts={alerts}
            resourceCount={resourceCount}
            totalCost={totalCost}
            infrastructureContext="AI Advisor"
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            onChatSessionsChange={setChatSessions}
            onCurrentChatIdChange={setCurrentChatId}
          />
        </Suspense>,
        document.body
      )}
      <style>{`
        /* Hide scrollbars */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};
