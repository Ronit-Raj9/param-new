import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";

// Request context for logging and tracing
export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  userRole?: string;
  ip: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

/**
 * Add request context for tracing and logging
 */
export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers["x-request-id"]?.toString() || nanoid(12);
  
  req.context = {
    requestId,
    startTime: Date.now(),
    ip: req.ip || req.socket.remoteAddress || "unknown",
    userAgent: req.headers["user-agent"] || "unknown",
  };

  // Add request ID to response headers
  res.setHeader("X-Request-ID", requestId);

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - req.context.startTime;
    // Logging handled by pino-http
  });

  next();
}

/**
 * Update context with user info after authentication
 */
export function updateContextWithUser(req: Request): void {
  if (req.user && req.context) {
    req.context.userId = req.user.id;
    req.context.userRole = req.user.role;
  }
}
