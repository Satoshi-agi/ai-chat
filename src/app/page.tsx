'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { fetchConversation } from '@/lib/api';
import type { Message } from '@/types';

// Lazy load heavy components with code splitting
const ChatInterface = dynamic(() => import('@/components/chat/ChatInterface'), {
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false, // Disable SSR for this component
});

const ConversationHistory = dynamic(() => import('@/components/chat/ConversationHistory'), {
  loading: () => (
    <div className="flex items-center justify-center h-full p-8">
      <LoadingSpinner size="md" />
    </div>
  ),
  ssr: false,
});

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loadedMessages, setLoadedMessages] = useState<Message[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectConversation = async (sessionId: string) => {
    setError(null);
    setIsLoadingConversation(true);
    setShowHistory(false);

    try {
      const data = await fetchConversation(sessionId);
      setSelectedSessionId(sessionId);
      setLoadedMessages(data.messages);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load conversation. Please try again.'
      );
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleSessionChange = (newSessionId: string) => {
    // Reset loaded messages when starting a new conversation
    setSelectedSessionId(newSessionId);
    setLoadedMessages([]);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <svg
          className="h-6 w-6 text-gray-600 dark:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar - Conversation History */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-80 bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-200 ease-in-out
          ${showHistory ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Chat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Claude API
            </p>
          </div>
          <ConversationHistory onSelectConversation={handleSelectConversation} />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {showHistory && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowHistory(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Error Display */}
        {error && (
          <div className="p-4">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* Loading Overlay */}
        {isLoadingConversation && (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
            <p className="ml-3 text-gray-600 dark:text-gray-400">
              会話を読み込んでいます...
            </p>
          </div>
        )}

        {/* Chat Interface */}
        {!isLoadingConversation && (
          <ChatInterface
            key={selectedSessionId}
            initialMessages={loadedMessages}
            initialSessionId={selectedSessionId || undefined}
            onSessionChange={handleSessionChange}
          />
        )}
      </main>
    </div>
  );
}
