'use client';

import React, { useState, KeyboardEvent } from 'react';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder = 'メッセージを入力...',
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to send
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={isLoading}
          className="flex-1"
          maxLength={10000}
        />
        <div className="flex flex-col justify-end">
          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            isLoading={isLoading}
            size="md"
          >
            送信
          </Button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Ctrl+Enter
          </p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {message.length} / 10000 文字
      </p>
    </form>
  );
}
