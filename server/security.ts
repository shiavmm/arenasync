import { Request, Response, NextFunction } from 'express';

// HTTP Security Headers Middleware (Helmet-equivalent protection)
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Legacy XSS filter protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information leakage
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Isolate browsing context
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Enforce HTTPS HSTS when in production or on TLS
  if (process.env.NODE_ENV === 'production' || req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove Express fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

// In-memory rate limiting tracker to mitigate brute-force / DoS attacks
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimiter(options: { maxRequests: number; windowMs: number; message?: string }) {
  const { maxRequests, windowMs, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = rateLimitStore.get(clientIp);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    record.count += 1;

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      return res.status(429).json({
        error: message || 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds
      });
    }

    next();
  };
}
