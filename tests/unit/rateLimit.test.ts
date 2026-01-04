/**
 * Unit tests for rate limiting functionality
 */

import { NextRequest } from 'next/server';
import {
  getClientIp,
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rateLimit';

// Helper to create mock Next.js request
function createMockRequest(headers: Record<string, string> = {}): NextRequest {
  const url = 'http://localhost:3000/api/test';
  const request = new NextRequest(url);

  // Mock headers
  Object.entries(headers).forEach(([key, value]) => {
    (request.headers as any).set(key, value);
  });

  return request;
}

describe('getClientIp', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1, 10.0.0.1',
    });
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip header', () => {
    const request = createMockRequest({
      'x-real-ip': '192.168.1.2',
    });
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.2');
  });

  it('should extract IP from cf-connecting-ip header (Cloudflare)', () => {
    const request = createMockRequest({
      'cf-connecting-ip': '192.168.1.3',
    });
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.3');
  });

  it('should prioritize x-forwarded-for over other headers', () => {
    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1',
      'x-real-ip': '192.168.1.2',
      'cf-connecting-ip': '192.168.1.3',
    });
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return "unknown" when no IP headers present', () => {
    const request = createMockRequest({});
    const ip = getClientIp(request);
    expect(ip).toBe('unknown');
  });

  it('should trim whitespace from x-forwarded-for IP', () => {
    const request = createMockRequest({
      'x-forwarded-for': ' 192.168.1.1 , 10.0.0.1',
    });
    const ip = getClientIp(request);
    expect(ip).toBe('192.168.1.1');
  });
});

describe('checkRateLimit', () => {
  const testConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  };

  beforeEach(() => {
    // Reset rate limit before each test
    resetRateLimit('test-identifier');
  });

  it('should allow requests within limit', () => {
    const identifier = 'test-user-1';

    for (let i = 0; i < testConfig.maxRequests; i++) {
      const result = checkRateLimit(identifier, testConfig);
      expect(result.isLimited).toBe(false);
      expect(result.limit).toBe(testConfig.maxRequests);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it('should rate limit when exceeding max requests', () => {
    const identifier = 'test-user-2';

    // Make max allowed requests
    for (let i = 0; i < testConfig.maxRequests; i++) {
      checkRateLimit(identifier, testConfig);
    }

    // Next request should be rate limited
    const result = checkRateLimit(identifier, testConfig);
    expect(result.isLimited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('should decrement remaining count correctly', () => {
    const identifier = 'test-user-3';

    const result1 = checkRateLimit(identifier, testConfig);
    expect(result1.remaining).toBe(testConfig.maxRequests - 1);

    const result2 = checkRateLimit(identifier, testConfig);
    expect(result2.remaining).toBe(testConfig.maxRequests - 2);
  });

  it('should reset after time window expires', async () => {
    const identifier = 'test-user-4';
    const shortConfig = {
      windowMs: 100, // 100ms
      maxRequests: 2,
    };

    // Exhaust the limit
    checkRateLimit(identifier, shortConfig);
    checkRateLimit(identifier, shortConfig);

    const limitedResult = checkRateLimit(identifier, shortConfig);
    expect(limitedResult.isLimited).toBe(true);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be allowed again
    const allowedResult = checkRateLimit(identifier, shortConfig);
    expect(allowedResult.isLimited).toBe(false);
  });

  it('should track different identifiers separately', () => {
    const identifier1 = 'user-1';
    const identifier2 = 'user-2';

    // User 1 makes requests
    for (let i = 0; i < testConfig.maxRequests; i++) {
      checkRateLimit(identifier1, testConfig);
    }

    // User 1 should be limited
    const result1 = checkRateLimit(identifier1, testConfig);
    expect(result1.isLimited).toBe(true);

    // User 2 should still be allowed
    const result2 = checkRateLimit(identifier2, testConfig);
    expect(result2.isLimited).toBe(false);
  });

  it('should use default config when not specified', () => {
    const identifier = 'test-user-5';
    const result = checkRateLimit(identifier);
    expect(result.limit).toBe(RATE_LIMIT_CONFIGS.DEFAULT.maxRequests);
  });

  it('should provide accurate resetTime', () => {
    const identifier = 'test-user-6';
    const beforeTime = Date.now();
    const result = checkRateLimit(identifier, testConfig);
    const afterTime = Date.now();

    expect(result.resetTime).toBeGreaterThanOrEqual(beforeTime + testConfig.windowMs);
    expect(result.resetTime).toBeLessThanOrEqual(afterTime + testConfig.windowMs + 10);
  });
});

describe('resetRateLimit', () => {
  const testConfig = {
    windowMs: 60000,
    maxRequests: 5,
  };

  it('should reset rate limit for identifier', () => {
    const identifier = 'test-user-reset';

    // Exhaust the limit
    for (let i = 0; i < testConfig.maxRequests + 1; i++) {
      checkRateLimit(identifier, testConfig);
    }

    const limitedResult = checkRateLimit(identifier, testConfig);
    expect(limitedResult.isLimited).toBe(true);

    // Reset
    resetRateLimit(identifier);

    // Should be allowed again
    const allowedResult = checkRateLimit(identifier, testConfig);
    expect(allowedResult.isLimited).toBe(false);
    expect(allowedResult.remaining).toBe(testConfig.maxRequests - 1);
  });

  it('should not affect other identifiers', () => {
    const identifier1 = 'user-1';
    const identifier2 = 'user-2';

    checkRateLimit(identifier1, testConfig);
    checkRateLimit(identifier2, testConfig);

    resetRateLimit(identifier1);

    const status1 = getRateLimitStatus(identifier1, testConfig);
    const status2 = getRateLimitStatus(identifier2, testConfig);

    expect(status1.count).toBe(0);
    expect(status2.count).toBe(1);
  });
});

describe('getRateLimitStatus', () => {
  const testConfig = {
    windowMs: 60000,
    maxRequests: 10,
  };

  beforeEach(() => {
    resetRateLimit('status-test');
  });

  it('should return initial status with zero count', () => {
    const identifier = 'status-test';
    const status = getRateLimitStatus(identifier, testConfig);

    expect(status.count).toBe(0);
    expect(status.limit).toBe(testConfig.maxRequests);
    expect(status.remaining).toBe(testConfig.maxRequests);
    expect(status.resetTime).toBeGreaterThan(Date.now());
  });

  it('should return accurate count after requests', () => {
    const identifier = 'status-test';

    checkRateLimit(identifier, testConfig);
    checkRateLimit(identifier, testConfig);
    checkRateLimit(identifier, testConfig);

    const status = getRateLimitStatus(identifier, testConfig);
    expect(status.count).toBe(3);
    expect(status.remaining).toBe(testConfig.maxRequests - 3);
  });

  it('should show zero remaining when limit exceeded', () => {
    const identifier = 'status-test';

    for (let i = 0; i < testConfig.maxRequests + 5; i++) {
      checkRateLimit(identifier, testConfig);
    }

    const status = getRateLimitStatus(identifier, testConfig);
    expect(status.remaining).toBe(0);
  });

  it('should reset status after time window', async () => {
    const identifier = 'status-test';
    const shortConfig = {
      windowMs: 100,
      maxRequests: 5,
    };

    checkRateLimit(identifier, shortConfig);
    checkRateLimit(identifier, shortConfig);

    let status = getRateLimitStatus(identifier, shortConfig);
    expect(status.count).toBe(2);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    status = getRateLimitStatus(identifier, shortConfig);
    expect(status.count).toBe(0);
    expect(status.remaining).toBe(shortConfig.maxRequests);
  });
});

describe('RATE_LIMIT_CONFIGS', () => {
  it('should have correct config for CHAT', () => {
    expect(RATE_LIMIT_CONFIGS.CHAT.maxRequests).toBe(10);
    expect(RATE_LIMIT_CONFIGS.CHAT.windowMs).toBe(60000);
  });

  it('should have correct config for CONVERSATIONS', () => {
    expect(RATE_LIMIT_CONFIGS.CONVERSATIONS.maxRequests).toBe(30);
    expect(RATE_LIMIT_CONFIGS.CONVERSATIONS.windowMs).toBe(60000);
  });

  it('should have correct config for DEFAULT', () => {
    expect(RATE_LIMIT_CONFIGS.DEFAULT.maxRequests).toBe(20);
    expect(RATE_LIMIT_CONFIGS.DEFAULT.windowMs).toBe(60000);
  });
});
