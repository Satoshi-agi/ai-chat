'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { Message, ChatRequest, ChatResponse } from '@/types';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  initialSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
}

export default function ChatInterface({
  initialMessages = [],
  initialSessionId,
  onSessionChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState<string>(
    initialSessionId || uuidv4()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update messages when initialMessages changes
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Update sessionId when initialSessionId changes
  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      onSessionChange?.(initialSessionId);
    }
  }, [initialSessionId, onSessionChange]);

  const handleSendMessage = useCallback(async (content: string) => {
    setError(null);
    setIsLoading(true);

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const request: ChatRequest = {
        message: content,
        sessionId,
        conversationHistory: messages,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update session ID if new
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');

      // Remove the user message if failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId]);

  const handleNewConversation = () => {
    setMessages([]);
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setError(null);
    onSessionChange?.(newSessionId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          AI Chat
        </h1>
        <button
          onClick={handleNewConversation}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          新しい会話
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
