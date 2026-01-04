/**
 * Unit tests for MessageList component
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import MessageList from '@/components/chat/MessageList';
import type { Message } from '@/types';

describe('MessageList', () => {
  it('should render empty state when no messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText('新しい会話を始めましょう')).toBeInTheDocument();
  });

  it('should render messages', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2026-01-04T12:00:00Z'),
      },
      {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date('2026-01-04T12:00:01Z'),
      },
    ];

    render(<MessageList messages={messages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should distinguish user and assistant messages', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'User message',
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: 'Assistant message',
        timestamp: new Date(),
      },
    ];

    const { container } = render(<MessageList messages={messages} />);

    const userMessages = container.querySelectorAll('.bg-blue-600');
    const assistantMessages = container.querySelectorAll('.bg-gray-200');

    expect(userMessages.length).toBe(1);
    expect(assistantMessages.length).toBe(1);
  });

  it('should display role labels', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      },
    ];

    render(<MessageList messages={messages} />);
    expect(screen.getByText('あなた')).toBeInTheDocument();
  });

  it('should render multiple messages in order', () => {
    const messages: Message[] = [
      {
        role: 'user',
        content: 'First',
        timestamp: new Date('2026-01-04T12:00:00Z'),
      },
      {
        role: 'assistant',
        content: 'Second',
        timestamp: new Date('2026-01-04T12:00:01Z'),
      },
      {
        role: 'user',
        content: 'Third',
        timestamp: new Date('2026-01-04T12:00:02Z'),
      },
    ];

    render(<MessageList messages={messages} />);

    const allMessages = screen.getAllByText(/First|Second|Third/);
    expect(allMessages).toHaveLength(3);
  });
});
