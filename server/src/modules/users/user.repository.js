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

import { getQueryExecutor } from "../../database/queryExecutor.js";

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

        u.first_name,
        u.last_name,
        u.phone,
        u.designation,

        u.organization_id,
        o.code AS organization_code,
        o.name AS organization_name,

        u.department_id,
        d.code AS department_code,
        d.name AS department_name,

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

    LEFT JOIN organizations o
        ON o.id = u.organization_id

    LEFT JOIN departments d
        ON d.id = u.department_id
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
        status,
        first_name,
        last_name,
        phone,
        designation,
        organization_id,
        department_id
    )
    VALUES (
        $1::UUID,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10::UUID,
        $11::UUID
    )
    RETURNING
        id,
        username,
        email,
        first_name,
        last_name,
        phone,
        designation,
        organization_id,
        department_id,
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
        username = CASE
            WHEN $2::BOOLEAN THEN $3
            ELSE username
        END,

        email = CASE
            WHEN $4::BOOLEAN THEN $5
            ELSE email
        END,

        first_name = CASE
            WHEN $6::BOOLEAN THEN $7
            ELSE first_name
        END,

        last_name = CASE
            WHEN $8::BOOLEAN THEN $9
            ELSE last_name
        END,

        phone = CASE
            WHEN $10::BOOLEAN THEN $11
            ELSE phone
        END,

        designation = CASE
            WHEN $12::BOOLEAN THEN $13
            ELSE designation
        END,

        organization_id = CASE
            WHEN $14::BOOLEAN THEN $15::UUID
            ELSE organization_id
        END,

        department_id = CASE
            WHEN $16::BOOLEAN THEN $17::UUID
            ELSE department_id
        END

    WHERE id = $1::UUID

    RETURNING
        id,
        username,
        email,
        first_name,
        last_name,
        phone,
        designation,
        organization_id,
        department_id,
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
function getExecutor(transactionContext = null) {
  return getQueryExecutor(transactionContext);
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
async function findUserById(userId, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(FIND_USER_BY_ID, [userId]);

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
async function findUserByUsername(username, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(FIND_USER_BY_USERNAME, [username]);

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
async function findUserByEmail(email, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(FIND_USER_BY_EMAIL, [email]);

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
    firstName = null,
    lastName = null,
    phone = null,
    designation = null,
    organizationId = null,
    departmentId = null,
  },
  transactionContext = null,
) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(CREATE_USER, [
    randomUUID(),
    username,
    email,
    passwordHash,
    status,
    firstName,
    lastName,
    phone,
    designation,
    organizationId,
    departmentId,
  ]);

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
async function updateUser(userId, data, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(UPDATE_USER, [
    userId,

    data.username !== undefined,
    data.username ?? null,

    data.email !== undefined,
    data.email ?? null,

    data.firstName !== undefined,
    data.firstName ?? null,

    data.lastName !== undefined,
    data.lastName ?? null,

    data.phone !== undefined,
    data.phone ?? null,

    data.designation !== undefined,
    data.designation ?? null,

    data.organizationId !== undefined,
    data.organizationId ?? null,

    data.departmentId !== undefined,
    data.departmentId ?? null,
  ]);

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
async function updateUserStatus(userId, status, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(UPDATE_USER_STATUS, [userId, status]);

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
async function deleteUser(userId, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(DELETE_USER, [userId]);

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
async function findUsers(limit, offset, transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(FIND_USERS, [limit, offset]);

  return result.rows;
}

/**
 * Count users.
 *
 * @param {object|null} transactionContext
 *
 * @returns {Promise<number>}
 */
async function countUsers(transactionContext = null) {
  const executor = getExecutor(transactionContext);

  const result = await executor.query(COUNT_USERS);

  return Number(result.rows[0]?.total ?? 0);
}

async function findOrganizationById(
    organizationId,
    transactionContext = null,
) {
    const result =
        await getExecutor(
            transactionContext,
        ).query(
            `
                SELECT
                    id,
                    code,
                    name,
                    status
                FROM organizations
                WHERE id = $1::UUID
                LIMIT 1;
            `,
            [organizationId],
        );

    return result.rows[0] ?? null;
}


async function findDepartmentById(
    departmentId,
    transactionContext = null,
) {
    const result =
        await getExecutor(
            transactionContext,
        ).query(
            `
                SELECT
                    id,
                    organization_id,
                    code,
                    name,
                    status
                FROM departments
                WHERE id = $1::UUID
                LIMIT 1;
            `,
            [departmentId],
        );

    return result.rows[0] ?? null;
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
  findDepartmentById,
  findOrganizationById
});

export default userRepository;
