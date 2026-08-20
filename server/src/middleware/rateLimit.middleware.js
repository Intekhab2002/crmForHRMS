import logger from "../config/logger.js";

import {
  createGeneralRateLimiter,
} from "../config/security/rateLimit.config.js";

/**
 * ============================================================================
 * Rate Limit Middleware
 * ============================================================================
 *
 * Creates the global API rate-limiting middleware.
 *
 * Authentication-specific rate limiting is intentionally not registered
 * globally. Authentication routes will attach their stricter limiter directly.
 * ============================================================================
 */

/**
 * Creates the global API rate limiter.
 *
 * @returns {import("express").RequestHandler}
 */
export function createRateLimitMiddleware() {
  const rateLimiter = createGeneralRateLimiter();

  logger.info("Global API rate limiting initialized.");

  return rateLimiter;
}

export default createRateLimitMiddleware;