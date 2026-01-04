/**
 * API client functions for the AI Chat application
 */

import type { Message } from '@/types';

export interface ConversationResponse {
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  title?: string;
}

export interface ConversationsListResponse {
  conversations: Array<{
    sessionId: string;
    title?: string;
    createdAt: string;
    messageCount: number;
  }>;
  total: number;
}

/**
 * Fetch a specific conversation by session ID
 */
export async function fetchConversation(
  sessionId: string
): Promise<ConversationResponse> {
  const response = await fetch(`/api/conversations/${sessionId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch conversation');
  }

  return response.json();
}

/**
 * Fetch conversations list with pagination
 */
export async function fetchConversations(
  limit: number = 10,
  offset: number = 0
): Promise<ConversationsListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/conversations?${params}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch conversations');
  }

  return response.json();
}

/**
 * Delete a conversation by session ID
 */
export async function deleteConversation(sessionId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete conversation');
  }
}

/**
 * Send a message to the chat API
 */
export async function sendMessage(
  message: string,
  sessionId: string,
  conversationHistory: Message[]
): Promise<{ response: string; sessionId: string }> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}
