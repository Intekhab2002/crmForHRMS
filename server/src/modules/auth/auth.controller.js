/**
 * ============================================================================
 * Authentication Controller
 * ============================================================================
 *
 * HTTP controller for authentication endpoints.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Receive HTTP requests.
 * • Validate request payloads using authentication validators.
 * • Extract request-specific metadata.
 * • Delegate authentication operations to auth.service.js.
 * • Return standardized ApiResponse payloads.
 *
 * This controller does NOT:
 * • Execute SQL.
 * • Verify passwords.
 * • Generate JWTs.
 * • Manage sessions.
 * • Implement authentication business rules.
 *
 * Architecture
 * ----------------------------------------------------------------------------
 *
 * HTTP Request
 *      ↓
 * Controller
 *      ↓
 * Validator
 *      ↓
 * Authentication Service
 *      ↓
 * ApiResponse
 *      ↓
 * HTTP Response
 *
 * ============================================================================
 */

import { StatusCodes } from "http-status-codes";

import ApiResponse from "../../helpers/ApiResponse.js";

import authenticationService from "./auth.service.js";
import authValidator from "./auth.validator.js";

/**
 * ============================================================================
 * Internal Helpers
 * ============================================================================
 */

/**
 * Extract the client IP address from the Express request.
 *
 * Express `req.ip` respects the application's trust-proxy configuration.
 *
 * @param {import("express").Request} req
 *
 * @returns {string|null}
 */
function getClientIp(req) {
  return typeof req.ip === "string" && req.ip.trim().length > 0
    ? req.ip.trim()
    : null;
}

/**
 * Extract the client's User-Agent header.
 *
 * @param {import("express").Request} req
 *
 * @returns {string|null}
 */
function getUserAgent(req) {
  const userAgent = req.get("user-agent");

  return typeof userAgent === "string" && userAgent.trim().length > 0
    ? userAgent.trim()
    : null;
}

/**
 * ============================================================================
 * Login
 * ============================================================================
 */

/**
 * Authenticate a user.
 *
 * Endpoint:
 *
 * POST /api/v1/auth/login
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function login(req, res, next) {
  try {
    const payload = authValidator.loginSchema.parse(req.body);

    const authenticationResult = await authenticationService.login({
      ...payload,

      ipAddress: getClientIp(req),

      userAgent: getUserAgent(req),
    });

    return ApiResponse.success(
      res,
      authenticationResult,
      "Login successful.",
      StatusCodes.OK,
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * ============================================================================
 * Refresh
 * ============================================================================
 */

/**
 * Refresh an authentication session.
 *
 * Endpoint:
 *
 * POST /api/v1/auth/refresh
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function refresh(req, res, next) {
  try {
    const payload = authValidator.refreshSchema.parse(req.body);

    const authenticationResult = await authenticationService.refresh({
      ...payload,

      ipAddress: getClientIp(req),

      userAgent: getUserAgent(req),
    });

    return ApiResponse.success(
      res,
      authenticationResult,
      "Token refreshed successfully.",
      StatusCodes.OK,
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * ============================================================================
 * Logout
 * ============================================================================
 */

/**
 * Logout an authenticated session.
 *
 * Endpoint:
 *
 * POST /api/v1/auth/logout
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function logout(req, res, next) {
  try {
    const sessionId = req.auth?.sessionId;

    await authenticationService.logout({
      sessionId,
    });

    return ApiResponse.success(res, null, "Logout successful.", StatusCodes.OK);
  } catch (error) {
    return next(error);
  }
}

/**
 * ============================================================================
 * Current User
 * ============================================================================
 */

/**
 * Return the currently authenticated user's profile.
 *
 * Authentication middleware will populate `req.auth`.
 *
 * Expected principal:
 *
 * {
 *     userId: string,
 *     ...
 * }
 *
 * Endpoint:
 *
 * GET /api/v1/auth/me
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function me(req, res, next) {
  try {
    const userId = req.auth?.userId;

    const user = await authenticationService.getCurrentUser({
      userId,
    });

    return ApiResponse.success(
      res,
      user,
      "Authenticated user retrieved successfully.",
      StatusCodes.OK,
    );
  } catch (error) {
    return next(error);
  }
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const authenticationController = Object.freeze({
  login,
  refresh,
  logout,
  me,
});

export default authenticationController;
