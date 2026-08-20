/**
 * ============================================================================
 * Authentication Token Service
 * ============================================================================
 *
 * Provides JWT access-token and refresh-token operations for the
 * authentication module.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Generate access tokens.
 * • Generate refresh tokens.
 * • Verify JWT signatures and registered claims.
 * • Generate cryptographically strong token identifiers.
 * • Hash refresh tokens before database persistence.
 *
 * This module intentionally does NOT:
 * ----------------------------------------------------------------------------
 * • Manage users.
 * • Manage authentication sessions.
 * • Query PostgreSQL.
 * • Perform authorization.
 * • Handle Express requests/responses.
 * • Implement login/logout business logic.
 * • Store tokens.
 *
 * Security model
 * ----------------------------------------------------------------------------
 * Access tokens:
 *
 *     Short-lived JWT
 *     ↓
 *     Used to authenticate API requests
 *
 * Refresh tokens:
 *
 *     Long-lived JWT
 *     ↓
 *     Bound to a persistent database session
 *     ↓
 *     Only the SHA-256 hash is persisted
 *
 * A valid JWT refresh token is NOT sufficient for authentication.
 * The authentication/session layer must also validate the corresponding
 * persistent database session.
 *
 * ============================================================================
 */

import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

import appConfig from "../../config/app.config.js";

/**
 * jsonwebtoken exposes these constructors through the CommonJS default
 * export. Direct named ESM imports are intentionally avoided for compatibility.
 */
const {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError,
} = jwt;

/**
 * ============================================================================
 * Constants
 * ============================================================================
 */

/**
 * Supported JWT algorithms.
 *
 * HS256 is used because the existing configuration uses a symmetric JWT secret.
 *
 * Restricting the algorithm during verification prevents algorithm-confusion
 * attacks where a token could otherwise be accepted using an unintended
 * algorithm.
 *
 * @type {string}
 */
const JWT_ALGORITHM = "HS256";

/**
 * Token types.
 *
 * @type {object}
 */
const TOKEN_TYPES = Object.freeze({
    ACCESS: "access",
    REFRESH: "refresh",
});

/**
 * ============================================================================
 * Configuration
 * ============================================================================
 */

/**
 * Return the configured JWT secret.
 *
 * @returns {string}
 *
 * @throws {Error} When the JWT secret is missing or invalid.
 */
function getJwtSecret() {
    const secret = appConfig?.jwt?.secret;

    if (
        typeof secret !== "string" ||
        secret.length < 32
    ) {
        throw new Error(
            "JWT secret is missing or does not meet the minimum security requirement.",
        );
    }

    return secret;
}

/**
 * Return the configured access-token expiration.
 *
 * @returns {string|number}
 *
 * @throws {Error} When the configuration is missing.
 */
function getAccessTokenExpiration() {
    const expiresIn = appConfig?.jwt?.expiresIn;

    if (
        typeof expiresIn !== "string" &&
        !Number.isInteger(expiresIn)
    ) {
        throw new Error(
            "JWT access-token expiration is not configured correctly.",
        );
    }

    return expiresIn;
}

/**
 * Return the configured refresh-token expiration.
 *
 * @returns {string|number}
 *
 * @throws {Error} When the configuration is missing.
 */
function getRefreshTokenExpiration() {
    const expiresIn = appConfig?.jwt?.refreshExpiresIn;

    if (
        typeof expiresIn !== "string" &&
        !Number.isInteger(expiresIn)
    ) {
        throw new Error(
            "JWT refresh-token expiration is not configured correctly.",
        );
    }

    return expiresIn;
}

/**
 * ============================================================================
 * Cryptographic Helpers
 * ============================================================================
 */

/**
 * Generate a cryptographically secure token identifier.
 *
 * `randomBytes()` obtains entropy from Node.js's cryptographically secure
 * random number generator.
 *
 * @returns {string}
 */
function generateTokenIdentifier() {
    return randomBytes(32).toString("hex");
}

/**
 * Hash a refresh token using SHA-256.
 *
 * The resulting hexadecimal digest is exactly 64 characters and therefore
 * matches the database `VARCHAR(64)` refresh-token hash column.
 *
 * @param {string} refreshToken
 *
 * @returns {string}
 *
 * @throws {TypeError} When the supplied token is not a string.
 */
function hashRefreshToken(refreshToken) {
    if (typeof refreshToken !== "string") {
        throw new TypeError(
            "Refresh token must be a string.",
        );
    }

    return createHash("sha256")
        .update(refreshToken, "utf8")
        .digest("hex");
}

/**
 * ============================================================================
 * Access Token
 * ============================================================================
 */

/**
 * Generate an access token.
 *
 * Only authentication-related claims are included.
 *
 * Claims:
 *
 *     sub
 *     jti
 *     type
 *
 * `iat` and `exp` are automatically generated by jsonwebtoken.
 *
 * @param {object} parameters
 * @param {string} parameters.userId
 *
 * @returns {string}
 */
function generateAccessToken({
    userId,
      sessionId,
}) {
    if (
        typeof userId !== "string" ||
        userId.length === 0
    ) {
        throw new TypeError(
            "A valid user ID is required to generate an access token.",
        );
    }
  if (
        typeof sessionId !== "string" ||
        sessionId.length === 0
    ) {
        throw new TypeError(
            "A valid session ID is required to generate an access token.",
        );
    }
    const payload = {
        sub: userId,
        sid: sessionId,
        jti: generateTokenIdentifier(),
        type: TOKEN_TYPES.ACCESS,
    };

    return jwt.sign(
        payload,
        getJwtSecret(),
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: getAccessTokenExpiration(),
        },
    );
}

/**
 * ============================================================================
 * Refresh Token
 * ============================================================================
 */

/**
 * Generate a refresh token.
 *
 * The refresh token is intentionally generated as a signed JWT because the
 * authentication flow requires JWT validation before the persistent session
 * lookup.
 *
 * A cryptographically strong random `jti` is included so that every issued
 * refresh token receives a unique, high-entropy identifier.
 *
 * The refresh token itself is never persisted.
 *
 * @param {object} parameters
 * @param {string} parameters.userId
 * @param {string} parameters.sessionId
 *
 * @returns {string}
 */
function generateRefreshToken({
    userId,
    sessionId,
}) {
    if (
        typeof userId !== "string" ||
        userId.length === 0
    ) {
        throw new TypeError(
            "A valid user ID is required to generate a refresh token.",
        );
    }

    if (
        typeof sessionId !== "string" ||
        sessionId.length === 0
    ) {
        throw new TypeError(
            "A valid session ID is required to generate a refresh token.",
        );
    }

    const payload = {
        sub: userId,
        jti: generateTokenIdentifier(),
        sid: sessionId,
        type: TOKEN_TYPES.REFRESH,
    };

    return jwt.sign(
        payload,
        getJwtSecret(),
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: getRefreshTokenExpiration(),
        },
    );
}

/**
 * ============================================================================
 * JWT Verification
 * ============================================================================
 */

/**
 * Verify an access token.
 *
 * Algorithm and token type are explicitly validated.
 *
 * @param {string} token
 *
 * @returns {object}
 *
 * @throws {Error}
 */
function verifyAccessToken(token) {
    const decoded = verifyToken(token);

    if (decoded.type !== TOKEN_TYPES.ACCESS) {
        throw new JsonWebTokenError(
            "Invalid access token type.",
        );
    }

    return decoded;
}

/**
 * Verify a refresh token.
 *
 * Algorithm, token type, user ID and session ID are validated.
 *
 * @param {string} token
 *
 * @returns {object}
 *
 * @throws {Error}
 */
function verifyRefreshToken(token) {
    const decoded = verifyToken(token);

    if (decoded.type !== TOKEN_TYPES.REFRESH) {
        throw new JsonWebTokenError(
            "Invalid refresh token type.",
        );
    }

    if (
        typeof decoded.sub !== "string" ||
        decoded.sub.length === 0
    ) {
        throw new JsonWebTokenError(
            "Refresh token does not contain a valid subject.",
        );
    }

    if (
        typeof decoded.sid !== "string" ||
        decoded.sid.length === 0
    ) {
        throw new JsonWebTokenError(
            "Refresh token does not contain a valid session identifier.",
        );
    }

    return decoded;
}

/**
 * Verify a JWT with the application's security policy.
 *
 * @param {string} token
 *
 * @returns {object}
 *
 * @throws {JsonWebTokenError}
 * @throws {TokenExpiredError}
 * @throws {NotBeforeError}
 */
function verifyToken(token) {
    if (
        typeof token !== "string" ||
        token.length === 0
    ) {
        throw new JsonWebTokenError(
            "JWT must be a non-empty string.",
        );
    }

    return jwt.verify(
        token,
        getJwtSecret(),
        {
            algorithms: [JWT_ALGORITHM],
        },
    );
}

/**
 * ============================================================================
 * Token Error Classification
 * ============================================================================
 */

/**
 * Determine whether an error is a JWT expiration error.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isTokenExpiredError(error) {
    return error instanceof TokenExpiredError;
}

/**
 * Determine whether an error is a JWT signature/format error.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isJsonWebTokenError(error) {
    return error instanceof JsonWebTokenError;
}

/**
 * Determine whether an error is a JWT "not active yet" error.
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function isTokenNotBeforeError(error) {
    return error instanceof NotBeforeError;
}


/**
 * Decode a locally generated JWT without performing authentication.
 *
 * This method is intended only for extracting non-security-sensitive metadata
 * such as the already-issued token's expiration timestamp.
 *
 * It must NEVER be used as a replacement for verifyAccessToken() or
 * verifyRefreshToken().
 *
 * @param {string} token
 *
 * @returns {object|null}
 */
function decodeToken(token) {
    if (
        typeof token !== "string" ||
        token.length === 0
    ) {
        return null;
    }

    const decoded = jwt.decode(token);

    return decoded && typeof decoded === "object"
        ? decoded
        : null;
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */




const tokenService = Object.freeze({
    generateAccessToken,
    generateRefreshToken,

    verifyAccessToken,
    verifyRefreshToken,

    hashRefreshToken,
    decodeToken,

    isTokenExpiredError,
    isJsonWebTokenError,
    isTokenNotBeforeError,
});

export default tokenService;