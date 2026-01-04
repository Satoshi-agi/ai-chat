/**
 * Input validation and sanitization utilities
 * Provides XSS protection and input validation
 */

import validator from 'validator';
import sanitizeHtml from 'sanitize-html';

// Constants for validation
export const VALIDATION_RULES = {
  MESSAGE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 10000,
  },
  SESSION_ID: {
    VALID_UUID_VERSION: 4,
  },
  CONVERSATION: {
    MAX_TITLE_LENGTH: 200,
  },
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove all HTML tags and potential script content
  const sanitized = sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });

  // Trim whitespace
  return validator.trim(sanitized);
}

/**
 * Validate message content
 */
export function validateMessage(message: string): {
  isValid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'Message must be a non-empty string',
    };
  }

  const sanitized = sanitizeInput(message);

  if (sanitized.length < VALIDATION_RULES.MESSAGE.MIN_LENGTH) {
    return {
      isValid: false,
      error: 'Message cannot be empty',
    };
  }

  if (sanitized.length > VALIDATION_RULES.MESSAGE.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Message exceeds maximum length of ${VALIDATION_RULES.MESSAGE.MAX_LENGTH} characters`,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validate session ID (UUID v4)
 */
export function validateSessionId(sessionId: string): {
  isValid: boolean;
  error?: string;
} {
  if (!sessionId || typeof sessionId !== 'string') {
    return {
      isValid: false,
      error: 'Session ID must be a non-empty string',
    };
  }

  if (!validator.isUUID(sessionId, '4')) {
    return {
      isValid: false,
      error: 'Session ID must be a valid UUID v4',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validate conversation title
 */
export function validateConversationTitle(title: string): {
  isValid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!title || typeof title !== 'string') {
    return {
      isValid: false,
      error: 'Title must be a non-empty string',
    };
  }

  const sanitized = sanitizeInput(title);

  if (sanitized.length > VALIDATION_RULES.CONVERSATION.MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: `Title exceeds maximum length of ${VALIDATION_RULES.CONVERSATION.MAX_TITLE_LENGTH} characters`,
    };
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(
  limit?: string | number,
  offset?: string | number
): {
  isValid: boolean;
  error?: string;
  limit?: number;
  offset?: number;
} {
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
  const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;

  if (parsedLimit !== undefined) {
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return {
        isValid: false,
        error: 'Limit must be a number between 1 and 100',
      };
    }
  }

  if (parsedOffset !== undefined) {
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return {
        isValid: false,
        error: 'Offset must be a non-negative number',
      };
    }
  }

  return {
    isValid: true,
    limit: parsedLimit || 10,
    offset: parsedOffset || 0,
  };
}
