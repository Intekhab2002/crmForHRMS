/**
 * ============================================================================
 * Authentication Password Service
 * ============================================================================
 *
 * Provides secure password hashing and password verification for the
 * authentication module.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Hash plaintext passwords using bcrypt.
 * • Compare plaintext passwords against bcrypt hashes.
 *
 * This module intentionally does NOT:
 * ----------------------------------------------------------------------------
 * • Validate password policy.
 * • Manage users.
 * • Generate JWTs.
 * • Generate refresh tokens.
 * • Manage authentication sessions.
 * • Handle Express requests/responses.
 * • Log passwords or password hashes.
 *
 * Security
 * ----------------------------------------------------------------------------
 * Passwords must never be logged, persisted as plaintext, returned in API
 * responses, or placed inside JWT claims.
 *
 * ============================================================================
 */

import bcrypt from "bcryptjs";

import appConfig from "../../config/app.config.js";

/**
 * Resolve the configured bcrypt cost factor.
 *
 * The authentication implementation must consume configuration rather than
 * embedding an environment-specific value in the source code.
 *
 * The exact configuration property depends on the finalized JWT/security
 * configuration exposed by app.config.js.
 *
 * @returns {number}
 */
const getSaltRounds = () => {
    const configuredRounds =
        appConfig?.security?.bcryptSaltRounds;
    if (
        !Number.isInteger(configuredRounds) ||
        configuredRounds < 10 ||
        configuredRounds > 31
    ) {
        throw new Error(
            "Invalid bcrypt salt-round configuration.",
        );
    }

    return configuredRounds;
};

/**
 * Hash a plaintext password.
 *
 * bcrypt generates a cryptographically random salt internally and embeds the
 * salt information into the resulting bcrypt hash.
 *
 * @param {string} password
 *
 * @returns {Promise<string>}
 *
 * @throws {TypeError}
 * @throws {Error}
 */
async function hashPassword(password) {
    if (typeof password !== "string") {
        throw new TypeError(
            "Password must be a string.",
        );
    }

    if (password.length === 0) {
        throw new Error(
            "Password cannot be empty.",
        );
    }

    return bcrypt.hash(
        password,
        getSaltRounds(),
    );
}

/**
 * Compare a plaintext password against a bcrypt password hash.
 *
 * The method returns false for an invalid password rather than throwing an
 * authentication error. Authentication policy belongs to the authentication
 * service.
 *
 * @param {string} password
 * @param {string} passwordHash
 *
 * @returns {Promise<boolean>}
 *
 * @throws {TypeError}
 */
async function verifyPassword(
    password,
    passwordHash,
) {
    if (typeof password !== "string") {
        throw new TypeError(
            "Password must be a string.",
        );
    }

    if (typeof passwordHash !== "string") {
        throw new TypeError(
            "Password hash must be a string.",
        );
    }

    if (
        password.length === 0 ||
        passwordHash.length === 0
    ) {
        return false;
    }

    return bcrypt.compare(
        password,
        passwordHash,
    );
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const passwordService = Object.freeze({
    hashPassword,
    verifyPassword,
});

export default passwordService;