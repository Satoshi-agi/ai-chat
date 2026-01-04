/**
 * Integration tests for /api/chat endpoint
 *
 * Note: These tests require MongoDB and Anthropic API to be available
 * Set MONGODB_URI and ANTHROPIC_API_KEY in .env.test
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

describe('/api/chat', () => {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  beforeAll(() => {
    // Ensure required environment variables are set
    if (!process.env.MONGODB_URI || !process.env.ANTHROPIC_API_KEY) {
      console.warn('Skipping integration tests: Missing environment variables');
    }
  });

  it('should reject request without message', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: 'test-session' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Message is required');
  });

  it('should reject message that is too long', async () => {
    const longMessage = 'a'.repeat(10001);
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: longMessage,
        sessionId: 'test-session',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('10000 characters');
  });

  it('should validate message format', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        sessionId: 'test-session',
      }),
    });

    expect(response.status).toBe(400);
  });

  // Note: The following test would require actual API keys and database
  // Uncomment when running with proper environment setup
  /*
  it('should successfully send and receive a message', async () => {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, this is a test',
        sessionId: 'test-session-' + Date.now(),
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.response).toBeDefined();
    expect(data.sessionId).toBeDefined();
    expect(typeof data.response).toBe('string');
  });
  */
});
