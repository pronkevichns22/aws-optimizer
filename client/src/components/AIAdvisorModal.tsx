// ============================================================================
// FILE: AIAdvisorModal.tsx
// LOCATION: client/src/components/
// PURPOSE: Premium AI Advisor Modal - Centered dialog with proper z-index
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Plus, Trash2, MessageSquare, Zap, Loader2 } from 'lucide-react';
import axios from 'axios';

const LOGO_STYLE = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 };
const TEXT_STYLE = { fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 };

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: any[];
  resourceCount?: number;
  totalCost?: number;
  infrastructureContext?: string;
}

// Utility: Format markdown in messages (basic formatting)
const formatMessageContent = (content: string): string => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
    .replace(/__(.*?)__/g, '$1') // Remove markdown underline
    .replace(/`(.*?)`/g, '$1') // Remove inline code backticks
    .trim();
};

// ============================================================================
// CHAT HISTORY SIDEBAR
// ============================================================================
const ChatHistorySidebar: React.FC<{
  chats: ChatSession[];
  activeId: string;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
}> = ({ chats, activeId, onSelectChat, onNewChat, onDeleteChat }) => {
  return (
    <div className="w-72 bg-[#181921] border-r border-[#242732] flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-[#242732] flex-shrink-0">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-lg text-white text-sm font-semibold transition-all"
          style={LOGO_STYLE}
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <MessageSquare size={28} className="text-slate-500" />
            <p className="text-xs text-slate-500" style={TEXT_STYLE}>
              No chats yet
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                chat.id === activeId
                  ? 'bg-indigo-600/20 border border-indigo-500/50'
                  : 'bg-transparent border border-transparent hover:bg-slate-800/50'
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate font-medium" style={TEXT_STYLE}>
                    {chat.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {chat.messages.length} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600/30 rounded transition-all"
                  title="Delete chat"
                >
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-[#242732] bg-[#181921] space-y-2 flex-shrink-0">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Resources:</span>
            <span className="font-semibold text-indigo-400">42</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Cost:</span>
            <span className="font-semibold text-emerald-400">$12,450</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div
        className={`max-w-2xl px-6 py-4 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 rounded-br-none'
            : 'bg-[#1f2029] border border-[#242732] text-slate-200 rounded-bl-none'
        }`}
        style={TEXT_STYLE}
      >
        <div className="whitespace-pre-wrap break-words">
          {formatMessageContent(message.content)}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CHAT AREA
// ============================================================================
const ChatArea: React.FC<{
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}> = ({ messages, isLoading, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    onSendMessage(inputValue);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [inputValue, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#13141b] relative overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <Zap size={40} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-100 mb-3" style={LOGO_STYLE}>
                CloudOpti AI
              </h2>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed" style={TEXT_STYLE}>
                Ask me anything about your AWS infrastructure, cost optimization, security recommendations, or resource insights.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1f2029] border border-[#242732] rounded-2xl px-6 py-4 flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-indigo-400" />
                  <span className="text-sm text-slate-400" style={TEXT_STYLE}>
                    CloudOpti is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area - Pinned to Bottom */}
      <div className="border-t border-[#242732] px-8 py-6 bg-[#13141b] flex-shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your infrastructure, costs, security..."
            className="flex-1 bg-[#1f2029] hover:bg-[#242732] border border-[#242732] hover:border-[#2d3742] focus:border-indigo-500 focus:bg-[#0f1117] rounded-2xl px-5 py-3.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all resize-none focus:ring-2 focus:ring-indigo-500/20"
            style={TEXT_STYLE}
            rows={1}
            autoFocus
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-3.5 text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all flex-shrink-0 shadow-lg hover:shadow-xl disabled:shadow-none"
            title="Send (Enter)"
          >
            <Send size={20} className="rotate-45" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-slate-500 px-2" style={TEXT_STYLE}>
          <span>💬 {messages.length} messages</span>
          <span className="hidden sm:inline">Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================
export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  alerts = [],
  resourceCount = 0,
  totalCost = 0,
  infrastructureContext = '',
}) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize chats from localStorage on mount
  useEffect(() => {
    if (isOpen && chats.length === 0) {
      const saved = localStorage.getItem('ai-advisor-chats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChats(parsed);
          setActiveChat(parsed[0]);
        } catch (e) {
          createNewChat();
        }
      } else {
        createNewChat();
      }
    }
  }, [isOpen]);

  // Save chats to localStorage whenever they change
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('ai-advisor-chats', JSON.stringify(chats));
    }
  }, [chats]);

  // Control body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const createNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: `chat-${Date.now()}`,
      title: `Chat - ${new Date().toLocaleDateString()}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setActiveChat(chat);
    }
  }, [chats]);

  const handleDeleteChat = useCallback((id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChat?.id === id) {
      setActiveChat(chats.find((c) => c.id !== id) || null);
    }
  }, [activeChat, chats]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!activeChat || !message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    const updatedChat = {
      ...activeChat,
      messages: [...activeChat.messages, userMessage],
      updatedAt: new Date(),
    };

    setActiveChat(updatedChat);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? updatedChat : c))
    );

    setIsLoading(true);

    try {
      // Call your backend API
      const response = await axios.post('/api/ai-advisor', {
        message,
        context: {
          alerts,
          resourceCount,
          totalCost,
          infrastructureContext,
        },
        chatHistory: updatedChat.messages,
      });

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response || 'Unable to process your request.',
        timestamp: new Date(),
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date(),
      };

      setActiveChat(finalChat);
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? finalChat : c))
      );

      // Update chat title if it's the first message
      if (updatedChat.messages.length === 1) {
        const titleChat = {
          ...finalChat,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        };
        setActiveChat(titleChat);
        setChats((prev) =>
          prev.map((c) => (c.id === activeChat.id ? titleChat : c))
        );
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };

      const errorChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage],
        updatedAt: new Date(),
      };

      setActiveChat(errorChat);
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? errorChat : c))
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeChat, alerts, resourceCount, totalCost, infrastructureContext]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay - Covers Everything */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog Window */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
        <div className="w-full max-w-[1200px] h-[80vh] min-h-[600px] bg-[#13141b] border border-[#242732] rounded-[24px] shadow-2xl flex overflow-hidden relative pointer-events-auto">
          
          {/* Close Button - Absolute Top Right */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2 bg-[#242732] rounded-full hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={24} className="text-slate-300" />
          </button>

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-[#13141b] border-b border-[#242732] flex items-center px-8 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-100" style={LOGO_STYLE}>
                CloudOpti AI
              </span>
            </div>
          </div>

          {/* Content Area - With top padding for header */}
          <div className="flex w-full pt-16 overflow-hidden">
            {/* Sidebar */}
            {activeChat && (
              <ChatHistorySidebar
                chats={chats}
                activeId={activeChat.id}
                onSelectChat={handleSelectChat}
                onNewChat={createNewChat}
                onDeleteChat={handleDeleteChat}
              />
            )}

            {/* Chat Area */}
            {activeChat ? (
              <ChatArea
                messages={activeChat.messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <p>No chat selected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default AIAdvisorModal;
