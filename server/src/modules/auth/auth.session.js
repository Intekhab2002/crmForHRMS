/**
 * ============================================================================
 * Authentication Session Service
 * ============================================================================
 *
 * Provides persistent authentication-session management for the authentication
 * module.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Create authentication sessions.
 * • Enforce the single-active-session policy.
 * • Validate refresh-token sessions.
 * • Rotate refresh tokens atomically.
 * • Revoke sessions.
 * • Update session activity metadata.
 *
 * Security model
 * ----------------------------------------------------------------------------
 * Refresh tokens are:
 *
 *     JWT
 *       ↓
 *     SHA-256 hash
 *       ↓
 *     persisted in user_sessions
 *
 * A refresh token is considered valid only when BOTH conditions are true:
 *
 *     1. JWT signature and claims are valid.
 *     2. Matching database session is active and valid.
 *
 * Refresh-token rotation is performed inside one PostgreSQL transaction:
 *
 *     BEGIN
 *       ↓
 *     SELECT session FOR UPDATE
 *       ↓
 *     validate session/user
 *       ↓
 *     revoke old session
 *       ↓
 *     create replacement session
 *       ↓
 *     COMMIT
 *
 * This prevents concurrent requests from successfully rotating the same
 * refresh token.
 *
 * ============================================================================
 */

import { randomUUID } from "node:crypto";

import { executeTransaction } from "../../database/transaction.js";
import AppError from "../../helpers/AppError.js";

import authRepository from "./auth.repository.js";
import tokenService from "./auth.tokens.js";

import {
    AUTH_ACCOUNT_STATUS,
    AUTH_ERROR_CODES,
    AUTH_SESSION_POLICY,
} from "./auth.constants.js";

/**
 * ============================================================================
 * Validation Helpers
 * ============================================================================
 */

/**
 * Validate a user identifier.
 *
 * @param {string} userId
 *
 * @throws {TypeError}
 */
function assertUserId(userId) {
    if (
        typeof userId !== "string" ||
        userId.length === 0
    ) {
        throw new TypeError(
            "A valid user ID is required.",
        );
    }
}

/**
 * Validate a session identifier.
 *
 * @param {string} sessionId
 *
 * @throws {TypeError}
 */
function assertSessionId(sessionId) {
    if (
        typeof sessionId !== "string" ||
        sessionId.length === 0
    ) {
        throw new TypeError(
            "A valid session ID is required.",
        );
    }
}

/**
 * Validate a refresh token.
 *
 * @param {string} refreshToken
 *
 * @throws {TypeError}
 */
function assertRefreshToken(refreshToken) {
    if (
        typeof refreshToken !== "string" ||
        refreshToken.length === 0
    ) {
        throw new TypeError(
            "A valid refresh token is required.",
        );
    }
}

/**
 * ============================================================================
 * Session Metadata
 * ============================================================================
 */

/**
 * Normalize an IP address before persistence.
 *
 * PostgreSQL validates the final value against the `inet` column type.
 *
 * @param {string|null|undefined} ipAddress
 *
 * @returns {string|null}
 */
function normalizeIpAddress(ipAddress) {
    if (
        typeof ipAddress !== "string" ||
        ipAddress.trim().length === 0
    ) {
        return null;
    }

    return ipAddress.trim();
}

/**
 * Normalize a user-agent value before persistence.
 *
 * @param {string|null|undefined} userAgent
 *
 * @returns {string|null}
 */
function normalizeUserAgent(userAgent) {
    if (
        typeof userAgent !== "string" ||
        userAgent.trim().length === 0
    ) {
        return null;
    }

    return userAgent.trim();
}

/**
 * ============================================================================
 * Refresh Token Expiration
 * ============================================================================
 */

/**
 * Convert a JWT expiration timestamp into a JavaScript Date.
 *
 * JWT `exp` is expressed as seconds since Unix epoch.
 *
 * @param {object} tokenPayload
 *
 * @returns {Date}
 *
 * @throws {AppError}
 */
function getTokenExpirationDate(tokenPayload) {
    if (
        !tokenPayload ||
        !Number.isInteger(tokenPayload.exp)
    ) {
        throw new AppError({
            message:
                "Unable to determine authentication session expiration.",
            statusCode: 500,
            code:
                AUTH_ERROR_CODES.INVALID_AUTHENTICATION_STATE,
        });
    }

    return new Date(
        tokenPayload.exp * 1000,
    );
}

/**
 * ============================================================================
 * User Validation
 * ============================================================================
 */

/**
 * Validate whether a user is allowed to maintain an authentication session.
 *
 * @param {object} user
 *
 * @throws {AppError}
 */
function assertUserCanMaintainSession(user) {
    if (!user) {
        throw new AppError({
            message:
                "Authentication session is invalid.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.SESSION_NOT_FOUND,
        });
    }

    if (
        user.status === AUTH_ACCOUNT_STATUS.PENDING
    ) {
        throw new AppError({
            message:
                "User account is pending activation.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.ACCOUNT_PENDING,
        });
    }

    if (
        user.status === AUTH_ACCOUNT_STATUS.INACTIVE
    ) {
        throw new AppError({
            message:
                "User account is inactive.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
        });
    }

    if (
        user.status === AUTH_ACCOUNT_STATUS.SUSPENDED
    ) {
        throw new AppError({
            message:
                "User account is suspended.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.ACCOUNT_SUSPENDED,
        });
    }

    if (
        user.status === AUTH_ACCOUNT_STATUS.LOCKED
    ) {
        throw new AppError({
            message:
                "User account is locked.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.ACCOUNT_LOCKED,
        });
    }

    if (
        user.status !== AUTH_ACCOUNT_STATUS.ACTIVE
    ) {
        throw new AppError({
            message:
                "User account is not active.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.INVALID_AUTHENTICATION_STATE,
        });
    }

    if (user.deactivated_at) {
        throw new AppError({
            message:
                "User account has been deactivated.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.ACCOUNT_DEACTIVATED,
        });
    }
}

/**
 * ============================================================================
 * Create Session
 * ============================================================================
 */

/**
 * Create a new authentication session.
 *
 * The single-active-session policy is enforced within the same transaction
 * that creates the new session.
 *
 * @param {object} parameters
 * @param {string} parameters.userId
 * @param {string|null} [parameters.ipAddress]
 * @param {string|null} [parameters.userAgent]
 *
 * @returns {Promise<{
 *     session: object,
 *     refreshToken: string
 * }>}
 */
async function createSession({
    userId,
    ipAddress = null,
    userAgent = null,
}) {
    assertUserId(userId);

    const normalizedIpAddress =
        normalizeIpAddress(ipAddress);

    const normalizedUserAgent =
        normalizeUserAgent(userAgent);

    return executeTransaction(
        async (transactionContext) => {
            /**
             * ---------------------------------------------------------------
             * Enforce one active session per user.
             * ---------------------------------------------------------------
             */
            if (
                AUTH_SESSION_POLICY.SINGLE_ACTIVE_SESSION
            ) {
                await authRepository.revokeActiveSessions(
                    userId,
                    transactionContext,
                );
            }

            /**
             * ---------------------------------------------------------------
             * Generate session identifier.
             * ---------------------------------------------------------------
             */
            const sessionId = randomUUID();

            /**
             * ---------------------------------------------------------------
             * Generate refresh token bound to this session.
             * ---------------------------------------------------------------
             */
            const refreshToken =
                tokenService.generateRefreshToken({
                    userId,
                    sessionId,
                });

            /**
             * ---------------------------------------------------------------
             * Hash refresh token before persistence.
             * ---------------------------------------------------------------
             */
            const refreshTokenHash =
                tokenService.hashRefreshToken(
                    refreshToken,
                );

            /**
             * ---------------------------------------------------------------
             * Decode locally generated token to obtain expiration.
             *
             * This is NOT authentication/validation. The token was generated
             * immediately above by our own token service.
             * ---------------------------------------------------------------
             */
            const tokenPayload =
                tokenService.decodeToken(
                    refreshToken,
                );

            const expiresAt =
                getTokenExpirationDate(
                    tokenPayload,
                );

            /**
             * ---------------------------------------------------------------
             * Persist session.
             * ---------------------------------------------------------------
             */
            const session =
                await authRepository.createSession(
                    {
                        id: sessionId,
                        userId,
                        refreshTokenHash,
                        expiresAt,
                        ipAddress:
                            normalizedIpAddress,
                        userAgent:
                            normalizedUserAgent,
                    },
                    transactionContext,
                );

            if (!session) {
                throw new AppError({
                    message:
                        "Authentication session could not be created.",
                    statusCode: 500,
                    code:
                        AUTH_ERROR_CODES.INVALID_AUTHENTICATION_STATE,
                });
            }

            return {
                session,
                refreshToken,
            };
        },
    );
}

/**
 * ============================================================================
 * Atomic Refresh Token Rotation
 * ============================================================================
 */

/**
 * Validate and rotate a refresh token atomically.
 *
 * IMPORTANT:
 * The database session lookup is performed with a row-level PostgreSQL lock.
 *
 * The following operations therefore happen inside one transaction:
 *
 *     verify JWT
 *     ↓
 *     hash refresh token
 *     ↓
 *     SELECT ... FOR UPDATE
 *     ↓
 *     validate session
 *     ↓
 *     validate user
 *     ↓
 *     revoke old session
 *     ↓
 *     create new session
 *
 * @param {object} parameters
 * @param {string} parameters.refreshToken
 * @param {string|null} [parameters.ipAddress]
 * @param {string|null} [parameters.userAgent]
 *
 * @returns {Promise<{
 *     session: object,
 *     refreshToken: string,
 *     user: object
 * }>}
 */
async function rotateSession({
    refreshToken,
    ipAddress = null,
    userAgent = null,
}) {
    assertRefreshToken(refreshToken);

    /**
     * ------------------------------------------------------------------------
     * JWT validation happens before opening the database transaction.
     * ------------------------------------------------------------------------
     *
     * An invalidly signed/malformed/expired JWT should not consume a database
     * connection merely to discover that it is invalid.
     */
    const tokenPayload =
        tokenService.verifyRefreshToken(
            refreshToken,
        );

    const refreshTokenHash =
        tokenService.hashRefreshToken(
            refreshToken,
        );

    const normalizedIpAddress =
        normalizeIpAddress(ipAddress);

    const normalizedUserAgent =
        normalizeUserAgent(userAgent);

    return executeTransaction(
        async (transactionContext) => {
            /**
             * ---------------------------------------------------------------
             * LOCK THE SESSION ROW
             * ---------------------------------------------------------------
             *
             * This is the critical concurrency-control step.
             *
             * If another request is already rotating this session, PostgreSQL
             * waits until that transaction completes.
             */
            const session =
                await authRepository
                    .findActiveSessionByRefreshTokenHashForUpdate(
                        refreshTokenHash,
                        transactionContext,
                    );

            if (!session) {
                throw new AppError({
                    message:
                        "Authentication session is invalid or has expired.",
                    statusCode: 401,
                    code:
                        AUTH_ERROR_CODES.INVALID_REFRESH_TOKEN,
                });
            }

            /**
             * ---------------------------------------------------------------
             * Bind JWT to database session.
             * ---------------------------------------------------------------
             */
            if (
                session.id !== tokenPayload.sid
            ) {
                throw new AppError({
                    message:
                        "Authentication session is invalid.",
                    statusCode: 401,
                    code:
                        AUTH_ERROR_CODES.SESSION_MISMATCH,
                });
            }

            if (
                session.user_id !== tokenPayload.sub
            ) {
                throw new AppError({
                    message:
                        "Authentication session is invalid.",
                    statusCode: 401,
                    code:
                        AUTH_ERROR_CODES.SESSION_MISMATCH,
                });
            }

            /**
             * ---------------------------------------------------------------
             * Resolve user inside the same transaction.
             * ---------------------------------------------------------------
             */
            const user =
                await authRepository.findUserById(
                    session.user_id,
                    transactionContext,
                );

            assertUserCanMaintainSession(user);

            /**
             * ---------------------------------------------------------------
             * Revoke current session.
             * ---------------------------------------------------------------
             */
            const revokedSession =
                await authRepository.revokeSession(
                    session.id,
                    transactionContext,
                );

            if (!revokedSession) {
                throw new AppError({
                    message:
                        "Authentication session could not be revoked.",
                    statusCode: 500,
                    code:
                        AUTH_ERROR_CODES.INVALID_AUTHENTICATION_STATE,
                });
            }

            /**
             * ---------------------------------------------------------------
             * Generate replacement session.
             * ---------------------------------------------------------------
             */
            const newSessionId =
                randomUUID();

            const newRefreshToken =
                tokenService.generateRefreshToken({
                    userId: user.id,
                    sessionId: newSessionId,
                });

            const newRefreshTokenHash =
                tokenService.hashRefreshToken(
                    newRefreshToken,
                );

            const newTokenPayload =
                tokenService.decodeToken(
                    newRefreshToken,
                );

            const expiresAt =
                getTokenExpirationDate(
                    newTokenPayload,
                );

            /**
             * ---------------------------------------------------------------
             * Persist replacement session.
             * ---------------------------------------------------------------
             */
            const newSession =
                await authRepository.createSession(
                    {
                        id: newSessionId,
                        userId: user.id,
                        refreshTokenHash:
                            newRefreshTokenHash,
                        expiresAt,
                        ipAddress:
                            normalizedIpAddress,
                        userAgent:
                            normalizedUserAgent,
                    },
                    transactionContext,
                );

            if (!newSession) {
                throw new AppError({
                    message:
                        "Authentication session could not be rotated.",
                    statusCode: 500,
                    code:
                        AUTH_ERROR_CODES.INVALID_AUTHENTICATION_STATE,
                });
            }

            /**
             * ---------------------------------------------------------------
             * Transaction commits automatically after this callback returns.
             * ---------------------------------------------------------------
             */
            return {
                session: newSession,
                refreshToken:
                    newRefreshToken,
                user,
            };
        },
    );
}

/**
 * ============================================================================
 * Session Validation
 * ============================================================================
 */

/**
 * Validate an active authentication session using its session ID.
 *
 * This method is intended for operations where the authenticated session
 * already exists, such as logout or future session-management functionality.
 *
 * @param {string} sessionId
 *
 * @returns {Promise<object>}
 */
async function validateSession(
    sessionId,
) {
    assertSessionId(sessionId);

    const session =
        await authRepository.findSessionById(
            sessionId,
        );

    if (!session) {
        throw new AppError({
            message:
                "Authentication session was not found.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.SESSION_NOT_FOUND,
        });
    }

    if (session.revoked_at) {
        throw new AppError({
            message:
                "Authentication session has been revoked.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.SESSION_REVOKED,
        });
    }

    if (
        new Date(session.expires_at) <=
        new Date()
    ) {
        throw new AppError({
            message:
                "Authentication session has expired.",
            statusCode: 401,
            code:
                AUTH_ERROR_CODES.SESSION_EXPIRED,
        });
    }

    return session;
}

/**
 * ============================================================================
 * Revoke Session
 * ============================================================================
 */

/**
 * Revoke one authentication session.
 *
 * The operation is intentionally idempotent at the service level.
 *
 * @param {string} sessionId
 *
 * @returns {Promise<object|null>}
 */
async function revokeSession(
    sessionId,
) {
    assertSessionId(sessionId);

    return authRepository.revokeSession(
        sessionId,
    );
}

/**
 * ============================================================================
 * Revoke User Sessions
 * ============================================================================
 */

/**
 * Revoke all active sessions belonging to a user.
 *
 * @param {string} userId
 *
 * @returns {Promise<object>}
 */
async function revokeUserSessions(
    userId,
) {
    assertUserId(userId);

    return executeTransaction(
        async (transactionContext) =>
            authRepository.revokeActiveSessions(
                userId,
                transactionContext,
            ),
    );
}

/**
 * ============================================================================
 * Session Activity
 * ============================================================================
 */

/**
 * Update the last-used timestamp for a session.
 *
 * @param {string} sessionId
 *
 * @returns {Promise<object|null>}
 */
async function touchSession(
    sessionId,
) {
    assertSessionId(sessionId);

    return authRepository.touchSession(
        sessionId,
    );
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const sessionService = Object.freeze({
    createSession,
    rotateSession,
    validateSession,
    revokeSession,
    revokeUserSessions,
    touchSession,
});

export default sessionService;