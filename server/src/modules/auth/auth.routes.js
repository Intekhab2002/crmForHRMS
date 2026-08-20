/**
 * ============================================================================
 * Authentication Routes
 * ============================================================================
 *
 * Defines HTTP routes for authentication and session management.
 *
 * Route responsibilities
 * ----------------------------------------------------------------------------
 * • Define authentication endpoint paths.
 * • Apply authentication middleware to protected endpoints.
 * • Delegate request handling to the authentication controller.
 *
 * Business logic belongs to:
 *
 *     auth.service.js
 *
 * HTTP handling belongs to:
 *
 *     auth.controller.js
 *
 * Authentication enforcement belongs to:
 *
 *     authentication.middleware.js
 *
 * ============================================================================
 */

import { Router } from "express";

import authenticationController from "./auth.controller.js";
import authenticationMiddleware from "./auth.middleware.js";
import authConstants from "./auth.constants.js";
import {
    createAuthenticationRateLimiter,
} from "../../config/security/rateLimit.config.js";

const {
    AUTH_ROUTES,
} = authConstants;

const router = Router();


/**
 * ============================================================================
 * Authentication Rate Limiter
 * ============================================================================
 *
 * Login and refresh are credential-sensitive endpoints.
 *
 * The stricter authentication-specific limiter is intentionally scoped to
 * these endpoints instead of being applied to the entire authentication
 * router.
 */
const authenticationRateLimiter =
    createAuthenticationRateLimiter();



/**
 * ============================================================================
 * Public Authentication Routes
 * ============================================================================
 */

/**
 * User login.
 *
 * POST /auth/login
 */
router.post(
    AUTH_ROUTES.LOGIN,
    authenticationRateLimiter,
    authenticationController.login,
);

/**
 * Refresh an authentication session.
 *
 * POST /auth/refresh
 *
 * This endpoint is intentionally public from the access-token perspective.
 * The refresh token itself is the credential being authenticated.
 */
router.post(
    AUTH_ROUTES.REFRESH,
    authenticationRateLimiter,
    authenticationController.refresh,
);

/**
 * ============================================================================
 * Protected Authentication Routes
 * ============================================================================
 */

/**
 * Logout.
 *
 * POST /auth/logout
 *
 * Requires a valid access token.
 */
router.post(
    AUTH_ROUTES.LOGOUT,
    authenticationMiddleware.authenticate,
    authenticationController.logout,
);

/**
 * Current authenticated user.
 *
 * GET /auth/me
 *
 * Requires a valid access token.
 */
router.get(
    AUTH_ROUTES.ME,
    authenticationMiddleware.authenticate,
    authenticationController.me,
);

export default router;