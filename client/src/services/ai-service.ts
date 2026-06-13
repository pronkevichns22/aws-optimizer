// ============================================================================
// FILE: ai-service.ts
// LOCATION: client/src/services/
// PURPOSE: Client-side API service for AI advisor chat and recommendations
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  updatedAt?: string;
  context?: {
    resourceCount?: number;
    totalCost?: number;
    alertCount?: number;
  };
}

interface AIRecommendation {
  summary: string;
  recommendations: string[];
  estimatedSavings?: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
}

/**
 * Helper function to make API requests with authentication
 */
async function makeRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// CHAT MANAGEMENT API CALLS
// ============================================================================

/**
 * Get all chat sessions for the current user
 */
export async function getUserChats(
  token: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ chats: ChatSession[]; total: number }> {
  const result = await makeRequest(
    `/chats?limit=${limit}&skip=${offset}`,
    token
  );
  return {
    chats: result.data?.chats || [],
    total: result.data?.total || 0,
  };
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  token: string,
  title: string
): Promise<ChatSession> {
  const result = await makeRequest('/chat', token, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return result.data;
}

/**
 * Get chat history for a specific chat session
 */
export async function getChatHistory(
  token: string,
  chatSessionId: string
): Promise<ChatSession> {
  const result = await makeRequest(`/chat/${chatSessionId}`, token);
  return result.data;
}

/**
 * Add a message to a chat session
 */
export async function addMessageToChat(
  token: string,
  chatSessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  await makeRequest(`/chat/${chatSessionId}/message`, token, {
    method: 'POST',
    body: JSON.stringify({ role, content }),
  });
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(
  token: string,
  chatSessionId: string
): Promise<void> {
  await makeRequest(`/chat/${chatSessionId}`, token, {
    method: 'DELETE',
  });
}

/**
 * Update chat session title
 */
export async function updateChatTitle(
  token: string,
  chatSessionId: string,
  title: string
): Promise<void> {
  await makeRequest(`/chat/${chatSessionId}/title`, token, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

/**
 * Update chat context (resource count, cost, alert count)
 */
export async function updateChatContext(
  token: string,
  chatSessionId: string,
  context: {
    resourceCount?: number;
    totalCost?: number;
    alertCount?: number;
  }
): Promise<void> {
  await makeRequest(`/chat/${chatSessionId}/context`, token, {
    method: 'PUT',
    body: JSON.stringify(context),
  });
}

// ============================================================================
// AI ADVISOR API CALLS
// ============================================================================

/**
 * Get AI recommendations based on alerts
 */
export async function getAIRecommendations(
  token: string,
  alerts: Alert[],
  detailed: boolean = false
): Promise<AIRecommendation> {
  const result = await makeRequest('/ai-recommendations', token, {
    method: 'POST',
    body: JSON.stringify({ alerts, detailed }),
  });
  return result.data;
}

/**
 * Send a message to the AI and get a response
 */
export async function sendAIMessage(
  token: string,
  chatSessionId: string,
  message: string,
  context?: {
    resourceCount?: number;
    totalCost?: number;
    alertCount?: number;
  }
): Promise<{ response: string; metadata?: any }> {
  const result = await makeRequest('/ai-message', token, {
    method: 'POST',
    body: JSON.stringify({
      chatSessionId,
      message,
      context,
    }),
  });
  return {
    response: result.data?.response || result.data?.message || '',
    metadata: result.data?.metadata,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract a topic/title from a user message for chat naming
 */
export function extractChatTopic(message: string): string {
  // Take first 50 characters or first sentence, whichever is shorter
  const cleaned = message.trim();
  const firstSentence = cleaned.split(/[.!?]/)[0];
  const topic = firstSentence.length > 0 ? firstSentence : cleaned;
  return topic.slice(0, 50) + (topic.length > 50 ? '...' : '');
}

/**
 * Format a timestamp to readable string
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): Map<string, Message[]> {
  const grouped = new Map<string, Message[]>();

  messages.forEach((msg) => {
    const date = msg.timestamp
      ? new Date(msg.timestamp).toLocaleDateString()
      : 'Unknown';
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(msg);
  });

  return grouped;
}
