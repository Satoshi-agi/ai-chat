/**
 * Type definitions for AI Chat application
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  _id?: string;
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  conversationHistory?: Message[];
}

export interface ChatResponse {
  response: string;
  sessionId: string;
}

export interface ConversationSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
  total: number;
}

export interface ConversationDetail {
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  title?: string;
}
