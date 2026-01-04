/**
 * Enhanced rate limiting middleware
 * Provides IP-based and configurable rate limiting for API routes
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const rateLimitStore: RateLimitStore = {};

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  CHAT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  CONVERSATIONS: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  DEFAULT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },
};

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const keys = Object.keys(rateLimitStore);

  for (const key of keys) {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Check if request should be rate limited
 * Returns true if rate limit exceeded, false otherwise
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.DEFAULT
): {
  isLimited: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // Get or create entry
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const entry = rateLimitStore[key];

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const isLimited = entry.count > config.maxRequests;

  return {
    isLimited,
    limit: config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Apply rate limiting to a request
 * Returns null if allowed, or error response if rate limited
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.DEFAULT
): {
  allowed: boolean;
  headers: Record<string, string>;
  errorMessage?: string;
} {
  const ip = getClientIp(request);
  const { isLimited, limit, remaining, resetTime } = checkRateLimit(ip, config);

  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  };

  if (isLimited) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    return {
      allowed: false,
      headers: {
        ...headers,
        'Retry-After': retryAfter.toString(),
      },
      errorMessage: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
    };
  }

  return {
    allowed: true,
    headers,
  };
}

/**
 * Reset rate limit for a specific identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`;
  delete rateLimitStore[key];
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.DEFAULT): {
  count: number;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  const entry = rateLimitStore[key];
  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}
