/**
 * ============================================================================
 * Authentication Repository
 * ============================================================================
 *
 * Provides persistence operations required by the authentication module.
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Read and update user authentication state.
 * • Read and update authentication sessions.
 * • Persist refresh-token hashes.
 * • Revoke authentication sessions.
 * • Update login metadata.
 *
 * This repository intentionally contains NO:
 * ----------------------------------------------------------------------------
 * • Password hashing or comparison.
 * • JWT generation or verification.
 * • Authentication business rules.
 * • HTTP / Express logic.
 * • Request / response handling.
 * • Transaction BEGIN / COMMIT / ROLLBACK logic.
 *
 * Database access is performed through the application's query-executor
 * abstraction.
 *
 * Transaction rule
 * ----------------------------------------------------------------------------
 * Repositories receive an optional transaction context.
 *
 * Example:
 *
 * await executeTransaction(async (tx) => {
 *     await authRepository.revokeActiveSessions(userId, tx);
 *     await authRepository.createSession(session, tx);
 * });
 *
 * The repository never receives or manages a raw PostgreSQL client.
 *
 * ============================================================================
 */

import { getQueryExecutor } from "../../database/queryExecutor.js";

/**
 * ============================================================================
 * SQL
 * ============================================================================
 */

/**
 * Find a user by username or email.
 *
 * Username and email comparisons are case-insensitive.
 *
 * @type {string}
 */
const FIND_USER_BY_IDENTIFIER = `
    SELECT
        id,
        username,
        email,
        password_hash,
        status,
        failed_login_attempts,
        locked_until,
        email_verified_at,
        password_changed_at,
        last_login_at,
        last_login_ip,
        deactivated_at,
        created_at,
        updated_at
    FROM users
    WHERE
        LOWER(username) = LOWER($1)
        OR LOWER(email) = LOWER($1)
    LIMIT 1;
`;

/**
 * Find a user by UUID.
 *
 * @type {string}
 */
const FIND_USER_BY_ID = `
    SELECT
        id,
        username,
        first_name,
        last_name,
        TRIM(
            CONCAT_WS(
                ' ',
                first_name,
                last_name
            )
        ) AS full_name,
        email,
        password_hash,
        status,
        failed_login_attempts,
        locked_until,
        email_verified_at,
        password_changed_at,
        last_login_at,
        last_login_ip,
        deactivated_at,
        created_at,
        updated_at
    FROM users
    WHERE id = $1
    LIMIT 1;
`;

/**
 * Increment failed login attempts.
 *
 * The lock timestamp is supplied by the service layer so that authentication
 * policy remains outside the repository.
 *
 * @type {string}
 */
const INCREMENT_FAILED_LOGIN_ATTEMPTS = `
    UPDATE users
    SET
        failed_login_attempts = failed_login_attempts + 1,
        locked_until = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
        id,
        failed_login_attempts,
        locked_until,
        status;
`;

/**
 * Reset authentication failure state after successful authentication.
 *
 * @type {string}
 */
const RESET_LOGIN_SECURITY_STATE = `
    UPDATE users
    SET
        failed_login_attempts = 0,
        locked_until = NULL,
        status = CASE
            WHEN status = 'locked' THEN 'active'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
        id,
        status,
        failed_login_attempts,
        locked_until;
`;

/**
 * Update the user's last successful login metadata.
 *
 * @type {string}
 */
const UPDATE_LAST_LOGIN = `
    UPDATE users
    SET
        last_login_at = CURRENT_TIMESTAMP,
        last_login_ip = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
        id,
        last_login_at,
        last_login_ip;
`;

/**
 * Revoke all currently active sessions for a user.
 *
 * A session is considered active when it has not been revoked and has not
 * expired.
 *
 * @type {string}
 */
const REVOKE_ACTIVE_SESSIONS = `
    UPDATE user_sessions
    SET
        revoked_at = CURRENT_TIMESTAMP
    WHERE
        user_id = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    RETURNING id;
`;

/**
 * Create a new authentication session.
 *
 * @type {string}
 */
const CREATE_SESSION = `
    INSERT INTO user_sessions (
        id,
        user_id,
        refresh_token_hash,
        expires_at,
        ip_address,
        user_agent
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
    )
    RETURNING
        id,
        user_id,
        refresh_token_hash,
        expires_at,
        revoked_at,
        created_at,
        last_used_at,
        ip_address,
        user_agent;
`;

/**
 * Find an active authentication session by refresh-token hash and lock it
 * for the duration of the surrounding transaction.
 *
 * FOR UPDATE prevents concurrent refresh requests from rotating the same
 * session simultaneously.
 *
 * IMPORTANT:
 * This query must only be used with a transaction context.
 *
 * @type {string}
 */
const FIND_ACTIVE_SESSION_BY_REFRESH_TOKEN_HASH_FOR_UPDATE = `
    SELECT
        id,
        user_id,
        refresh_token_hash,
        expires_at,
        revoked_at,
        created_at,
        last_used_at,
        ip_address,
        user_agent
    FROM user_sessions
    WHERE
        refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
    FOR UPDATE;
`;

/**
 * Find a session by ID.
 *
 * @type {string}
 */
const FIND_SESSION_BY_ID = `
    SELECT
        id,
        user_id,
        refresh_token_hash,
        expires_at,
        revoked_at,
        created_at,
        last_used_at,
        ip_address,
        user_agent
    FROM user_sessions
    WHERE id = $1
    LIMIT 1;
`;

/**
 * Revoke a session.
 *
 * The WHERE condition makes the operation idempotent.
 *
 * @type {string}
 */
const REVOKE_SESSION = `
    UPDATE user_sessions
    SET
        revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
    WHERE id = $1
    RETURNING
        id,
        user_id,
        revoked_at;
`;

/**
 * Update the last-used timestamp of a session.
 *
 * @type {string}
 */
const TOUCH_SESSION = `
    UPDATE user_sessions
    SET
        last_used_at = CURRENT_TIMESTAMP
    WHERE
        id = $1
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    RETURNING
        id,
        last_used_at;
`;




/**
 * Find a session by ID and acquire a row-level PostgreSQL lock.
 *
 * Used during refresh-token rotation to ensure that the session being
 * rotated cannot be modified concurrently.
 *
 * @type {string}
 */
const FIND_SESSION_BY_ID_FOR_UPDATE = `
    SELECT
        id,
        user_id,
        refresh_token_hash,
        expires_at,
        revoked_at,
        created_at,
        last_used_at,
        ip_address,
        user_agent
    FROM user_sessions
    WHERE id = $1
    LIMIT 1
    FOR UPDATE;
`;




/**
 * ============================================================================
 * Internal Query Helpers
 * ============================================================================
 */

/**
 * Get the application's query executor.
 *
 * The executor transparently supports both transactional and non-transactional
 * execution according to the existing database abstraction.
 *
 * @param {object|undefined|null} transactionContext
 * @returns {object}
 */
const getExecutor = (transactionContext) =>
    getQueryExecutor(transactionContext);

/**
 * Return the first row from a PostgreSQL query result.
 *
 * @param {object} result
 * @returns {object|null}
 */
const firstRow = (result) =>
    result?.rows?.[0] ?? null;

/**
 * ============================================================================
 * User Repository Operations
 * ============================================================================
 */

/**
 * Find a user using username or email.
 *
 * @param {string} identifier
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function findUserByIdentifier(
    identifier,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_USER_BY_IDENTIFIER,
        [identifier],
    );

    return firstRow(result);
}

/**
 * Find a user by UUID.
 *
 * @param {string} userId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function findUserById(
    userId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_USER_BY_ID,
        [userId],
    );

    return firstRow(result);
}

/**
 * Increment failed authentication attempts.
 *
 * The repository does not decide when an account should be locked. The
 * authentication service supplies the resulting lock timestamp.
 *
 * @param {string} userId
 * @param {Date|null} lockedUntil
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function incrementFailedLoginAttempts(
    userId,
    lockedUntil,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        INCREMENT_FAILED_LOGIN_ATTEMPTS,
        [
            userId,
            lockedUntil,
        ],
    );

    return firstRow(result);
}

/**
 * Reset failed-login security state.
 *
 * @param {string} userId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function resetLoginSecurityState(
    userId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        RESET_LOGIN_SECURITY_STATE,
        [userId],
    );

    return firstRow(result);
}

/**
 * Update successful login metadata.
 *
 * @param {string} userId
 * @param {string|null} ipAddress
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function updateLastLogin(
    userId,
    ipAddress,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        UPDATE_LAST_LOGIN,
        [
            userId,
            ipAddress,
        ],
    );

    return firstRow(result);
}

/**
 * ============================================================================
 * Session Repository Operations
 * ============================================================================
 */

/**
 * Revoke all currently active sessions for a user.
 *
 * This is used during login to enforce the project's single-active-session
 * policy.
 *
 * @param {string} userId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<Array<object>>}
 */
async function revokeActiveSessions(
    userId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        REVOKE_ACTIVE_SESSIONS,
        [userId],
    );

    return result.rows;
}

/**
 * Create a persistent authentication session.
 *
 * @param {object} session
 * @param {string} session.id
 * @param {string} session.userId
 * @param {string} session.refreshTokenHash
 * @param {Date} session.expiresAt
 * @param {string|null} session.ipAddress
 * @param {string|null} session.userAgent
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function createSession(
    {
        id,
        userId,
        refreshTokenHash,
        expiresAt,
        ipAddress = null,
        userAgent = null,
    },
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        CREATE_SESSION,
        [
            id,
            userId,
            refreshTokenHash,
            expiresAt,
            ipAddress,
            userAgent,
        ],
    );

    return firstRow(result);
}


/**
 * Find an active authentication session using its refresh-token hash and
 * acquire a row-level PostgreSQL lock.
 *
 * This method MUST be called inside a PostgreSQL transaction when used for
 * refresh-token rotation.
 *
 * @param {string} refreshTokenHash
 * @param {object} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function findActiveSessionByRefreshTokenHashForUpdate(
    refreshTokenHash,
    transactionContext,
) {
    if (!transactionContext) {
        throw new TypeError(
            "A transaction context is required for a locked session lookup.",
        );
    }

    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_ACTIVE_SESSION_BY_REFRESH_TOKEN_HASH_FOR_UPDATE,
        [refreshTokenHash],
    );

    return firstRow(result);
}


/**
 * Find an active session using its refresh-token hash.
 *
 * Raw refresh tokens are never passed to this repository.
 *
 * @param {string} refreshTokenHash
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function findActiveSessionByRefreshTokenHash(
    refreshTokenHash,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_ACTIVE_SESSION_BY_REFRESH_TOKEN_HASH,
        [refreshTokenHash],
    );

    return firstRow(result);
}


/**
 * Find a session by ID while holding a PostgreSQL row lock.
 *
 * @param {string} sessionId
 * @param {object} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function findSessionByIdForUpdate(
    sessionId,
    transactionContext,
) {
    if (!transactionContext) {
        throw new TypeError(
            "A transaction context is required for a locked session lookup.",
        );
    }

    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_SESSION_BY_ID_FOR_UPDATE,
        [sessionId],
    );

    return firstRow(result);
}

/**
 * Find a session by UUID.
 *
 * @param {string} sessionId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function findSessionById(
    sessionId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        FIND_SESSION_BY_ID,
        [sessionId],
    );

    return firstRow(result);
}

/**
 * Revoke an authentication session.
 *
 * The operation is intentionally idempotent.
 *
 * @param {string} sessionId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function revokeSession(
    sessionId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        REVOKE_SESSION,
        [sessionId],
    );

    return firstRow(result);
}

/**
 * Update session activity timestamp.
 *
 * @param {string} sessionId
 * @param {object} [transactionContext]
 *
 * @returns {Promise<object|null>}
 */
async function touchSession(
    sessionId,
    transactionContext,
) {
    const executor = getExecutor(transactionContext);

    const result = await executor.query(
        TOUCH_SESSION,
        [sessionId],
    );

    return firstRow(result);
}

/**
 * ============================================================================
 * Public Repository API
 * ============================================================================
 */

const authRepository = Object.freeze({
    findUserByIdentifier,
    findUserById,

    incrementFailedLoginAttempts,
    resetLoginSecurityState,
    updateLastLogin,

    revokeActiveSessions,
    createSession,
    findActiveSessionByRefreshTokenHash,
    findActiveSessionByRefreshTokenHashForUpdate,
    findSessionById,
    findSessionByIdForUpdate,
    revokeSession,
    touchSession,
});

export default authRepository;