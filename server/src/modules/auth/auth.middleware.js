/**
 * ============================================================================
 * Authentication Middleware
 * ============================================================================
 *
 * Authenticates requests using a Bearer access token and verifies that the
 * database-backed authentication session associated with the token is still
 * active.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Read the Authorization header.
 * • Extract the Bearer access token.
 * • Verify the JWT through the token service.
 * • Validate required authentication claims.
 * • Validate the corresponding database session.
 * • Attach the authenticated principal to req.auth.
 *
 * This middleware does NOT:
 * • Authenticate username/password.
 * • Verify refresh tokens.
 * • Manage login/session creation.
 * • Perform RBAC/permission checks.
 * • Query business resources.
 *
 * ============================================================================
 */

import AppError from "../../helpers/AppError.js";

import authRepository from "./auth.repository.js";
import tokenService from "./auth.tokens.js";
import authConstants from "./auth.constants.js";

const {
    AUTH_HEADERS,
    AUTH_ERROR_CODES,
} = authConstants;

/**
 * ============================================================================
 * Access Token Extraction
 * ============================================================================
 */

/**
 * Extract the Bearer token from the Authorization header.
 *
 * @param {import("express").Request} req
 *
 * @returns {string}
 *
 * @throws {AppError}
 */
function extractAccessToken(req) {
    const authorization =
        req.get(
            AUTH_HEADERS.AUTHORIZATION,
        );

    if (
        typeof authorization !== "string" ||
        authorization.trim().length === 0
    ) {
        throw AppError.unauthorized(
            "Authentication is required.",
            [],
            AUTH_ERROR_CODES.ACCESS_TOKEN_REQUIRED,
        );
    }

    const [
        scheme,
        token,
        ...extraParts
    ] =
        authorization
            .trim()
            .split(/\s+/);

    if (
        scheme?.toLowerCase() !== "bearer" ||
        !token ||
        extraParts.length > 0
    ) {
        throw AppError.unauthorized(
            "Invalid authorization header.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    return token;
}

/**
 * ============================================================================
 * JWT Principal Validation
 * ============================================================================
 */

/**
 * Validate the claims required by the application.
 *
 * The token service remains responsible for cryptographic JWT verification.
 * This middleware validates the claims required to identify the authenticated
 * user and its persistent authentication session.
 *
 * @param {object} payload
 *
 * @returns {{
 *     userId: string,
 *     sessionId: string,
 *     tokenId: string|null
 * }}
 *
 * @throws {AppError}
 */
function buildAuthenticatedPrincipal(payload) {
    const userId =
        typeof payload?.sub === "string"
            ? payload.sub
            : null;

    const sessionId =
        typeof payload?.sid === "string"
            ? payload.sid
            : null;

    const tokenId =
        typeof payload?.jti === "string"
            ? payload.jti
            : null;

    /**
     * An access token must identify both:
     *
     * 1. The authenticated user.
     * 2. The persistent authentication session.
     *
     * Without the session ID, logout cannot invalidate an otherwise-valid JWT.
     */
    if (!userId || !sessionId) {
        throw AppError.unauthorized(
            "Invalid access token.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    return Object.freeze({
        userId,
        sessionId,
        tokenId,
    });
}

/**
 * ============================================================================
 * Session Validation
 * ============================================================================
 */

/**
 * Validate that the persistent authentication session associated with the
 * access token is still active.
 *
 * The JWT is stateless by itself. The database session provides the server-side
 * revocation mechanism required for logout and session invalidation.
 *
 * @param {object} principal
 * @param {string} principal.userId
 * @param {string} principal.sessionId
 *
 * @returns {Promise<object>}
 *
 * @throws {AppError}
 */
async function validateAuthenticationSession({
    userId,
    sessionId,
}) {
    const session =
        await authRepository.findSessionById(
            sessionId,
        );

    /**
     * A valid JWT must correspond to an existing database session.
     */
    if (!session) {
        throw AppError.unauthorized(
            "Authentication session is invalid or has expired.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    /**
     * The session must belong to the same user represented by the JWT.
     *
     * This prevents a valid session identifier from being paired with a
     * different user's access token.
     */
    if (
        session.user_id !== userId
    ) {
        throw AppError.unauthorized(
            "Authentication session is invalid or has expired.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    /**
     * Logout and session invalidation are represented by revoked_at.
     */
    if (session.revoked_at) {
        throw AppError.unauthorized(
            "Authentication session is invalid or has expired.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    /**
     * The database expiration timestamp is independently checked even though
     * the JWT itself has an expiration claim.
     *
     * This gives the server-side session lifecycle authoritative control.
     */
    if (
        session.expires_at &&
        new Date(session.expires_at) <= new Date()
    ) {
        throw AppError.unauthorized(
            "Authentication session is invalid or has expired.",
            [],
            AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
        );
    }

    return session;
}

/**
 * ============================================================================
 * Authentication
 * ============================================================================
 */

/**
 * Authenticate an incoming request.
 *
 * Authentication consists of two independent validations:
 *
 *     1. JWT cryptographic validation.
 *     2. Persistent database-session validation.
 *
 * Both must succeed before the request is considered authenticated.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 *
 * @returns {Promise<void>}
 */
async function authenticate(
    req,
    res,
    next,
) {
    try {
        const accessToken =
            extractAccessToken(req);

        let payload;

        try {
            payload =
                tokenService.verifyAccessToken(
                    accessToken,
                );
        } catch (error) {
            /**
             * Token-service JWT errors are deliberately normalized here so
             * clients do not receive implementation-specific JWT details.
             */
            if (
                tokenService.isTokenExpiredError(
                    error,
                ) ||
                tokenService.isJsonWebTokenError(
                    error,
                ) ||
                tokenService.isTokenNotBeforeError(
                    error,
                )
            ) {
                throw AppError.unauthorized(
                    "Invalid or expired access token.",
                    [],
                    AUTH_ERROR_CODES.INVALID_ACCESS_TOKEN,
                );
            }

            throw error;
        }

        /**
         * Validate the JWT claims required by the authentication architecture.
         */
        const principal =
            buildAuthenticatedPrincipal(
                payload,
            );

        /**
         * Validate the corresponding persistent database session.
         *
         * This is what makes logout effective immediately for access tokens.
         */
        await validateAuthenticationSession(
            principal,
        );

        /**
         * Attach only the authenticated principal to the request.
         *
         * Session persistence details remain inside the authentication layer.
         */
        req.auth = principal;

        return next();
    } catch (error) {
        return next(error);
    }
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const authMiddleware =
    Object.freeze({
        authenticate,
    });

export default authMiddleware;