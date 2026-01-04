/**
 * SWR hooks for conversation data fetching and caching
 */

import useSWR from 'swr';
import type { ConversationsResponse, ConversationDetail } from '@/types';

/**
 * Fetcher function for SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    throw error;
  }

  return res.json();
};

/**
 * Hook to fetch conversation list with pagination
 */
export function useConversations(limit: number = 10, offset: number = 0) {
  const { data, error, isLoading, mutate } = useSWR<ConversationsResponse>(
    `/api/conversations?limit=${limit}&offset=${offset}`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  );

  return {
    conversations: data?.conversations,
    total: data?.total,
    isLoading,
    isError: error,
    mutate, // Function to manually revalidate
  };
}

/**
 * Hook to fetch a specific conversation by session ID
 */
export function useConversation(sessionId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ConversationDetail>(
    sessionId ? `/api/conversations/${sessionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // Don't revalidate on focus for specific conversation
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    conversation: data,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook to delete a conversation
 */
export function useDeleteConversation() {
  const deleteConversation = async (sessionId: string) => {
    const res = await fetch(`/api/conversations/${sessionId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete conversation');
    }

    return res.json();
  };

  return { deleteConversation };
}
