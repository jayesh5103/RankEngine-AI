/**
 * Centralized Express error handler.
 *
 * Behaviour:
 *  - In production (NODE_ENV === 'production'):
 *      → Returns a generic { error: 'Internal server error' } to the client.
 *      → Full error details (message + stack) are logged server-side only.
 *  - In development/test:
 *      → Returns { error: message, stack } to ease debugging.
 *
 * Security rationale:
 *  - Stack traces must never reach clients in production — they reveal
 *    internal paths, library versions, and logic that attackers exploit.
 *  - Validation errors (e.g. from Zod/Express) typically already carry
 *    a safe, user-facing message and a 4xx status code; they are passed
 *    through unchanged.
 *
 * Mount AFTER all routes:  app.use(errorHandler)
 */

import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  /** When true the message is safe to surface to the client */
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Always log full details server-side
  console.error('[ErrorHandler]', {
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  if (isProd) {
    // In production, surface a generic message for 5xx; pass through 4xx messages
    // if the error is marked operational (i.e. it was thrown deliberately with a
    // user-safe message, not a library crash).
    const clientMessage =
      statusCode < 500 || err.isOperational ? err.message : 'Internal server error';

    res.status(statusCode).json({ error: clientMessage });
  } else {
    // Development / test: include stack for easier debugging
    res.status(statusCode).json({
      error: err.message,
      ...(err.stack ? { stack: err.stack } : {}),
    });
  }
}
