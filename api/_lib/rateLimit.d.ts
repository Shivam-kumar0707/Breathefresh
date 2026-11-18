import type { IncomingMessage } from 'http';
export declare function getClientIp(req: IncomingMessage): string;
/**
 * In-memory sliding window rate limiter per IP.
 * @param ip Client IP address
 * @param maxRequests Maximum requests allowed within windowMs
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 */
export declare function checkRateLimit(
  ip: string,
  maxRequests?: number,
  windowMs?: number
): {
  allowed: boolean;
  remaining: number;
  resetInSec: number;
};
