'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import type { ConversationSummary, ConversationsResponse } from '@/types';

interface ConversationHistoryProps {
  onSelectConversation: (sessionId: string) => void;
}

export default function ConversationHistory({
  onSelectConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations?limit=20');

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data: ConversationsResponse = await response.json();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('この会話を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      // Remove from list
      setConversations((prev) =>
        prev.filter((conv) => conv.sessionId !== sessionId)
      );
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>会話履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          会話履歴
        </h2>
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.sessionId}
              onClick={() => onSelectConversation(conv.sessionId)}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {conv.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {conv.messageCount} メッセージ
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(conv.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(conv.sessionId, e)}
                  className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  aria-label="削除"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
