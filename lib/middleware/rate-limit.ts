import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config?.windowMs ?? 60 * 60 * 1000, // 1 hour default
      maxRequests: config?.maxRequests ?? 100, // 100 requests per hour default
      keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of Array.from(this.store.entries())) {
        if (now > value.resetTime) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async checkLimit(request: NextRequest, partnerId?: string): Promise<RateLimitResult> {
    const key = partnerId || this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create rate limit entry
    let entry = this.store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        error: 'Rate limit exceeded',
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  async checkPartnerLimit(partnerId: string): Promise<RateLimitResult> {
    const supabase = createServerClient();
    
    try {
      // Get partner rate limit configuration
      const { data: partner, error } = await supabase
        .from('partners')
        .select('rate_limit, current_usage, usage_reset_time')
        .eq('id', partnerId)
        .single();

      if (error || !partner) {
        return {
          success: false,
          limit: 0,
          remaining: 0,
          resetTime: Date.now(),
          error: 'Partner not found',
        };
      }

      const now = Date.now();
      const resetTime = new Date(partner.usage_reset_time || now).getTime();
      const rateLimit = partner.rate_limit || 100;
      const currentUsage = partner.current_usage || 0;

      // Reset usage if window expired
      if (now > resetTime) {
        const newResetTime = now + (60 * 60 * 1000); // 1 hour from now
        
        await supabase
          .from('partners')
          .update({
            current_usage: 0,
            usage_reset_time: new Date(newResetTime).toISOString(),
          })
          .eq('id', partnerId);

        return {
          success: true,
          limit: rateLimit,
          remaining: rateLimit - 1,
          resetTime: newResetTime,
        };
      }

      // Check if limit exceeded
      if (currentUsage >= rateLimit) {
        return {
          success: false,
          limit: rateLimit,
          remaining: 0,
          resetTime,
          error: 'Partner rate limit exceeded',
        };
      }

      return {
        success: true,
        limit: rateLimit,
        remaining: rateLimit - currentUsage,
        resetTime,
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      return {
        success: false,
        limit: 0,
        remaining: 0,
        resetTime: Date.now(),
        error: 'Rate limit check failed',
      };
    }
  }

  async incrementPartnerUsage(partnerId: string): Promise<void> {
    const supabase = createServerClient();
    
    try {
      await supabase.rpc('increment_partner_usage', {
        partner_id: partnerId,
      });
    } catch (error) {
      console.error('Failed to increment partner usage:', error);
    }
  }
}

// Default rate limiter instances
export const defaultRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000, // 1000 requests per hour for general API
});

export const partnerRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 requests per hour for partners (overridden by partner config)
});

// Middleware function
export async function rateLimitMiddleware(
  request: NextRequest,
  partnerId?: string
): Promise<RateLimitResult> {
  if (partnerId) {
    return await partnerRateLimiter.checkPartnerLimit(partnerId);
  } else {
    return await defaultRateLimiter.checkLimit(request);
  }
}

export { RateLimiter };
export type { RateLimitConfig, RateLimitResult };