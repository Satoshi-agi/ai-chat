'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import type { Message } from '@/types';
import { formatDate } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="mt-2">新しい会話を始めましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-3xl rounded-lg px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs opacity-75">
                {msg.role === 'user' ? 'あなた' : 'Claude'}
              </span>
              <span className="text-xs opacity-75">
                {formatDate(msg.timestamp)}
              </span>
            </div>
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none dark:prose-invert
                  prose-p:my-2 prose-p:leading-relaxed
                  prose-pre:bg-gray-800 prose-pre:text-gray-100
                  prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800
                  prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                  prose-a:text-blue-600 dark:prose-a:text-blue-400
                  prose-strong:text-gray-900 dark:prose-strong:text-gray-100">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize, rehypeRaw]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
