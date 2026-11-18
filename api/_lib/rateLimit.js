var ipBuckets = new Map();
// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(function () {
    var now = Date.now();
    ipBuckets.forEach(function (record, ip) {
      if (record.resetAt <= now) {
        ipBuckets.delete(ip);
      }
    });
  }, 300000);
}
export function getClientIp(req) {
  var forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}
/**
 * In-memory sliding window rate limiter per IP.
 * @param ip Client IP address
 * @param maxRequests Maximum requests allowed within windowMs
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 min)
 */
export function checkRateLimit(ip, maxRequests, windowMs) {
  if (maxRequests === void 0) {
    maxRequests = 30;
  }
  if (windowMs === void 0) {
    windowMs = 60000;
  }
  var now = Date.now();
  var record = ipBuckets.get(ip);
  if (!record || record.resetAt <= now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }
  if (record.count >= maxRequests) {
    var resetInSec_1 = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetInSec: resetInSec_1 };
  }
  record.count += 1;
  var resetInSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return { allowed: true, remaining: maxRequests - record.count, resetInSec: resetInSec };
}
