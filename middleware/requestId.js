/**
 * Request ID Middleware
 * Attaches a unique X-Request-Id to every request/response for tracing and audit.
 */
import { randomUUID } from 'crypto';

export default function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
