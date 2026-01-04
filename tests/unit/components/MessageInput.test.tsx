/**
 * Unit tests for MessageInput component
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from '@/components/chat/MessageInput';

describe('MessageInput', () => {
  it('should render textarea and send button', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeInTheDocument();
    expect(screen.getByText('送信')).toBeInTheDocument();
  });

  it('should update character count', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(screen.getByText('5 / 10000 文字')).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    const form = textarea.closest('form')!;

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(mockOnSend).toHaveBeenCalledWith('Test message');
  });

  it('should clear input after sending', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    const form = textarea.closest('form')!;

    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    expect(textarea.value).toBe('');
  });

  it('should not send empty messages', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    const form = textarea.closest('form')!;

    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.submit(form);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should disable input when loading', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} isLoading={true} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });

  it('should enforce max length', () => {
    const mockOnSend = jest.fn();
    render(<MessageInput onSendMessage={mockOnSend} />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...') as HTMLTextAreaElement;
    expect(textarea).toHaveAttribute('maxLength', '10000');
  });
});
