/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  truncate,
  formatDate,
  simpleHash,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncate(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncate(text, 20);
      expect(result).toBe('Short text');
    });

    it('should handle exact length match', () => {
      const text = 'Exactly twenty chars';
      const result = truncate(text, 20);
      expect(result).toBe('Exactly twenty chars');
    });
  });

  describe('simpleHash', () => {
    it('should generate consistent hashes', () => {
      const text = 'test string';
      const hash1 = simpleHash(text);
      const hash2 = simpleHash(text);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different strings', () => {
      const hash1 = simpleHash('string1');
      const hash2 = simpleHash('string2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = simpleHash('');
      expect(typeof hash).toBe('string');
      expect(hash).toBe('0');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2026-01-04T12:00:00Z');
      const formatted = formatDate(date);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should format date string', () => {
      const dateString = '2026-01-04T12:00:00Z';
      const formatted = formatDate(dateString);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});
