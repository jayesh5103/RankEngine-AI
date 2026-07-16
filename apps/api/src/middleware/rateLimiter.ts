import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

const limitStore = new Map<string, RateLimitInfo>();

/**
 * Custom memory-based sliding window rate limiter middleware.
 * Highly performant (<0.5ms) and isolated for test environments.
 */
export const rateLimiter = (limit: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Identify user by userId (from auth token) or client IP as fallback
    const key = req.user?.userId || req.ip || 'anonymous';
    
    const now = Date.now();
    let record = limitStore.get(key);
    
    if (!record) {
      record = { timestamps: [] };
      limitStore.set(key, record);
    }
    
    // Filter timestamps within the sliding window boundary
    record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);
    
    if (record.timestamps.length >= limit) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfterMs: Math.max(0, windowMs - (now - record.timestamps[0]))
      });
    }
    
    record.timestamps.push(now);
    return next();
  };
};

export const _clearRateLimitStore = () => {
  limitStore.clear();
};
