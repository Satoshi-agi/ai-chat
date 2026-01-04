/**
 * Unit tests for validation utilities
 */

import {
  sanitizeInput,
  validateMessage,
  validateSessionId,
  validateConversationTitle,
  validatePaginationParams,
  VALIDATION_RULES,
} from '@/lib/validation';

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("XSS")</script>Hello';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should remove malicious scripts', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeInput(input);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should handle empty string', () => {
    const result = sanitizeInput('');
    expect(result).toBe('');
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  it('should handle special characters', () => {
    const input = '&lt;&gt;&amp;';
    const result = sanitizeInput(input);
    expect(result).toBeTruthy();
  });

  it('should preserve regular text', () => {
    const input = 'This is a normal message.';
    const result = sanitizeInput(input);
    expect(result).toBe('This is a normal message.');
  });
});

describe('validateMessage', () => {
  it('should validate valid message', () => {
    const message = 'Hello, this is a valid message';
    const result = validateMessage(message);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(message);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty message', () => {
    const result = validateMessage('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject message with only whitespace', () => {
    const result = validateMessage('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('empty');
  });

  it('should reject non-string input', () => {
    const result = validateMessage(null as any);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('string');
  });

  it('should reject message exceeding max length', () => {
    const longMessage = 'a'.repeat(VALIDATION_RULES.MESSAGE.MAX_LENGTH + 1);
    const result = validateMessage(longMessage);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('maximum length');
  });

  it('should accept message at max length boundary', () => {
    const maxMessage = 'a'.repeat(VALIDATION_RULES.MESSAGE.MAX_LENGTH);
    const result = validateMessage(maxMessage);
    expect(result.isValid).toBe(true);
  });

  it('should sanitize message with HTML', () => {
    const message = '<script>alert("XSS")</script>Hello';
    const result = validateMessage(message);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('Hello');
  });

  it('should handle message with only HTML tags', () => {
    const message = '<script></script>';
    const result = validateMessage(message);
    // After sanitization, may become empty or whitespace
    if (result.sanitized && result.sanitized.trim().length === 0) {
      expect(result.isValid).toBe(false);
    } else {
      // If sanitization leaves some content, it should be valid
      expect(result.isValid).toBe(true);
    }
  });
});

describe('validateSessionId', () => {
  it('should validate valid UUID v4', () => {
    // Valid UUID v4: third block must start with 4
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const result = validateSessionId(validUUID);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid UUID format', () => {
    const invalidUUID = 'not-a-uuid';
    const result = validateSessionId(invalidUUID);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('UUID v4');
  });

  it('should reject empty string', () => {
    const result = validateSessionId('');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('non-empty');
  });

  it('should reject non-string input', () => {
    const result = validateSessionId(123 as any);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('string');
  });

  it('should reject UUID v1 format', () => {
    // UUID v1 example
    const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    const result = validateSessionId(uuidV1);
    // Should be invalid because we require v4
    expect(result.isValid).toBe(false);
  });
});

describe('validateConversationTitle', () => {
  it('should validate valid title', () => {
    const title = 'My Conversation';
    const result = validateConversationTitle(title);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe(title);
  });

  it('should sanitize title with HTML', () => {
    const title = '<b>Bold Title</b>';
    const result = validateConversationTitle(title);
    expect(result.isValid).toBe(true);
    expect(result.sanitized).not.toContain('<b>');
  });

  it('should reject title exceeding max length', () => {
    const longTitle = 'a'.repeat(VALIDATION_RULES.CONVERSATION.MAX_TITLE_LENGTH + 1);
    const result = validateConversationTitle(longTitle);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('maximum length');
  });

  it('should accept title at max length boundary', () => {
    const maxTitle = 'a'.repeat(VALIDATION_RULES.CONVERSATION.MAX_TITLE_LENGTH);
    const result = validateConversationTitle(maxTitle);
    expect(result.isValid).toBe(true);
  });

  it('should reject empty title', () => {
    const result = validateConversationTitle('');
    expect(result.isValid).toBe(false);
  });

  it('should reject non-string input', () => {
    const result = validateConversationTitle(null as any);
    expect(result.isValid).toBe(false);
  });
});

describe('validatePaginationParams', () => {
  it('should validate valid parameters', () => {
    const result = validatePaginationParams(10, 0);
    expect(result.isValid).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('should parse string parameters', () => {
    const result = validatePaginationParams('20', '5');
    expect(result.isValid).toBe(true);
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(5);
  });

  it('should use default values when undefined', () => {
    const result = validatePaginationParams(undefined, undefined);
    expect(result.isValid).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(0);
  });

  it('should reject limit less than 1', () => {
    const result = validatePaginationParams(0, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('between 1 and 100');
  });

  it('should reject limit greater than 100', () => {
    const result = validatePaginationParams(101, 0);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('between 1 and 100');
  });

  it('should reject negative offset', () => {
    const result = validatePaginationParams(10, -1);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('non-negative');
  });

  it('should accept limit at boundary values', () => {
    const result1 = validatePaginationParams(1, 0);
    expect(result1.isValid).toBe(true);

    const result2 = validatePaginationParams(100, 0);
    expect(result2.isValid).toBe(true);
  });

  it('should reject non-numeric string parameters', () => {
    const result = validatePaginationParams('abc', '0');
    expect(result.isValid).toBe(false);
  });

  it('should accept offset of 0', () => {
    const result = validatePaginationParams(10, 0);
    expect(result.isValid).toBe(true);
    expect(result.offset).toBe(0);
  });

  it('should accept large offset values', () => {
    const result = validatePaginationParams(10, 1000);
    expect(result.isValid).toBe(true);
    expect(result.offset).toBe(1000);
  });
});
