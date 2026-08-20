/**
 * ============================================================================
 * CRM for HRMS
 * User Repository
 * ============================================================================
 *
 * Responsibilities:
 *
 * - User persistence.
 * - User retrieval.
 * - User updates.
 * - User status changes.
 * - User deletion.
 *
 * This repository contains SQL only.
 *
 * It does NOT:
 *
 * - Perform authorization.
 * - Hash passwords.
 * - Handle HTTP.
 * - Generate tokens.
 * - Manage transactions.
 * ============================================================================
 */

import { randomUUID } from "node:crypto";

import {
    getQueryExecutor,
} from "../../database/queryExecutor.js";

/**
 * ============================================================================
 * SQL
 * ============================================================================
 */

const SELECT_USER_FIELDS = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status,
        u.email_verified_at,
        u.password_changed_at,
        u.last_login_at,
        u.deactivated_at,
        u.created_at,
        u.updated_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'code', r.code,
                        'name', r.name
                    )
                    ORDER BY r.code
                )
                FROM user_roles ur
                INNER JOIN roles r
                    ON r.id = ur.role_id
                WHERE ur.user_id = u.id
                  AND r.is_active = TRUE
            ),
            '[]'::jsonb
        ) AS roles
    FROM users u
`;

const FIND_USER_BY_ID = `
    ${SELECT_USER_FIELDS}
    WHERE u.id = $1
    LIMIT 1;
`;

const FIND_USER_BY_USERNAME = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status
    FROM users u
    WHERE LOWER(u.username) = LOWER($1)
    LIMIT 1;
`;

const FIND_USER_BY_EMAIL = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status
    FROM users u
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1;
`;

const CREATE_USER = `
    INSERT INTO users (
        id,
        username,
        email,
        password_hash,
        status
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
    )
    RETURNING
        id,
        username,
        email,
        status,
        email_verified_at,
        password_changed_at,
        last_login_at,
        deactivated_at,
        created_at,
        updated_at;
`;

const UPDATE_USER = `
    UPDATE users
    SET
        username = COALESCE($2, username),
        email = COALESCE($3, email)
    WHERE id = $1
    RETURNING
        id,
        username,
        email,
        status,
        email_verified_at,
        password_changed_at,
        last_login_at,
        deactivated_at,
        created_at,
        updated_at;
`;

const UPDATE_USER_STATUS = `
    UPDATE users
    SET
        status = $2 :: VARCHAR,
        deactivated_at = CASE
            WHEN $2::VARCHAR = 'inactive'
                THEN COALESCE(deactivated_at, CURRENT_TIMESTAMP)
            ELSE NULL
        END
    WHERE id = $1::UUID
    RETURNING
        id,
        username,
        email,
        status,
        email_verified_at,
        password_changed_at,
        last_login_at,
        deactivated_at,
        created_at,
        updated_at;
`;

const DELETE_USER = `
    DELETE FROM users
    WHERE id = $1
    RETURNING
        id,
        username,
        email,
        status;
`;

const COUNT_USERS = `
    SELECT COUNT(*)::bigint AS total
    FROM users;
`;

const FIND_USERS = `
    ${SELECT_USER_FIELDS}
    ORDER BY u.created_at DESC
    LIMIT $1
    OFFSET $2;
`;

/**
 * ============================================================================
 * Internal
 * ============================================================================
 */

/**
 * Resolve the application's query executor.
 *
 * @param {object|null} transactionContext
 *
 * @returns {object}
 */
function getExecutor(
    transactionContext = null,
) {
    return getQueryExecutor(
        transactionContext,
    );
}

/**
 * ============================================================================
 * Queries
 * ============================================================================
 */

/**
 * Find a user by ID.
 *
 * @param {string} userId
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function findUserById(
    userId,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USER_BY_ID,
            [userId],
        );

    return result.rows[0] ?? null;
}

/**
 * Find a user by username.
 *
 * @param {string} username
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function findUserByUsername(
    username,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USER_BY_USERNAME,
            [username],
        );

    return result.rows[0] ?? null;
}

/**
 * Find a user by email.
 *
 * @param {string} email
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function findUserByEmail(
    email,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USER_BY_EMAIL,
            [email],
        );

    return result.rows[0] ?? null;
}

/**
 * Create a user.
 *
 * @param {{
 *     username: string,
 *     email: string,
 *     passwordHash: string,
 *     status: string,
 * }} data
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object>}
 */
async function createUser(
    {
        username,
        email,
        passwordHash,
        status,
    },
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            CREATE_USER,
            [
                randomUUID(),
                username,
                email,
                passwordHash,
                status,
            ],
        );

    return result.rows[0];
}

/**
 * Update user identity information.
 *
 * @param {string} userId
 * @param {{
 *     username?: string,
 *     email?: string,
 * }} data
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function updateUser(
    userId,
    {
        username = null,
        email = null,
    },
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            UPDATE_USER,
            [
                userId,
                username,
                email,
            ],
        );

    return result.rows[0] ?? null;
}

/**
 * Update user status.
 *
 * @param {string} userId
 * @param {string} status
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function updateUserStatus(
    userId,
    status,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            UPDATE_USER_STATUS,
            [
                userId,
                status,
            ],
        );

    return result.rows[0] ?? null;
}

/**
 * Delete a user.
 *
 * @param {string} userId
 * @param {object|null} transactionContext
 *
 * @returns {Promise<object|null>}
 */
async function deleteUser(
    userId,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            DELETE_USER,
            [userId],
        );

    return result.rows[0] ?? null;
}

/**
 * Find users.
 *
 * @param {number} limit
 * @param {number} offset
 * @param {object|null} transactionContext
 *
 * @returns {Promise<Array<object>>}
 */
async function findUsers(
    limit,
    offset,
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            FIND_USERS,
            [
                limit,
                offset,
            ],
        );

    return result.rows;
}

/**
 * Count users.
 *
 * @param {object|null} transactionContext
 *
 * @returns {Promise<number>}
 */
async function countUsers(
    transactionContext = null,
) {
    const executor =
        getExecutor(
            transactionContext,
        );

    const result =
        await executor.query(
            COUNT_USERS,
        );

    return Number(
        result.rows[0]?.total ?? 0,
    );
}

/**
 * ============================================================================
 * Public API
 * ============================================================================
 */

const userRepository = Object.freeze({
    findUserById,
    findUserByUsername,
    findUserByEmail,

    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,

    findUsers,
    countUsers,
});

export default userRepository;