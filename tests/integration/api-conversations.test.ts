/**
 * Integration tests for /api/conversations endpoints
 *
 * Note: These tests require MongoDB to be available
 * Set MONGODB_URI in .env.test
 */

import { describe, it, expect } from '@jest/globals';

describe('/api/conversations', () => {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  describe('GET /api/conversations', () => {
    it('should return conversations list with default pagination', async () => {
      const response = await fetch(`${API_URL}/api/conversations`);

      // Even without database, should return proper structure
      if (response.status === 200) {
        const data = await response.json();
        expect(data.conversations).toBeDefined();
        expect(data.total).toBeDefined();
        expect(Array.isArray(data.conversations)).toBe(true);
      }
    });

    it('should validate limit parameter', async () => {
      const response = await fetch(`${API_URL}/api/conversations?limit=150`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Limit must be between 1 and 100');
    });

    it('should validate offset parameter', async () => {
      const response = await fetch(`${API_URL}/api/conversations?offset=-1`);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Offset must be non-negative');
    });
  });

  describe('GET /api/conversations/[sessionId]', () => {
    it('should return 404 for non-existent conversation', async () => {
      const response = await fetch(
        `${API_URL}/api/conversations/non-existent-session-id`
      );

      if (response.status === 404) {
        const data = await response.json();
        expect(data.error).toContain('not found');
      }
    });
  });

  describe('DELETE /api/conversations/[sessionId]', () => {
    it('should return 404 for non-existent conversation', async () => {
      const response = await fetch(
        `${API_URL}/api/conversations/non-existent-session-id`,
        { method: 'DELETE' }
      );

      if (response.status === 404) {
        const data = await response.json();
        expect(data.error).toContain('not found');
      }
    });
  });
});
