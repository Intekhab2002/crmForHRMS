import rateLimit from "express-rate-limit";

import config from "../app.config.js";
import ApiResponse from "../../helpers/ApiResponse.js";
import { StatusCodes } from "http-status-codes";

/**
 * ============================================================================
 * Rate Limiting Configuration
 * ============================================================================
 *
 * Centralizes HTTP request-rate limiting policies.
 *
 * Responsibilities:
 * - Define general API rate limiting.
 * - Define authentication-specific rate limiting.
 * - Provide reusable rate-limit middleware factories.
 *
 * This module does not register middleware with Express.
 *
 * Rate limiting is intentionally configuration-driven and independent from
 * NODE_ENV so that deployment environment and traffic policy remain separate
 * concerns.
 * ============================================================================
 */

/**
 * Converts a rate-limit window from minutes to milliseconds.
 *
 * @param {number} minutes
 * @returns {number}
 */
const toMilliseconds = (minutes) => minutes * 60 * 1000;

/**
 * Handles a general API rate-limit violation.
 *
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const handleGeneralRateLimitExceeded = (request, response) =>
  ApiResponse.error(
    response,
    StatusCodes.TOO_MANY_REQUESTS,
    "Too many requests. Please try again later.",
    [],
    "RATE_LIMIT_EXCEEDED",
  );

/**
 * Handles an authentication rate-limit violation.
 *
 * @param {import("express").Request} request
 * @param {import("express").Response} response
 * @returns {import("express").Response}
 */
const handleAuthenticationRateLimitExceeded = (
  request,
  response,
) =>
  ApiResponse.error(
    response,
    StatusCodes.TOO_MANY_REQUESTS,
    "Too many authentication attempts. Please try again later.",
    [],
    "AUTH_RATE_LIMIT_EXCEEDED",
  );

/**
 * General API rate-limit configuration.
 */
const generalRateLimitOptions = Object.freeze({
  windowMs: toMilliseconds(
    config.security.rateLimitWindow,
  ),

  limit: config.security.rateLimitMaxRequests,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  skipSuccessfulRequests: false,

  skipFailedRequests: false,

  handler: handleGeneralRateLimitExceeded,
});

/**
 * Authentication-specific rate-limit configuration.
 *
 * This limiter is intentionally stricter than the general API limiter.
 *
 * It will later protect:
 *
 * - Login
 * - Refresh token
 * - Password reset
 * - OTP verification
 * - Other authentication-sensitive operations
 */
const authenticationRateLimitOptions = Object.freeze({
  windowMs: toMilliseconds(
    config.security.rateLimitAuthWindow,
  ),

  limit: config.security.rateLimitAuthMaxRequests,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  skipSuccessfulRequests: false,

  skipFailedRequests: false,

  handler: handleAuthenticationRateLimitExceeded,
});

/**
 * Creates the general API rate limiter.
 *
 * @returns {import("express").RequestHandler}
 */
export function createGeneralRateLimiter() {
  return rateLimit(generalRateLimitOptions);
}

/**
 * Creates the authentication-specific rate limiter.
 *
 * Authentication routes will explicitly attach this middleware when the
 * Authentication module is implemented.
 *
 * @returns {import("express").RequestHandler}
 */
export function createAuthenticationRateLimiter() {
  return rateLimit(authenticationRateLimitOptions);
}

/**
 * Immutable rate-limit configuration.
 */
const rateLimitConfig = Object.freeze({
  general: generalRateLimitOptions,
  authentication: authenticationRateLimitOptions,
});

export default rateLimitConfig;